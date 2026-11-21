from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from app.models.gamification import Badge, UserBadge
from app.models.user import User
from app.services.gamification_service import get_leaderboard

gamification_bp = Blueprint("gamification", __name__)


@gamification_bp.get("/leaderboard")
@jwt_required()
def leaderboard():
    limit = request.args.get("limit", 20, type=int)
    board = get_leaderboard(limit)
    return jsonify({"leaderboard": board}), 200


@gamification_bp.get("/badges")
@jwt_required()
def all_badges():
    badges = Badge.query.all()
    return jsonify({"badges": [b.to_dict() for b in badges]}), 200


@gamification_bp.get("/my-badges")
@jwt_required()
def my_badges():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    user_badges = user.badges.all()
    all_badges = Badge.query.all()

    earned_ids = {ub.badge_id for ub in user_badges}
    result = {
        "earned": [ub.to_dict() for ub in user_badges],
        "unearned": [b.to_dict() for b in all_badges if b.id not in earned_ids],
        "total_points": user.points,
        "points_rank": _get_rank(user),
    }
    return jsonify(result), 200


@gamification_bp.get("/user/<int:uid>/badges")
@jwt_required()
def user_badges(uid):
    if get_jwt().get("role") != "admin":
        return jsonify({"error": "Admin only"}), 403
    user = User.query.get_or_404(uid)
    return jsonify({
        "badges": [ub.to_dict() for ub in user.badges.all()],
        "points": user.points,
    }), 200


def _get_rank(user):
    users_with_more = User.query.filter(
        User.role == "employee",
        User.points > user.points,
        User.is_active == True,
    ).count()
    return users_with_more + 1
