"""
AI Email Generation Routes
Admin-facing endpoints for generating, reviewing, and approving AI phishing emails.
"""
import json
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from app import db
from app.models.campaign import Campaign, GeneratedEmail
from app.models.prompt import PromptLog
from app.services.ai_service import generate_phishing_email

ai_bp = Blueprint("ai", __name__)


def require_admin():
    if get_jwt().get("role") != "admin":
        return jsonify({"error": "Admin access required"}), 403
    return None


@ai_bp.post("/generate/<int:campaign_id>")
@jwt_required()
def generate(campaign_id):
    """
    Generate 1-3 unique email variations for a campaign using the local LLM.
    """
    err = require_admin()
    if err:
        return err

    campaign = Campaign.query.get_or_404(campaign_id)
    data = request.get_json() or {}
    num_variations = min(int(data.get("variations", 3)), 5)

    params = {
        "topic": campaign.topic,
        "tone": campaign.tone,
        "urgency": campaign.urgency,
        "difficulty": campaign.difficulty,
        "department_target": campaign.department_target,
        "company_name": data.get("company_name", "AcmeCorp"),
        "employee_name": "{{EMPLOYEE_NAME}}",
    }

    generated_emails = []

    for i in range(1, num_variations + 1):
        result = generate_phishing_email(params, variation_number=i)

        # Persist to DB
        email = GeneratedEmail(
            campaign_id=campaign_id,
            subject=result.get("subject", f"Security Notice - Variation {i}"),
            body=result.get("body", ""),
            sender_name=result.get("sender_name", "IT Support"),
            sender_email=result.get("sender_email", "support@company-help.com"),
            difficulty=campaign.difficulty,
            variation_number=i,
            approved=False,
            red_flags=json.dumps(result.get("red_flags", [])),
        )
        db.session.add(email)
        db.session.flush()  # Get ID before log

        # Log prompt for audit
        log = PromptLog(
            campaign_id=campaign_id,
            prompt_text=result.get("prompt_used", ""),
            model_response=json.dumps({
                "subject": result.get("subject"),
                "body": result.get("body"),
                "red_flags": result.get("red_flags"),
            }),
            model_name="ollama/llama3.2",
            safety_status=result.get("safety_status", "pending"),
            safety_notes=result.get("safety_notes", ""),
            generation_time_ms=result.get("generation_time_ms", 0),
        )
        db.session.add(log)

        generated_emails.append({
            **email.to_dict(),
            "red_flags": result.get("red_flags", []),
            "training_tip": result.get("training_tip", ""),
            "safety_status": result.get("safety_status", "passed"),
            "generation_time_ms": result.get("generation_time_ms", 0),
        })

    db.session.commit()

    return jsonify({
        "message": f"Generated {len(generated_emails)} email variations",
        "emails": generated_emails,
    }), 201


@ai_bp.get("/emails/<int:campaign_id>")
@jwt_required()
def get_generated_emails(campaign_id):
    """List all AI-generated emails for a campaign with red flags."""
    err = require_admin()
    if err:
        return err
    campaign = Campaign.query.get_or_404(campaign_id)
    emails = campaign.emails.all()
    result = []
    for e in emails:
        d = e.to_dict()
        try:
            d["red_flags"] = json.loads(e.red_flags) if e.red_flags else []
        except Exception:
            d["red_flags"] = []
        result.append(d)
    return jsonify({"emails": result}), 200


@ai_bp.delete("/emails/<int:email_id>")
@jwt_required()
def delete_email(email_id):
    err = require_admin()
    if err:
        return err
    email = GeneratedEmail.query.get_or_404(email_id)
    if email.approved:
        return jsonify({"error": "Cannot delete approved email. Unapprove first."}), 400
    db.session.delete(email)
    db.session.commit()
    return jsonify({"message": "Email deleted"}), 200


@ai_bp.get("/prompt-logs/<int:campaign_id>")
@jwt_required()
def prompt_logs(campaign_id):
    err = require_admin()
    if err:
        return err
    logs = PromptLog.query.filter_by(campaign_id=campaign_id)\
                          .order_by(PromptLog.created_at.desc()).all()
    return jsonify({"logs": [l.to_dict() for l in logs]}), 200
