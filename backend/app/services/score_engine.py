"""
Vulnerability Score Engine
Calculates and updates a user's risk score (0-100) based on their interactions
with phishing simulations.

Score Rules:
  - Start score: 50
  - Report phishing (correct behavior):   -10
  - Report fast (< 5 min):                -5 extra bonus
  - Open email only (no action):          no penalty
  - Ignore email completely:              +5 (missed opportunity)
  - Click phishing link:                  +15
  - Submit fake credentials:              +25
  - Repeated good behavior (3 reports):   -3 extra
  Score clamped to [0, 100]
"""
from datetime import datetime, timedelta
from app import db


SCORE_DELTAS = {
    "reported": -10,
    "reported_fast": -5,        # bonus stacked on reported
    "opened": 0,
    "ignored": 5,
    "clicked": 15,
    "submitted_fake_credentials": 25,
}

FAST_REPORT_THRESHOLD_MINUTES = 5


def update_score(user, action_type: str, campaign_id: int = None,
                 interaction_timestamp: datetime = None, sent_at: datetime = None) -> dict:
    """
    Apply score delta for action_type and persist to DB.
    Returns dict with old_score, new_score, delta, reason.
    """
    from app.models.interaction import ScoreHistory, InteractionLog

    old_score = user.vulnerability_score
    delta = SCORE_DELTAS.get(action_type, 0)
    reason_parts = [f"Action: {action_type}"]

    # Fast-report bonus
    if action_type == "reported" and sent_at and interaction_timestamp:
        elapsed = (interaction_timestamp - sent_at).total_seconds() / 60
        if elapsed <= FAST_REPORT_THRESHOLD_MINUTES:
            delta += SCORE_DELTAS["reported_fast"]
            reason_parts.append("fast report bonus")

    # Repeated good-behavior bonus: 3+ reports in last 30 days
    if action_type == "reported":
        recent_reports = db.session.query(InteractionLog).filter(
            InteractionLog.user_id == user.id,
            InteractionLog.action_type == "reported",
            InteractionLog.timestamp >= datetime.utcnow() - timedelta(days=30),
        ).count()
        if recent_reports >= 3:
            delta -= 3
            reason_parts.append("streak bonus (3+ reports)")

    new_score = max(0, min(100, old_score + delta))
    user.vulnerability_score = new_score

    if delta != 0:
        history = ScoreHistory(
            user_id=user.id,
            campaign_id=campaign_id,
            old_score=old_score,
            new_score=new_score,
            delta=delta,
            reason=", ".join(reason_parts),
        )
        db.session.add(history)

    db.session.commit()
    return {
        "old_score": old_score,
        "new_score": new_score,
        "delta": delta,
        "reason": ", ".join(reason_parts),
    }


def get_risk_level(score: int) -> str:
    if score <= 30:
        return "high"
    elif score <= 70:
        return "medium"
    return "low"


def get_risk_color(score: int) -> str:
    level = get_risk_level(score)
    return {"high": "#ef4444", "medium": "#f59e0b", "low": "#10b981"}[level]
