from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt
)
from app import db
from app.models.user import User

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/register")
def register():
    data = request.get_json()
    full_name = data.get("full_name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    department = data.get("department", "General").strip() or "General"

    if not full_name or not email or not password:
        return jsonify({"error": "Full name, email and password are required"}), 400
    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "An account with this email already exists"}), 409

    user = User(full_name=full_name, email=email, role="employee", department=department)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    claims = {"role": user.role, "department": user.department}
    access_token = create_access_token(identity=str(user.id), additional_claims=claims)
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": user.to_dict(),
    }), 201


@auth_bp.post("/login")
def login():
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = User.query.filter_by(email=email, is_active=True).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid credentials"}), 401

    user.last_login = datetime.utcnow()
    db.session.commit()

    additional_claims = {"role": user.role, "department": user.department}
    access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": user.to_dict(),
    }), 200


@auth_bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({"error": "User not found"}), 404
    claims = {"role": user.role, "department": user.department}
    access_token = create_access_token(identity=str(user.id), additional_claims=claims)
    return jsonify({"access_token": access_token}), 200


@auth_bp.get("/me")
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": user.to_dict()}), 200


@auth_bp.post("/logout")
@jwt_required()
def logout():
    return jsonify({"message": "Logged out successfully"}), 200


@auth_bp.post("/change-password")
@jwt_required()
def change_password():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    data = request.get_json()
    current_pw = data.get("current_password", "")
    new_pw = data.get("new_password", "")

    if not user.check_password(current_pw):
        return jsonify({"error": "Current password is incorrect"}), 400
    if len(new_pw) < 8:
        return jsonify({"error": "New password must be at least 8 characters"}), 400

    user.set_password(new_pw)
    db.session.commit()
    return jsonify({"message": "Password changed successfully"}), 200
