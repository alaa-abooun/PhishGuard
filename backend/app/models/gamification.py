from datetime import datetime
from app import db


class Badge(db.Model):
    __tablename__ = "badges"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.String(300), nullable=False)
    icon = db.Column(db.String(50), default="🏅")
    condition = db.Column(db.String(200), nullable=False)  # human-readable trigger rule
    condition_type = db.Column(db.String(50), nullable=False)  # first_report|streak_3|score_low|etc.
    condition_value = db.Column(db.Integer, default=1)

    user_badges = db.relationship("UserBadge", backref="badge", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "icon": self.icon,
            "condition": self.condition,
            "condition_type": self.condition_type,
        }


class UserBadge(db.Model):
    __tablename__ = "user_badges"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    badge_id = db.Column(db.Integer, db.ForeignKey("badges.id"), nullable=False)
    awarded_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint("user_id", "badge_id"),)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "badge_id": self.badge_id,
            "badge": self.badge.to_dict() if self.badge else None,
            "awarded_at": self.awarded_at.isoformat(),
        }
