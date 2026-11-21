"""
Tracking Routes — no authentication required (accessed via email links/pixels).
Records user interactions and redirects to appropriate pages.

IMPORTANT: Fake credential form NEVER stores real passwords.
           It only records that a submission attempt happened.
"""
import json
from datetime import datetime
from flask import Blueprint, request, jsonify, redirect, current_app
from app import db
from app.models.campaign import CampaignAssignment, GeneratedEmail
from app.models.interaction import InteractionLog
from app.models.user import User
from app.services.score_engine import update_score
from app.services.gamification_service import award_points, check_and_award_badges

tracking_bp = Blueprint("tracking", __name__)

FRONTEND_URL = "http://localhost:3000"


def _get_assignment(token):
    return CampaignAssignment.query.filter_by(tracking_token=token).first()


def _log_action(assignment, action_type, metadata=None):
    """Record interaction if not already recorded for this action type."""
    existing = InteractionLog.query.filter_by(
        assignment_id=assignment.id,
        action_type=action_type,
    ).first()
    if existing:
        return existing  # idempotent

    log = InteractionLog(
        campaign_id=assignment.campaign_id,
        user_id=assignment.user_id,
        assignment_id=assignment.id,
        action_type=action_type,
        metadata_json=json.dumps(metadata or {}),
    )
    db.session.add(log)
    db.session.commit()
    return log


# ─── Tracking Pixel (email open) ─────────────────────────────────────────────

@tracking_bp.get("/open/<token>")
def track_open(token):
    """Returns a 1x1 transparent GIF; records email open event."""
    assignment = _get_assignment(token)
    if assignment:
        _log_action(assignment, "opened")
        user = User.query.get(assignment.user_id)
        update_score(user, "opened", assignment.campaign_id)

    # Return transparent 1x1 GIF
    gif = (
        b"\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00"
        b"\xff\xff\xff\x00\x00\x00\x21\xf9\x04\x00\x00\x00\x00"
        b"\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02"
        b"\x44\x01\x00\x3b"
    )
    from flask import Response
    return Response(gif, mimetype="image/gif",
                    headers={"Cache-Control": "no-store, no-cache, must-revalidate"})


# ─── Link Click ──────────────────────────────────────────────────────────────

@tracking_bp.get("/click/<token>")
def track_click(token):
    """Records link click and redirects to the simulated credential page."""
    assignment = _get_assignment(token)
    if assignment:
        _log_action(assignment, "clicked")
        user = User.query.get(assignment.user_id)
        update_score(user, "clicked", assignment.campaign_id)
        award_points(user, "clicked")
        check_and_award_badges(user, "clicked")

    frontend = current_app.config.get("FRONTEND_URL", FRONTEND_URL)
    return redirect(f"{frontend}/phishing-landing/{token}")


# ─── Phishing Landing Page Data ───────────────────────────────────────────────

@tracking_bp.get("/landing/<token>")
def landing_data(token):
    """Returns data for the simulated phishing credential page."""
    assignment = _get_assignment(token)
    if not assignment:
        return jsonify({"error": "Invalid simulation link"}), 404

    email = GeneratedEmail.query.get(assignment.email_id)
    user = User.query.get(assignment.user_id)

    return jsonify({
        "token": token,
        "campaign_id": assignment.campaign_id,
        "email_subject": email.subject if email else "Verify Your Account",
        "sender_name": email.sender_name if email else "IT Support",
        "user_name": user.full_name if user else "Employee",
    }), 200


# ─── Fake Credential Submission ───────────────────────────────────────────────

@tracking_bp.post("/submit/<token>")
def track_submit(token):
    """
    Records a fake credential submission attempt.
    NEVER stores the submitted username or password — only the fact that
    a submission attempt occurred, for Vulnerability Score tracking.
    """
    assignment = _get_assignment(token)
    if not assignment:
        return jsonify({"error": "Invalid token"}), 404

    # Log action — explicitly do NOT touch request body for credentials
    _log_action(assignment, "submitted_fake_credentials",
                {"note": "Credentials NOT stored — simulation only"})

    user = User.query.get(assignment.user_id)
    score_result = update_score(user, "submitted_fake_credentials", assignment.campaign_id)
    award_points(user, "submitted_fake_credentials")
    check_and_award_badges(user, "submitted_fake_credentials")

    email = GeneratedEmail.query.get(assignment.email_id)
    red_flags = []
    if email and email.red_flags:
        try:
            red_flags = json.loads(email.red_flags)
        except Exception:
            red_flags = []

    frontend = current_app.config.get("FRONTEND_URL", FRONTEND_URL)
    return jsonify({
        "redirect": f"{frontend}/training/{token}",
        "message": "This was a phishing simulation. Your response has been recorded.",
        "score_delta": score_result["delta"],
        "new_score": score_result["new_score"],
        "red_flags": red_flags,
    }), 200


# ─── Report Phishing ──────────────────────────────────────────────────────────

@tracking_bp.post("/report/<token>")
def track_report(token):
    """Employee reports the simulation email as phishing — correct behavior."""
    assignment = _get_assignment(token)
    if not assignment:
        return jsonify({"error": "Invalid token"}), 404

    log = _log_action(assignment, "reported")
    user = User.query.get(assignment.user_id)

    fast_report = False
    if assignment.sent_at:
        elapsed = (datetime.utcnow() - assignment.sent_at).total_seconds() / 60
        fast_report = elapsed <= 5

    score_result = update_score(
        user, "reported", assignment.campaign_id,
        interaction_timestamp=log.timestamp,
        sent_at=assignment.sent_at,
    )
    pts = award_points(user, "reported", fast_report=fast_report)
    new_badges = check_and_award_badges(user, "reported")

    return jsonify({
        "message": "Great job! You correctly identified this as a phishing simulation.",
        "score_delta": score_result["delta"],
        "new_score": score_result["new_score"],
        "points_earned": pts,
        "new_badges": [b.to_dict() for b in new_badges],
        "fast_report": fast_report,
    }), 200


# ─── Employee: get my interactions ───────────────────────────────────────────

@tracking_bp.get("/my-interactions")
def my_interactions():
    token = request.args.get("token")
    if not token:
        return jsonify({"error": "Token required"}), 400
    assignment = _get_assignment(token)
    if not assignment:
        return jsonify({"error": "Not found"}), 404
    logs = InteractionLog.query.filter_by(assignment_id=assignment.id).all()
    return jsonify({"interactions": [l.to_dict() for l in logs]}), 200
