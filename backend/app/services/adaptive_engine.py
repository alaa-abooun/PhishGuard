"""
Adaptive Difficulty Engine
Determines the appropriate phishing simulation difficulty for a user
based on their current Vulnerability Score.

Difficulty Mapping:
  score  0-30  → "hard"   (user is high-risk, needs more realistic/challenging simulations)
  score 31-70  → "medium" (user is average risk)
  score 71-100 → "easy"   (user is low-risk, still needs training via obvious scenarios)
"""


def get_recommended_difficulty(vulnerability_score: int) -> str:
    if vulnerability_score <= 30:
        return "hard"
    elif vulnerability_score <= 70:
        return "medium"
    return "easy"


def get_difficulty_label(difficulty: str) -> str:
    labels = {
        "easy": "Educational (Obvious Red Flags)",
        "medium": "Intermediate (Subtle Clues)",
        "hard": "Advanced (Highly Convincing)",
    }
    return labels.get(difficulty, difficulty)


def should_escalate_difficulty(user, recent_interactions: list) -> bool:
    """
    Returns True if the user has been consistently good (score < 40, no fails in last 5)
    and we should push them to a harder scenario.
    """
    if user.vulnerability_score > 40:
        return False
    fails = [i for i in recent_interactions[-5:] if i.action_type in ("clicked", "submitted_fake_credentials")]
    return len(fails) == 0


def get_adaptive_params(user) -> dict:
    """
    Returns recommended campaign parameters based on user's current vulnerability score.
    Used by the admin dashboard and campaign auto-configuration.
    """
    score = user.vulnerability_score
    difficulty = get_recommended_difficulty(score)
    return {
        "recommended_difficulty": difficulty,
        "difficulty_label": get_difficulty_label(difficulty),
        "vulnerability_score": score,
        "risk_level": _risk_level(score),
        "rationale": _rationale(score, difficulty),
    }


def _risk_level(score):
    if score <= 30:
        return "high"
    elif score <= 70:
        return "medium"
    return "low"


def _rationale(score, difficulty):
    if score <= 30:
        return (
            f"Score {score}/100 indicates HIGH RISK. "
            "Assigning hard simulations to challenge and improve awareness."
        )
    elif score <= 70:
        return (
            f"Score {score}/100 indicates MEDIUM RISK. "
            "Assigning medium simulations with a mix of obvious and subtle cues."
        )
    return (
        f"Score {score}/100 indicates LOW RISK. "
        "Assigning easy scenarios with clear red flags to reinforce good habits."
    )
