from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from app import db
from app.models.user import User
from app.models.interaction import ScoreHistory
from app.services.adaptive_engine import get_adaptive_params

users_bp = Blueprint("users", __name__)


def require_admin():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin access required"}), 403
    return None


@users_bp.get("/")
@jwt_required()
def list_users():
    err = require_admin()
    if err:
        return err
    dept = request.args.get("department")
    role = request.args.get("role")
    query = User.query
    if dept:
        query = query.filter_by(department=dept)
    if role:
        query = query.filter_by(role=role)
    users = query.order_by(User.full_name).all()
    return jsonify({"users": [u.to_dict() for u in users]}), 200


@users_bp.post("/")
@jwt_required()
def create_user():
    err = require_admin()
    if err:
        return err
    data = request.get_json()
    required = ["full_name", "email", "password", "role", "department"]
    for f in required:
        if not data.get(f):
            return jsonify({"error": f"{f} is required"}), 400

    if User.query.filter_by(email=data["email"].lower()).first():
        return jsonify({"error": "Email already exists"}), 409

    user = User(
        full_name=data["full_name"],
        email=data["email"].lower(),
        role=data["role"],
        department=data["department"],
    )
    user.set_password(data["password"])
    db.session.add(user)
    db.session.commit()
    return jsonify({"user": user.to_dict(), "message": "User created"}), 201


@users_bp.get("/<int:uid>")
@jwt_required()
def get_user(uid):
    claims = get_jwt()
    current_id = int(get_jwt_identity())
    if claims.get("role") != "admin" and current_id != uid:
        return jsonify({"error": "Access denied"}), 403

    user = User.query.get_or_404(uid)
    data = user.to_dict()
    data["adaptive"] = get_adaptive_params(user)
    data["badge_count"] = user.badges.count()
    data["score_history"] = [s.to_dict() for s in
                              user.score_history.order_by(ScoreHistory.created_at.desc()).limit(10)]
    return jsonify({"user": data}), 200


@users_bp.put("/<int:uid>")
@jwt_required()
def update_user(uid):
    err = require_admin()
    if err:
        return err
    user = User.query.get_or_404(uid)
    data = request.get_json()
    if "full_name" in data:
        user.full_name = data["full_name"]
    if "department" in data:
        user.department = data["department"]
    if "role" in data:
        user.role = data["role"]
    if "is_active" in data:
        user.is_active = data["is_active"]
    db.session.commit()
    return jsonify({"user": user.to_dict()}), 200


@users_bp.delete("/<int:uid>")
@jwt_required()
def deactivate_user(uid):
    err = require_admin()
    if err:
        return err
    user = User.query.get_or_404(uid)
    user.is_active = False
    db.session.commit()
    return jsonify({"message": "User deactivated"}), 200


@users_bp.get("/departments")
@jwt_required()
def get_departments():
    depts = db.session.query(User.department).distinct().all()
    return jsonify({"departments": [d[0] for d in depts]}), 200
