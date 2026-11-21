"""
AI Email Generation Service
Uses Ollama (local LLM) with LangChain to generate safe, simulated phishing
awareness training emails.  Real credentials are NEVER requested or stored.
"""
import json
import time
import re
import requests
from flask import current_app


# --------------------------------------------------------------------------- #
# Safety guardrails                                                            #
# --------------------------------------------------------------------------- #
BLOCKED_KEYWORDS = [
    "real password", "actual password", "your real", "genuine",
    "nsfw", "sexual", "explicit", "violence", "weapon", "drug",
    "nuclear", "bomb", "kill", "hate", "racist",
]

REQUIRED_SIMULATION_MARKERS = [
    "simulation", "training", "awareness", "demo", "test",
    "phishing awareness", "security training",
]


def _safety_check(text: str) -> tuple[bool, str]:
    lower = text.lower()
    for kw in BLOCKED_KEYWORDS:
        if kw in lower:
            return False, f"Blocked keyword detected: '{kw}'"
    return True, "passed"


def _build_prompt(params: dict) -> str:
    """
    Constructs a structured, safety-bounded prompt for the LLM.
    The prompt explicitly instructs the model to generate SIMULATION-ONLY content.
    """
    topic = params.get("topic", "IT Support")
    tone = params.get("tone", "urgent")
    urgency = params.get("urgency", "high")
    difficulty = params.get("difficulty", "medium")
    department = params.get("department_target", "General")
    variation = params.get("variation_number", 1)
    employee_name = params.get("employee_name", "{{EMPLOYEE_NAME}}")
    company_name = params.get("company_name", "AcmeCorp")

    difficulty_instructions = {
        "easy": (
            "Make the phishing indicators VERY OBVIOUS. "
            "Use clear red flags like suspicious sender domains, poor grammar, "
            "extreme urgency, and vague greetings. Easy for a vigilant person to spot."
        ),
        "medium": (
            "Make the email moderately convincing. Include a few subtle red flags "
            "like a slightly wrong domain, one urgent CTA, and semi-plausible context. "
            "A careful reader should still catch it."
        ),
        "hard": (
            "Make the email highly convincing and personalized. Use correct grammar, "
            "realistic sender name, real-looking domain, plausible internal context. "
            "Include only very subtle red flags that require careful attention."
        ),
    }

    return f"""You are a cybersecurity awareness trainer creating a SIMULATED PHISHING EMAIL for employee security training.

CRITICAL SAFETY RULES:
1. This is a SIMULATION ONLY for security awareness training - clearly state "SECURITY AWARENESS SIMULATION" somewhere in your response metadata.
2. NEVER ask for real passwords, real bank details, real SSN, or real confidential data.
3. The fake credential form must only collect a username placeholder and a fake password field labeled as simulation.
4. All links must use placeholder format: [TRACKING_LINK] - do not generate real URLs.
5. Do NOT include offensive, NSFW, violent, or discriminatory content.
6. The email must feel realistic as a training tool without being actually harmful.

CAMPAIGN PARAMETERS:
- Topic/Scenario: {topic}
- Tone: {tone}
- Urgency Level: {urgency}
- Target Department: {department}
- Difficulty Level: {difficulty}
- Variation Number: {variation} (make this variation unique from others)
- Employee Name Placeholder: {employee_name}
- Company Name: {company_name}

DIFFICULTY GUIDANCE:
{difficulty_instructions.get(difficulty, difficulty_instructions["medium"])}

Generate the phishing simulation email in the following JSON format ONLY (no other text):
{{
  "subject": "Email subject line here",
  "sender_name": "Sender display name",
  "sender_email": "sender@slightly-wrong-domain.com",
  "body": "Full HTML-compatible email body with {{{{EMPLOYEE_NAME}}}} placeholder. Include a call-to-action with [TRACKING_LINK] placeholder.",
  "red_flags": [
    "Red flag 1: description of why this is suspicious",
    "Red flag 2: description of why this is suspicious",
    "Red flag 3: description of why this is suspicious"
  ],
  "training_tip": "Educational tip explaining why this email is a phishing simulation and what to look for."
}}"""


