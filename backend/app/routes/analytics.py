"""Analytics endpoints for admin dashboards and employee self-service."""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from sqlalchemy import func, and_
from app import db
from app.models.user import User
from app.models.campaign import Campaign, CampaignAssignment
from app.models.interaction import InteractionLog, ScoreHistory

analytics_bp = Blueprint("analytics", __name__)


def require_admin():
    if get_jwt().get("role") != "admin":
        return jsonify({"error": "Admin access required"}), 403
    return None


# ─── Admin Overview ───────────────────────────────────────────────────────────

@analytics_bp.get("/overview")
@jwt_required()
def overview():
    err = require_admin()
    if err:
        return err

    total_users = User.query.filter_by(role="employee", is_active=True).count()
    total_campaigns = Campaign.query.count()
    active_campaigns = Campaign.query.filter_by(status="active").count()

    # Interaction counts
    action_counts = db.session.query(
        InteractionLog.action_type, func.count(InteractionLog.id)
    ).group_by(InteractionLog.action_type).all()
    counts = {a: c for a, c in action_counts}

    # Avg vulnerability score
    avg_score = db.session.query(func.avg(User.vulnerability_score))\
                          .filter(User.role == "employee").scalar() or 50

    # Risk distribution
    high_risk = User.query.filter(User.role == "employee",
                                  User.vulnerability_score <= 30).count()
    medium_risk = User.query.filter(User.role == "employee",
                                    User.vulnerability_score > 30,
                                    User.vulnerability_score <= 70).count()
    low_risk = User.query.filter(User.role == "employee",
                                  User.vulnerability_score > 70).count()

    return jsonify({
        "total_users": total_users,
        "total_campaigns": total_campaigns,
        "active_campaigns": active_campaigns,
        "avg_vulnerability_score": round(float(avg_score), 1),
        "interactions": {
            "opened": counts.get("opened", 0),
            "clicked": counts.get("clicked", 0),
            "submitted": counts.get("submitted_fake_credentials", 0),
            "reported": counts.get("reported", 0),
            "ignored": counts.get("ignored", 0),
        },
        "risk_distribution": {
            "high": high_risk,
            "medium": medium_risk,
            "low": low_risk,
        },
        "click_rate": _safe_rate(counts.get("clicked", 0),
                                  counts.get("opened", 1)),
        "report_rate": _safe_rate(counts.get("reported", 0),
                                   counts.get("opened", 1)),
    }), 200


@analytics_bp.get("/campaigns/<int:cid>/stats")
@jwt_required()
def campaign_stats(cid):
    err = require_admin()
    if err:
        return err

    campaign = Campaign.query.get_or_404(cid)
    total_assigned = campaign.assignments.count()
    sent = campaign.assignments.filter_by(delivery_status="sent").count()

    action_counts = db.session.query(
        InteractionLog.action_type, func.count(InteractionLog.id)
    ).filter(InteractionLog.campaign_id == cid)\
     .group_by(InteractionLog.action_type).all()
    counts = {a: c for a, c in action_counts}

    opened = counts.get("opened", 0)
    clicked = counts.get("clicked", 0)
    submitted = counts.get("submitted_fake_credentials", 0)
    reported = counts.get("reported", 0)

    return jsonify({
        "campaign": campaign.to_dict(),
        "total_assigned": total_assigned,
        "total_sent": sent,
        "opened": opened,
        "clicked": clicked,
        "submitted": submitted,
        "reported": reported,
        "open_rate": _safe_rate(opened, sent),
        "click_rate": _safe_rate(clicked, opened),
        "submit_rate": _safe_rate(submitted, clicked),
        "report_rate": _safe_rate(reported, sent),
    }), 200


@analytics_bp.get("/risk-heatmap")
@jwt_required()
def risk_heatmap():
    """Returns department-level risk aggregation for heatmap chart."""
    err = require_admin()
    if err:
        return err

    dept_scores = db.session.query(
        User.department,
        func.avg(User.vulnerability_score),
        func.count(User.id),
    ).filter(User.role == "employee", User.is_active == True)\
     .group_by(User.department).all()

    data = []
    for dept, avg_score, count in dept_scores:
        data.append({
            "department": dept,
            "avg_score": round(float(avg_score), 1),
            "user_count": count,
            "risk_level": _risk_level(float(avg_score)),
        })
    return jsonify({"heatmap": data}), 200


@analytics_bp.get("/score-trend")
@jwt_required()
def score_trend():
    """Score history over time (last 30 events per user or campaign)."""
    err = require_admin()
    if err:
        return err

    campaign_id = request.args.get("campaign_id", type=int)
    user_id = request.args.get("user_id", type=int)

    q = db.session.query(ScoreHistory)
    if campaign_id:
        q = q.filter(ScoreHistory.campaign_id == campaign_id)
    if user_id:
        q = q.filter(ScoreHistory.user_id == user_id)

    history = q.order_by(ScoreHistory.created_at).limit(100).all()
    return jsonify({"trend": [h.to_dict() for h in history]}), 200


@analytics_bp.get("/top-at-risk")
@jwt_required()
def top_at_risk():
    err = require_admin()
    if err:
        return err
    limit = request.args.get("limit", 10, type=int)
    users = User.query.filter_by(role="employee", is_active=True)\
                      .order_by(User.vulnerability_score.asc())\
                      .limit(limit).all()
    return jsonify({
        "users": [{
            **u.to_dict(),
            "risk_level": u.risk_level(),
        } for u in users]
    }), 200


# ─── Employee self-service ────────────────────────────────────────────────────

@analytics_bp.get("/my-stats")
@jwt_required()
def my_stats():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)

    action_counts = db.session.query(
        InteractionLog.action_type, func.count(InteractionLog.id)
    ).filter(InteractionLog.user_id == user_id)\
     .group_by(InteractionLog.action_type).all()
    counts = {a: c for a, c in action_counts}

    score_history = ScoreHistory.query.filter_by(user_id=user_id)\
                                      .order_by(ScoreHistory.created_at)\
                                      .limit(30).all()

    return jsonify({
        "user": user.to_dict(),
        "risk_level": user.risk_level(),
        "interactions": {
            "opened": counts.get("opened", 0),
            "clicked": counts.get("clicked", 0),
            "submitted": counts.get("submitted_fake_credentials", 0),
            "reported": counts.get("reported", 0),
        },
        "score_history": [h.to_dict() for h in score_history],
    }), 200


def _safe_rate(num, denom):
    if not denom:
        return 0.0
    return round((num / denom) * 100, 1)


def _risk_level(score):
    if score <= 30:
        return "high"
    elif score <= 70:
        return "medium"
    return "low"
