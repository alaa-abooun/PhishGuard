from datetime import datetime
from app import db
import bcrypt


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="employee")  # admin | employee
    department = db.Column(db.String(80), nullable=False, default="General")
    vulnerability_score = db.Column(db.Integer, default=50)  # 0-100
    points = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)

    # Relationships
    score_history = db.relationship("ScoreHistory", backref="user", lazy="dynamic")
    interaction_logs = db.relationship("InteractionLog", backref="user", lazy="dynamic")
    badges = db.relationship("UserBadge", backref="user", lazy="dynamic")
    assignments = db.relationship("CampaignAssignment", backref="user", lazy="dynamic")

    def set_password(self, password):
        self.password_hash = bcrypt.hashpw(
            password.encode("utf-8"), bcrypt.gensalt()
        ).decode("utf-8")

    def check_password(self, password):
        return bcrypt.checkpw(
            password.encode("utf-8"), self.password_hash.encode("utf-8")
        )

    def to_dict(self, include_score=True):
        data = {
            "id": self.id,
            "full_name": self.full_name,
            "email": self.email,
            "role": self.role,
            "department": self.department,
            "points": self.points,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
            "last_login": self.last_login.isoformat() if self.last_login else None,
        }
        if include_score:
            data["vulnerability_score"] = self.vulnerability_score
        return data

    def risk_level(self):
        if self.vulnerability_score <= 30:
            return "high"
        elif self.vulnerability_score <= 70:
            return "medium"
        return "low"