def generate_phishing_email(campaign_params: dict, variation_number: int = 1) -> dict:
    """
    Calls the local Ollama LLM to generate a phishing simulation email.
    Falls back to a realistic template if Ollama is unavailable.

    Returns a dict with keys: subject, sender_name, sender_email, body,
    red_flags (list), training_tip, safety_status, generation_time_ms.
    """
    start = time.time()
    params = {**campaign_params, "variation_number": variation_number}
    prompt = _build_prompt(params)

    try:
        ollama_url = current_app.config.get("OLLAMA_BASE_URL", "http://localhost:11434")
        model = current_app.config.get("OLLAMA_MODEL", "llama3.2")

        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": 0.8, "top_p": 0.9, "num_predict": 1024},
        }
        response = requests.post(
            f"{ollama_url}/api/generate",
            json=payload,
            timeout=90,
        )
        response.raise_for_status()
        raw_text = response.json().get("response", "")

        # Extract JSON block from response
        json_match = re.search(r"\{.*\}", raw_text, re.DOTALL)
        if not json_match:
            raise ValueError("LLM did not return valid JSON")

        email_data = json.loads(json_match.group())
        generation_time = int((time.time() - start) * 1000)

        # Safety check on generated content
        full_text = email_data.get("subject", "") + " " + email_data.get("body", "")
        safe, note = _safety_check(full_text)

        email_data["safety_status"] = "passed" if safe else "flagged"
        email_data["safety_notes"] = note
        email_data["generation_time_ms"] = generation_time
        email_data["prompt_used"] = prompt

        if not safe:
            return _fallback_email(params, variation_number, "flagged", note, generation_time, prompt)

        return email_data

    except Exception as exc:
        current_app.logger.warning(f"Ollama unavailable, using fallback: {exc}")
        generation_time = int((time.time() - start) * 1000)
        return _fallback_email(params, variation_number, "passed", "Fallback template", generation_time, prompt)


