from datetime import datetime
from app import db


class Campaign(db.Model):
    __tablename__ = "campaigns"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    topic = db.Column(db.String(100), nullable=False)   # e.g. IT Support, HR, Finance
    tone = db.Column(db.String(50), nullable=False)     # urgent | friendly | formal
    urgency = db.Column(db.String(50), nullable=False)  # low | medium | high
    difficulty = db.Column(db.String(20), nullable=False, default="medium")  # easy|medium|hard
    department_target = db.Column(db.String(80), nullable=False, default="All")
    description = db.Column(db.Text)
    status = db.Column(db.String(20), default="draft")  # draft|pending_approval|active|completed|paused
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    launched_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)

    # Relationships
    emails = db.relationship("GeneratedEmail", backref="campaign", lazy="dynamic", cascade="all, delete-orphan")
    assignments = db.relationship("CampaignAssignment", backref="campaign", lazy="dynamic", cascade="all, delete-orphan")
    interactions = db.relationship("InteractionLog", backref="campaign", lazy="dynamic")
    prompt_logs = db.relationship("PromptLog", backref="campaign", lazy="dynamic")

    def to_dict(self):
        approved_email = self.emails.filter_by(approved=True).first()
        return {
            "id": self.id,
            "title": self.title,
            "topic": self.topic,
            "tone": self.tone,
            "urgency": self.urgency,
            "difficulty": self.difficulty,
            "department_target": self.department_target,
            "description": self.description,
            "status": self.status,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat(),
            "launched_at": self.launched_at.isoformat() if self.launched_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "email_count": self.emails.count(),
            "approved_email_id": approved_email.id if approved_email else None,
            "assignment_count": self.assignments.count(),
        }


class GeneratedEmail(db.Model):
    __tablename__ = "generated_emails"

    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey("campaigns.id"), nullable=False)
    subject = db.Column(db.String(300), nullable=False)
    body = db.Column(db.Text, nullable=False)
    sender_name = db.Column(db.String(120), default="IT Support Team")
    sender_email = db.Column(db.String(120), default="support@company-help.com")
    difficulty = db.Column(db.String(20), default="medium")
    variation_number = db.Column(db.Integer, default=1)
    approved = db.Column(db.Boolean, default=False)
    admin_notes = db.Column(db.Text)
    red_flags = db.Column(db.Text)   # JSON list of red flags for training
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    assignments = db.relationship("CampaignAssignment", backref="generated_email", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "campaign_id": self.campaign_id,
            "subject": self.subject,
            "body": self.body,
            "sender_name": self.sender_name,
            "sender_email": self.sender_email,
            "difficulty": self.difficulty,
            "variation_number": self.variation_number,
            "approved": self.approved,
            "admin_notes": self.admin_notes,
            "red_flags": self.red_flags,
            "created_at": self.created_at.isoformat(),
        }


class CampaignAssignment(db.Model):
    __tablename__ = "campaign_assignments"

    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey("campaigns.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    email_id = db.Column(db.Integer, db.ForeignKey("generated_emails.id"))
    delivery_status = db.Column(db.String(30), default="pending")  # pending|sent|delivered|failed
    sent_at = db.Column(db.DateTime)
    tracking_token = db.Column(db.String(64), unique=True)  # unique token per assignment

    def to_dict(self):
        return {
            "id": self.id,
            "campaign_id": self.campaign_id,
            "user_id": self.user_id,
            "email_id": self.email_id,
            "delivery_status": self.delivery_status,
            "sent_at": self.sent_at.isoformat() if self.sent_at else None,
            "tracking_token": self.tracking_token,
        }
