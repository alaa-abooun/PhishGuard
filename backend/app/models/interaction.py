from datetime import datetime
from app import db


class InteractionLog(db.Model):
    """Records every user action on a phishing simulation."""
    __tablename__ = "interaction_logs"

    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey("campaigns.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    assignment_id = db.Column(db.Integer, db.ForeignKey("campaign_assignments.id"))
    # Action types: opened | clicked | submitted_fake_credentials | reported | ignored
    action_type = db.Column(db.String(40), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    # Extra context (browser, IP hash, etc.) — never store real credentials
    metadata_json = db.Column(db.Text, default="{}")

    def to_dict(self):
        return {
            "id": self.id,
            "campaign_id": self.campaign_id,
            "user_id": self.user_id,
            "assignment_id": self.assignment_id,
            "action_type": self.action_type,
            "timestamp": self.timestamp.isoformat(),
            "metadata": self.metadata_json,
        }


class ScoreHistory(db.Model):
    """Audit trail for every Vulnerability Score change."""
    __tablename__ = "score_history"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    campaign_id = db.Column(db.Integer, db.ForeignKey("campaigns.id"))
    old_score = db.Column(db.Integer, nullable=False)
    new_score = db.Column(db.Integer, nullable=False)
    delta = db.Column(db.Integer, nullable=False)  # positive = riskier, negative = safer
    reason = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "campaign_id": self.campaign_id,
            "old_score": self.old_score,
            "new_score": self.new_score,
            "delta": self.delta,
            "reason": self.reason,
            "created_at": self.created_at.isoformat(),
        }
