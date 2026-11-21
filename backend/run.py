import os
from app import create_app, db
from app.models import User, Campaign, GeneratedEmail, CampaignAssignment
from app.models import Badge, UserBadge
from app.models.interaction import InteractionLog, ScoreHistory
from app.models.prompt import PromptLog
import json
from datetime import datetime, timedelta
import secrets
import random

app = create_app(os.getenv("FLASK_ENV", "development"))


def seed_database():
    """Populate the database with sample data for demonstration."""
    print("Seeding database...")

    # ── Badges ──────────────────────────────────────────────────────────────
    badge_defs = [
        ("First Reporter", "Reported your first phishing simulation", "🎯",
         "Reported a phishing email for the first time", "first_report", 1),
        ("Quick Responder", "Reported a phishing email within 5 minutes", "⚡",
         "Report phishing within 5 minutes of receiving it", "report_streak", 1),
        ("Phishing Hunter", "Reported 3 phishing simulations", "🔍",
         "Report phishing simulations 3 times", "report_streak", 3),
        ("Security Champion", "Reported 10 phishing simulations", "🏆",
         "Report phishing simulations 10 times", "report_streak", 10),
        ("Low Risk Achiever", "Maintained a Vulnerability Score below 25", "🛡️",
         "Keep your vulnerability score at or below 25", "low_score", 25),
        ("Point Collector", "Earned 100 points", "💰",
         "Earn 100 total points", "high_points", 100),
        ("Zero Clicks", "Never clicked a phishing link while reporting correctly", "✅",
         "Report phishing without ever clicking the link", "zero_clicks", 1),
        ("Security Veteran", "Earned 500 points", "⭐",
         "Earn 500 total points", "high_points", 500),
    ]
    for name, desc, icon, condition, ctype, cval in badge_defs:
        if not Badge.query.filter_by(name=name).first():
            db.session.add(Badge(
                name=name, description=desc, icon=icon,
                condition=condition, condition_type=ctype, condition_value=cval,
            ))
    db.session.commit()
    print("  Badges seeded.")

    # ── Admin User ────────────────────────────────────────────────────────────
    admin = User.query.filter_by(email="admin@acmecorp.com").first()
    if not admin:
        admin = User(
            full_name="Admin User",
            email="admin@acmecorp.com",
            role="admin",
            department="IT Security",
            vulnerability_score=10,
            points=0,
        )
        admin.set_password("Admin@1234")
        db.session.add(admin)
        db.session.commit()
        print("  Admin created: admin@acmecorp.com / Admin@1234")

    # ── Employees ─────────────────────────────────────────────────────────────
    employees_data = [
        ("Anas Abuoun",       "anas@acmecorp.com",       "IT",          75, 150),
        ("Alaa Abuoun",       "alaa@acmecorp.com",        "Finance",     45, 80),
        ("Omar Aburoub",      "omar@acmecorp.com",        "HR",          20, 30),
        ("Mohammed Esbitan",  "mohammed@acmecorp.com",    "Marketing",   60, 100),
        ("Hamad Haidar",      "hamad@acmecorp.com",       "IT",          85, 200),
        ("Sara Al-Mansour",   "sara@acmecorp.com",        "Finance",     30, 50),
        ("Khalid Barakat",    "khalid@acmecorp.com",      "HR",          55, 90),
        ("Nour Hadidi",       "nour@acmecorp.com",        "Marketing",   70, 120),
        ("Rami Khalil",       "rami@acmecorp.com",        "IT",          15, 10),
        ("Lina Saab",         "lina@acmecorp.com",        "Finance",     90, 250),
        ("Faris Younis",      "faris@acmecorp.com",       "Operations",  40, 60),
        ("Heba Nasser",       "heba@acmecorp.com",        "Operations",  65, 110),
    ]
    employees = {}
    for name, email, dept, score, points in employees_data:
        u = User.query.filter_by(email=email).first()
        if not u:
            u = User(full_name=name, email=email, role="employee",
                     department=dept, vulnerability_score=score, points=points)
            u.set_password("Employee@1234")
            db.session.add(u)
        employees[email] = u
    db.session.commit()
    print(f"  {len(employees_data)} employees seeded. Password: Employee@1234")

    # ── Award some badges ─────────────────────────────────────────────────────
    first_reporter = Badge.query.filter_by(condition_type="first_report").first()
    champion = Badge.query.filter_by(name="Security Champion").first()
    high_pts = Badge.query.filter_by(name="Point Collector").first()

    badge_awards = [
        ("lina@acmecorp.com", [first_reporter, champion, high_pts]),
        ("anas@acmecorp.com",  [first_reporter, high_pts]),
        ("hamad@acmecorp.com", [first_reporter, high_pts]),
    ]
    for email, badges in badge_awards:
        user = employees.get(email)
        if not user:
            continue
        for badge in badges:
            if badge and not UserBadge.query.filter_by(user_id=user.id, badge_id=badge.id).first():
                db.session.add(UserBadge(user_id=user.id, badge_id=badge.id))
    db.session.commit()
    print("  Sample badges awarded.")

    # ── Campaigns ────────────────────────────────────────────────────────────
    c1 = Campaign.query.filter_by(title="IT Password Reset Phishing").first()
    if not c1:
        c1 = Campaign(
            title="IT Password Reset Phishing",
            topic="IT Support",
            tone="urgent",
            urgency="high",
            difficulty="medium",
            department_target="All",
            description="Tests employee response to urgent IT password reset emails.",
            status="completed",
            created_by=admin.id,
            launched_at=datetime.utcnow() - timedelta(days=15),
            completed_at=datetime.utcnow() - timedelta(days=8),
        )
        db.session.add(c1)

    c2 = Campaign.query.filter_by(title="HR Policy Compliance Phishing").first()
    if not c2:
        c2 = Campaign(
            title="HR Policy Compliance Phishing",
            topic="HR Compliance",
            tone="formal",
            urgency="medium",
            difficulty="easy",
            department_target="HR",
            description="Simulates HR compliance email requesting document review.",
            status="active",
            created_by=admin.id,
            launched_at=datetime.utcnow() - timedelta(days=3),
        )
        db.session.add(c2)

    c3 = Campaign.query.filter_by(title="Finance Wire Transfer Spear Phishing").first()
    if not c3:
        c3 = Campaign(
            title="Finance Wire Transfer Spear Phishing",
            topic="Finance",
            tone="urgent",
            urgency="high",
            difficulty="hard",
            department_target="Finance",
            description="Advanced spear phishing targeting finance department.",
            status="draft",
            created_by=admin.id,
        )
        db.session.add(c3)
    db.session.commit()

    # ── Generated Emails ──────────────────────────────────────────────────────
    if GeneratedEmail.query.filter_by(campaign_id=c1.id).count() == 0:
        e1 = GeneratedEmail(
            campaign_id=c1.id,
            subject="[URGENT] Your Corporate Password Expires in 2 Hours",
            body="""<div style="font-family:Arial,sans-serif;max-width:600px;padding:20px;border:1px solid #ddd;">
<p style="color:#c00;font-weight:bold;">⚠ URGENT: ACTION REQUIRED</p>
<p>Dear {{EMPLOYEE_NAME}},</p>
<p>Our security system has detected that your corporate password will expire in <strong>2 hours</strong>.
You must reset it immediately to avoid account lockout.</p>
<p style="text-align:center;margin:20px 0;">
  <a href="[TRACKING_LINK]" style="background:#c00;color:#fff;padding:12px 25px;text-decoration:none;border-radius:4px;font-weight:bold;">Reset Password Now</a>
</p>
<p>IT Security Team | AcmeCorp</p>
<p style="font-size:11px;color:#888;">Do not reply to this automated message.</p>
</div>""",
            sender_name="IT Security Team",
            sender_email="security@acmecorp-it-helpdesk.com",
            difficulty="medium",
            variation_number=1,
            approved=True,
            red_flags=json.dumps([
                "Sender domain 'acmecorp-it-helpdesk.com' is NOT the official company domain",
                "Artificial 2-hour deadline creates urgency pressure",
                "Threat of account lockout to force immediate action",
                "IT teams never send password reset links via email",
            ]),
        )
        db.session.add(e1)
        db.session.commit()

        # Assign to all employees and generate sample interactions
        all_employees = User.query.filter_by(role="employee", is_active=True).all()
        actions_sim = [
            "reported", "clicked", "submitted_fake_credentials",
            "opened", "reported", "clicked", "opened", "reported",
            "submitted_fake_credentials", "opened", "reported", "clicked",
        ]
        for i, emp in enumerate(all_employees):
            token = secrets.token_urlsafe(32)
            assign = CampaignAssignment(
                campaign_id=c1.id,
                user_id=emp.id,
                email_id=e1.id,
                delivery_status="sent",
                sent_at=datetime.utcnow() - timedelta(days=14),
                tracking_token=token,
            )
            db.session.add(assign)
            db.session.flush()

            action = actions_sim[i % len(actions_sim)]
            log = InteractionLog(
                campaign_id=c1.id,
                user_id=emp.id,
                assignment_id=assign.id,
                action_type=action,
                timestamp=datetime.utcnow() - timedelta(days=14, hours=random.randint(0, 48)),
            )
            db.session.add(log)

            delta_map = {
                "reported": -10, "clicked": 15,
                "submitted_fake_credentials": 25, "opened": 0
            }
            delta = delta_map.get(action, 0)
            if delta != 0:
                score_h = ScoreHistory(
                    user_id=emp.id,
                    campaign_id=c1.id,
                    old_score=emp.vulnerability_score,
                    new_score=max(0, min(100, emp.vulnerability_score + delta)),
                    delta=delta,
                    reason=f"Action: {action}",
                )
                db.session.add(score_h)

        db.session.commit()
        print("  Sample campaigns and interactions seeded.")

    print("Database seeding complete!")
    print("\n─────────────────────────────────────────────────")
    print("  Login credentials:")
    print("  Admin:    admin@acmecorp.com   / Admin@1234")
    print("  Employee: anas@acmecorp.com    / Employee@1234")
    print("  Employee: lina@acmecorp.com    / Employee@1234")
    print("─────────────────────────────────────────────────\n")


with app.app_context():
    db.create_all()
    seed_database()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
