"""Report generation and export endpoints."""
import io
import csv
from flask import Blueprint, jsonify, request, Response
from flask_jwt_extended import jwt_required, get_jwt
from sqlalchemy import func
from app import db
from app.models.user import User
from app.models.campaign import Campaign, CampaignAssignment
from app.models.interaction import InteractionLog, ScoreHistory

reports_bp = Blueprint("reports", __name__)


def require_admin():
    if get_jwt().get("role") != "admin":
        return jsonify({"error": "Admin access required"}), 403
    return None


@reports_bp.get("/campaign/<int:cid>")
@jwt_required()
def campaign_report(cid):
    err = require_admin()
    if err:
        return err

    campaign = Campaign.query.get_or_404(cid)
    assignments = campaign.assignments.all()
    rows = []

    for a in assignments:
        user = User.query.get(a.user_id)
        logs = InteractionLog.query.filter_by(
            assignment_id=a.id
        ).order_by(InteractionLog.timestamp).all()
        actions = [l.action_type for l in logs]
        first_action_ts = logs[0].timestamp.isoformat() if logs else None

        rows.append({
            "user_id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "department": user.department,
            "delivery_status": a.delivery_status,
            "sent_at": a.sent_at.isoformat() if a.sent_at else None,
            "actions": actions,
            "opened": "opened" in actions,
            "clicked": "clicked" in actions,
            "submitted": "submitted_fake_credentials" in actions,
            "reported": "reported" in actions,
            "vulnerability_score": user.vulnerability_score,
            "first_action_at": first_action_ts,
        })

    dept = request.args.get("department")
    if dept:
        rows = [r for r in rows if r["department"] == dept]

    return jsonify({
        "campaign": campaign.to_dict(),
        "rows": rows,
        "summary": {
            "total": len(rows),
            "opened": sum(1 for r in rows if r["opened"]),
            "clicked": sum(1 for r in rows if r["clicked"]),
            "submitted": sum(1 for r in rows if r["submitted"]),
            "reported": sum(1 for r in rows if r["reported"]),
        },
    }), 200


@reports_bp.get("/campaign/<int:cid>/export/csv")
@jwt_required()
def export_csv(cid):
    err = require_admin()
    if err:
        return err

    campaign = Campaign.query.get_or_404(cid)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "User ID", "Full Name", "Email", "Department",
        "Delivery Status", "Sent At", "Opened", "Clicked",
        "Submitted Fake Credentials", "Reported", "Vulnerability Score"
    ])

    for a in campaign.assignments.all():
        user = User.query.get(a.user_id)
        logs = [l.action_type for l in InteractionLog.query.filter_by(assignment_id=a.id).all()]
        writer.writerow([
            user.id, user.full_name, user.email, user.department,
            a.delivery_status,
            a.sent_at.isoformat() if a.sent_at else "",
            "opened" in logs,
            "clicked" in logs,
            "submitted_fake_credentials" in logs,
            "reported" in logs,
            user.vulnerability_score,
        ])

    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment;filename=campaign_{cid}_report.csv"},
    )


@reports_bp.get("/users/risk-summary")
@jwt_required()
def risk_summary():
    err = require_admin()
    if err:
        return err

    users = User.query.filter_by(role="employee", is_active=True)\
                      .order_by(User.vulnerability_score.asc()).all()
    return jsonify({
        "users": [{
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "department": u.department,
            "vulnerability_score": u.vulnerability_score,
            "risk_level": u.risk_level(),
            "points": u.points,
        } for u in users]
    }), 200