def _fallback_email(params, variation, safety_status, safety_notes, gen_time, prompt):
    """High-quality pre-built template variations for demo when Ollama is offline."""
    topic = params.get("topic", "IT Support")
    department = params.get("department_target", "All")
    difficulty = params.get("difficulty", "medium")

    templates = [
        {
            "subject": f"[URGENT] Your {company_name(params)} Account Requires Immediate Verification",
            "sender_name": "IT Security Team",
            "sender_email": "security@it-support-helpdesk.com",
            "body": f"""<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #ddd;padding:20px;">
<img src="[TRACKING_PIXEL]" width="1" height="1" />
<p style="color:#c00;font-weight:bold;">⚠ URGENT ACTION REQUIRED</p>
<p>Dear {{{{EMPLOYEE_NAME}}}},</p>
<p>Our security system has detected <strong>suspicious login attempts</strong> on your {company_name(params)} corporate account from an unrecognized device.</p>
<p>To protect your account, you must verify your credentials within the next <strong>2 hours</strong> or your account will be temporarily suspended.</p>
<p style="text-align:center;margin:25px 0;">
  <a href="[TRACKING_LINK]" style="background:#c00;color:#fff;padding:12px 28px;text-decoration:none;border-radius:4px;font-weight:bold;">Verify My Account Now</a>
</p>
<p>If you do not act within 2 hours, IT Security will lock your account for 24 hours pending manual review.</p>
<p>Reference ID: SEC-{variation}8{variation}42<br/>
{department} Department | {company_name(params)} IT Security</p>
<hr/>
<p style="font-size:11px;color:#888;">This is an automated security notification. Do not reply to this email.</p>
</div>""",
            "red_flags": [
                "Suspicious sender domain: 'it-support-helpdesk.com' is NOT the company domain",
                "Artificial urgency: '2 hour deadline' pressure tactic",
                "Threat of account suspension to force immediate action",
                "Generic greeting style despite claiming to know your account",
                "Vague 'suspicious activity' claim with no specific details",
            ],
            "training_tip": "This is a classic urgency-based phishing attack. Real IT teams never ask you to verify credentials by clicking email links. Always go directly to the official portal.",
        },
        {
            "subject": f"Action Required: {department} Shared Drive Access Expiring Soon",
            "sender_name": f"{company_name(params)} IT Help Desk",
            "sender_email": f"helpdesk@{company_name(params).lower()}-support.net",
            "body": f"""<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;">
<img src="[TRACKING_PIXEL]" width="1" height="1" />
<p>Hi {{{{EMPLOYEE_NAME}}}},</p>
<p>Your access to the <strong>{department} Shared Drive</strong> is expiring in <strong>24 hours</strong>. To maintain uninterrupted access to important company files, please re-authenticate your credentials.</p>
<p>Failure to renew access will result in loss of access to:</p>
<ul>
<li>{department} project files</li>
<li>Shared team documents</li>
<li>Company policy updates</li>
</ul>
<p style="text-align:center;">
  <a href="[TRACKING_LINK]" style="background:#1a73e8;color:#fff;padding:10px 24px;text-decoration:none;border-radius:3px;">Re-authenticate Access</a>
</p>
<p>Best regards,<br/>{company_name(params)} IT Help Desk<br/>Ticket #{variation}7{variation}903</p>
</div>""",
            "red_flags": [
                f"Sender domain uses '{company_name(params).lower()}-support.net' NOT the official company email",
                "Creates false urgency about losing file access",
                "Requests re-authentication via email link — IT never does this",
                "No official IT ticket portal reference",
                "Suspicious ticket number format",
            ],
            "training_tip": "Legitimate access renewal requests come from your official IT portal, not email links. Check the sender domain carefully — one extra word ('support') signals a fake domain.",
        },
        {
            "subject": f"HR Reminder: {topic} Policy Update — Your Acknowledgement Needed",
            "sender_name": "Human Resources",
            "sender_email": f"hr.noreply@{company_name(params).lower()}-hrsystem.com",
            "body": f"""<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#fafafa;border:1px solid #ccc;">
<img src="[TRACKING_PIXEL]" width="1" height="1" />
<p>Dear {{{{EMPLOYEE_NAME}}}},</p>
<p>As part of our annual compliance cycle, {company_name(params)} has updated its <strong>{topic} Policy</strong>. All employees in the <strong>{department}</strong> department are required to acknowledge receipt of the updated policy by <strong>end of business today</strong>.</p>
<p>Employees who fail to acknowledge will be flagged for a compliance review by HR management.</p>
<p style="text-align:center;">
  <a href="[TRACKING_LINK]" style="background:#2e7d32;color:#fff;padding:10px 22px;text-decoration:none;border-radius:4px;">Review & Acknowledge Policy</a>
</p>
<p>For questions, contact your HR Business Partner.</p>
<p>Regards,<br/>HR Compliance Team<br/>{company_name(params)}</p>
</div>""",
            "red_flags": [
                f"Domain '{company_name(params).lower()}-hrsystem.com' is not the official company HR system",
                "Compliance threat ('flagged for review') to pressure immediate action",
                "End-of-business-day deadline to prevent careful scrutiny",
                "HR compliance acknowledgements go through official HR portals, not email links",
                "Generic sender name with no specific HR contact",
            ],
            "training_tip": "HR compliance tasks always go through your official HR system (e.g., Workday, BambooHR). An email asking you to click a link to acknowledge a policy is a phishing red flag.",
        },
    ]

    template = templates[(variation - 1) % len(templates)]
    return {
        **template,
        "safety_status": safety_status,
        "safety_notes": safety_notes,
        "generation_time_ms": gen_time,
        "prompt_used": prompt,
    }


def company_name(params):
    return params.get("company_name", "AcmeCorp")
