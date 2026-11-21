import secrets
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from app import db
from app.models.campaign import Campaign, GeneratedEmail, CampaignAssignment
from app.models.user import User
from app.services.email_service import send_simulation_email

campaigns_bp = Blueprint("campaigns", __name__)


def require_admin():
    if get_jwt().get("role") != "admin":
        return jsonify({"error": "Admin access required"}), 403
    return None


# ─── Campaign CRUD ──────────────────────────────────────────────────────────

@campaigns_bp.get("/")
@jwt_required()
def list_campaigns():
    err = require_admin()
    if err:
        return err
    status = request.args.get("status")
    q = Campaign.query
    if status:
        q = q.filter_by(status=status)
    campaigns = q.order_by(Campaign.created_at.desc()).all()
    return jsonify({"campaigns": [c.to_dict() for c in campaigns]}), 200


@campaigns_bp.post("/")
@jwt_required()
def create_campaign():
    err = require_admin()
    if err:
        return err
    data = request.get_json()
    admin_id = int(get_jwt_identity())

    required = ["title", "topic", "tone", "urgency", "department_target"]
    for f in required:
        if not data.get(f):
            return jsonify({"error": f"{f} is required"}), 400

    campaign = Campaign(
        title=data["title"],
        topic=data["topic"],
        tone=data["tone"],
        urgency=data["urgency"],
        difficulty=data.get("difficulty", "medium"),
        department_target=data["department_target"],
        description=data.get("description", ""),
        status="draft",
        created_by=admin_id,
    )
    db.session.add(campaign)
    db.session.commit()
    return jsonify({"campaign": campaign.to_dict(), "message": "Campaign created"}), 201


@campaigns_bp.get("/<int:cid>")
@jwt_required()
def get_campaign(cid):
    err = require_admin()
    if err:
        return err
    campaign = Campaign.query.get_or_404(cid)
    data = campaign.to_dict()
    data["emails"] = [e.to_dict() for e in campaign.emails.all()]
    data["assignments"] = [a.to_dict() for a in campaign.assignments.all()]
    return jsonify({"campaign": data}), 200


@campaigns_bp.put("/<int:cid>")
@jwt_required()
def update_campaign(cid):
    err = require_admin()
    if err:
        return err
    campaign = Campaign.query.get_or_404(cid)
    if campaign.status not in ("draft", "pending_approval"):
        return jsonify({"error": "Cannot edit an active or completed campaign"}), 400
    data = request.get_json()
    for field in ["title", "topic", "tone", "urgency", "difficulty", "department_target", "description"]:
        if field in data:
            setattr(campaign, field, data[field])
    db.session.commit()
    return jsonify({"campaign": campaign.to_dict()}), 200


@campaigns_bp.delete("/<int:cid>")
@jwt_required()
def delete_campaign(cid):
    err = require_admin()
    if err:
        return err
    campaign = Campaign.query.get_or_404(cid)
    if campaign.status == "active":
        return jsonify({"error": "Cannot delete an active campaign. Pause it first."}), 400
    db.session.delete(campaign)
    db.session.commit()
    return jsonify({"message": "Campaign deleted"}), 200


# ─── Campaign Status Actions ─────────────────────────────────────────────────

@campaigns_bp.post("/<int:cid>/activate")
@jwt_required()
def activate_campaign(cid):
    err = require_admin()
    if err:
        return err
    campaign = Campaign.query.get_or_404(cid)

    approved = campaign.emails.filter_by(approved=True).first()
    if not approved:
        return jsonify({"error": "Approve at least one email before activating"}), 400

    if campaign.assignments.count() == 0:
        return jsonify({"error": "Assign users to the campaign before activating"}), 400

    campaign.status = "active"
    campaign.launched_at = datetime.utcnow()
    db.session.commit()

    # Send emails
    base_url = request.host_url.rstrip("/")
    sent, failed = 0, 0
    for assignment in campaign.assignments.filter_by(delivery_status="pending"):
        assignment.email_id = approved.id
        ok = send_simulation_email(assignment, approved, base_url)
        sent += 1 if ok else 0
        failed += 0 if ok else 1

    return jsonify({
        "message": f"Campaign activated. {sent} emails sent, {failed} failed.",
        "campaign": campaign.to_dict(),
    }), 200


@campaigns_bp.post("/<int:cid>/pause")
@jwt_required()
def pause_campaign(cid):
    err = require_admin()
    if err:
        return err
    campaign = Campaign.query.get_or_404(cid)
    campaign.status = "paused"
    db.session.commit()
    return jsonify({"message": "Campaign paused", "campaign": campaign.to_dict()}), 200


@campaigns_bp.post("/<int:cid>/complete")
@jwt_required()
def complete_campaign(cid):
    err = require_admin()
    if err:
        return err
    campaign = Campaign.query.get_or_404(cid)
    campaign.status = "completed"
    campaign.completed_at = datetime.utcnow()
    db.session.commit()
    return jsonify({"message": "Campaign marked complete", "campaign": campaign.to_dict()}), 200


# ─── Assignment Management ────────────────────────────────────────────────────

@campaigns_bp.post("/<int:cid>/assign")
@jwt_required()
def assign_users(cid):
    err = require_admin()
    if err:
        return err
    campaign = Campaign.query.get_or_404(cid)
    data = request.get_json()
    user_ids = data.get("user_ids", [])
    department = data.get("department")

    if department:
        users = User.query.filter_by(department=department, role="employee", is_active=True).all()
        user_ids = [u.id for u in users]

    if not user_ids:
        return jsonify({"error": "No users specified"}), 400

    added = 0
    for uid in user_ids:
        existing = CampaignAssignment.query.filter_by(
            campaign_id=cid, user_id=uid
        ).first()
        if not existing:
            assignment = CampaignAssignment(
                campaign_id=cid,
                user_id=uid,
                tracking_token=secrets.token_urlsafe(32),
            )
            db.session.add(assignment)
            added += 1

    db.session.commit()
    return jsonify({"message": f"{added} users assigned to campaign"}), 200


# ─── Email Management ─────────────────────────────────────────────────────────

@campaigns_bp.post("/<int:cid>/emails/<int:eid>/approve")
@jwt_required()
def approve_email(cid, eid):
    err = require_admin()
    if err:
        return err
    email = GeneratedEmail.query.filter_by(id=eid, campaign_id=cid).first_or_404()
    # Unapprove all others first (one approved email per campaign)
    GeneratedEmail.query.filter_by(campaign_id=cid, approved=True).update({"approved": False})
    email.approved = True
    data = request.get_json() or {}
    if data.get("admin_notes"):
        email.admin_notes = data["admin_notes"]
    campaign = Campaign.query.get(cid)
    campaign.status = "pending_approval"
    db.session.commit()
    return jsonify({"email": email.to_dict(), "message": "Email approved"}), 200


@campaigns_bp.put("/<int:cid>/emails/<int:eid>")
@jwt_required()
def edit_email(cid, eid):
    err = require_admin()
    if err:
        return err
    email = GeneratedEmail.query.filter_by(id=eid, campaign_id=cid).first_or_404()
    data = request.get_json()
    for field in ["subject", "body", "sender_name", "sender_email", "admin_notes"]:
        if field in data:
            setattr(email, field, data[field])
    db.session.commit()
    return jsonify({"email": email.to_dict()}), 200
