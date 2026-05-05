"""
Simple keyword-based sentiment analyser for course review comments.

Interview talking point:
  In production this would call an LLM or a fine-tuned model, but a
  deterministic keyword approach is fast, free, and fully explainable —
  which is valuable for audit trails in educational platforms.
"""

POSITIVE_KEYWORDS = {
    "great", "excellent", "amazing", "fantastic", "wonderful", "love",
    "helpful", "clear", "easy", "interesting", "engaging", "useful",
    "recommend", "best", "awesome", "good", "well", "perfect", "enjoy",
    "enjoyed", "brilliant", "outstanding", "superb", "knowledgeable",
}

NEGATIVE_KEYWORDS = {
    "bad", "terrible", "boring", "unclear", "confusing", "difficult",
    "waste", "poor", "awful", "worst", "horrible", "useless", "slow",
    "outdated", "frustrating", "disappointing", "hate", "avoid",
    "unorganised", "disorganised", "hard", "lost", "overwhelmed",
}


def analyse(comment: str | None) -> dict:
    """
    Analyse the sentiment of a review comment.

    Returns a dict with:
        label  -> "POSITIVE" | "NEGATIVE" | "NEUTRAL"
        score  -> float in [-1.0, +1.0]
        reason -> brief human-readable explanation
    """
    if not comment or not comment.strip():
        return {"label": "NEUTRAL", "score": 0.0, "reason": "No comment provided"}

    words = set(comment.lower().split())
    pos_hits = words & POSITIVE_KEYWORDS
    neg_hits = words & NEGATIVE_KEYWORDS

    pos_count = len(pos_hits)
    neg_count = len(neg_hits)
    total = pos_count + neg_count

    if total == 0:
        return {"label": "NEUTRAL", "score": 0.0, "reason": "No sentiment keywords detected"}

    score = round((pos_count - neg_count) / total, 2)

    if score > 0:
        label = "POSITIVE"
    elif score < 0:
        label = "NEGATIVE"
    else:
        label = "NEUTRAL"

    reason = f"Matched positive: {pos_hits or '{}'}, negative: {neg_hits or '{}'}"
    return {"label": label, "score": score, "reason": reason}
