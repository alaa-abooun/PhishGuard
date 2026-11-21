from datetime import datetime
from app import db


class PromptLog(db.Model):
    """Audit log of every LLM prompt and response for safety review."""
    __tablename__ = "prompt_logs"

    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey("campaigns.id"), nullable=False)
    prompt_text = db.Column(db.Text, nullable=False)
    model_response = db.Column(db.Text)
    model_name = db.Column(db.String(100))
    safety_status = db.Column(db.String(20), default="pending")  # pending|passed|flagged
    safety_notes = db.Column(db.Text)
    generation_time_ms = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "campaign_id": self.campaign_id,
            "prompt_text": self.prompt_text,
            "model_response": self.model_response,
            "model_name": self.model_name,
            "safety_status": self.safety_status,
            "safety_notes": self.safety_notes,
            "generation_time_ms": self.generation_time_ms,
            "created_at": self.created_at.isoformat(),
        }
