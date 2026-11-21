"""Gamification: points, badges, leaderboard logic."""
from app import db
from app.models.gamification import Badge, UserBadge
from app.models.interaction import InteractionLog


POINTS_MAP = {
    "reported": 50,
    "reported_fast": 25,  # bonus
    "opened": 0,
    "clicked": 0,
    "submitted_fake_credentials": 0,
    "ignored": 0,
}


def award_points(user, action_type: str, fast_report: bool = False):
    pts = POINTS_MAP.get(action_type, 0)
    if action_type == "reported" and fast_report:
        pts += POINTS_MAP["reported_fast"]
    user.points += pts
    db.session.commit()
    return pts


def check_and_award_badges(user, action_type: str):
    """Evaluate all badge conditions and award newly earned badges."""
    awarded = []
    all_badges = Badge.query.all()
    earned_ids = {ub.badge_id for ub in user.badges}

    for badge in all_badges:
        if badge.id in earned_ids:
            continue
        if _check_condition(user, badge, action_type):
            ub = UserBadge(user_id=user.id, badge_id=badge.id)
            db.session.add(ub)
            awarded.append(badge)

    if awarded:
        db.session.commit()
    return awarded


def _check_condition(user, badge, current_action):
    ct = badge.condition_type
    val = badge.condition_value

    if ct == "first_report" and current_action == "reported":
        total = InteractionLog.query.filter_by(
            user_id=user.id, action_type="reported"
        ).count()
        return total >= 1

    if ct == "report_streak" and current_action == "reported":
        total = InteractionLog.query.filter_by(
            user_id=user.id, action_type="reported"
        ).count()
        return total >= val

    if ct == "low_score":
        return user.vulnerability_score <= val

    if ct == "high_points":
        return user.points >= val

    if ct == "zero_clicks":
        clicks = InteractionLog.query.filter_by(
            user_id=user.id, action_type="clicked"
        ).count()
        return clicks == 0 and current_action == "reported"

    return False


def get_leaderboard(limit=20):
    from app.models.user import User
    users = User.query.filter_by(role="employee", is_active=True)\
                      .order_by(User.points.desc())\
                      .limit(limit).all()
    board = []
    for rank, u in enumerate(users, 1):
        board.append({
            "rank": rank,
            "user_id": u.id,
            "full_name": u.full_name,
            "department": u.department,
            "points": u.points,
            "vulnerability_score": u.vulnerability_score,
            "badge_count": u.badges.count(),
        })
    return board
