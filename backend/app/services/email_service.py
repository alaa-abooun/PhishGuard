"""
Simulated Email Service
Sends (or mock-sends) phishing simulation emails.
Real credentials are NEVER requested, stored, or transmitted.
All links point to tracking endpoints on this platform, not external sites.
"""
import secrets
import json
from datetime import datetime
from flask import current_app, render_template_string
from app import db, mail
from flask_mail import Message


SIMULATION_EMAIL_TEMPLATE = """
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body>
<!-- SIMULATION TRACKING PIXEL -->
<img src="{{ open_track_url }}" width="1" height="1" style="display:none" alt=""/>
{{ email_body }}
</body>
</html>
"""


def send_simulation_email(assignment, generated_email, base_url: str) -> bool:
    """
    Sends a simulated phishing email (or logs it if MAIL_SUPPRESS_SEND=True).
    Injects tracking pixel and replaces [TRACKING_LINK] with real tracking URL.
    Returns True on success.
    """
    from app.models.campaign import CampaignAssignment

    # Generate unique tracking token
    token = secrets.token_urlsafe(32)
    assignment.tracking_token = token
    assignment.delivery_status = "sent"
    assignment.sent_at = datetime.utcnow()

    open_track_url = f"{base_url}/api/track/open/{token}"
    click_track_url = f"{base_url}/api/track/click/{token}"
    cred_page_url = f"{base_url}/api/track/landing/{token}"

    # Replace placeholders in body
    body = generated_email.body
    body = body.replace("[TRACKING_LINK]", click_track_url)
    body = body.replace("[TRACKING_PIXEL]", open_track_url)
    body = body.replace("{{EMPLOYEE_NAME}}", assignment.user.full_name)
    body = body.replace("{{employee_name}}", assignment.user.full_name)

    final_body = render_template_string(
        SIMULATION_EMAIL_TEMPLATE,
        open_track_url=open_track_url,
        email_body=body,
    )

    try:
        if current_app.config.get("MAIL_SUPPRESS_SEND", True):
            # Demo mode: log to DB, don't actually send
            current_app.logger.info(
                f"[MOCK EMAIL] To: {assignment.user.email} | "
                f"Subject: {generated_email.subject} | Token: {token}"
            )
        else:
            msg = Message(
                subject=generated_email.subject,
                sender=(generated_email.sender_name, generated_email.sender_email),
                recipients=[assignment.user.email],
                html=final_body,
            )
            mail.send(msg)

        db.session.commit()
        return True

    except Exception as exc:
        current_app.logger.error(f"Email send failed for assignment {assignment.id}: {exc}")
        assignment.delivery_status = "failed"
        db.session.commit()
        return False


def build_tracking_urls(token: str, base_url: str) -> dict:
    return {
        "open_url": f"{base_url}/api/track/open/{token}",
        "click_url": f"{base_url}/api/track/click/{token}",
        "landing_url": f"{base_url}/api/track/landing/{token}",
        "report_url": f"{base_url}/api/track/report/{token}",
    }
