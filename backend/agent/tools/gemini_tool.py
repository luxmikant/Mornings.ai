"""
Agentic PR Manager — Gemini Creative Copy Generation Tool

Strands @tool that calls the Google Gemini API for multi-lingual
poetry, shlokas, and greeting copy generation. The agent invokes
this when it needs specialized Devanagari / Hindi creative writing
that benefits from Gemini's multi-lingual strengths.
"""

import json
import logging
import os
import urllib.request

from strands import tool

logger = logging.getLogger(__name__)


@tool
def generate_creative_copy(
    topic: str,
    tone: str,
    language: str = "hi_IN",
    num_lines: int = 4,
) -> str:
    """Generate beautiful, culturally authentic greeting copy using Google Gemini.

    Creates multi-lingual poetry, blessings, and festival greetings in Hindi,
    Sanskrit, or other Indic languages. The output is designed to be placed
    directly on greeting card artifacts.

    Args:
        topic: The subject of the greeting (e.g., "Diwali", "Maha Shivratri",
               "दीपावली की शुभकामनाएं"). Should include the festival name
               and any specific deity context.
        tone: The emotional register of the copy. One of:
              "REVERENT_DEVOTIONAL" (for elders, spiritual context),
              "CIVIC_AUTHORITATIVE" (for public/political messaging),
              "WARM_FAMILIAL" (for family and close community).
        language: BCP-47 language code. Defaults to "hi_IN" (Hindi).
                  Also supports "sa_IN" (Sanskrit), "gu_IN" (Gujarati).
        num_lines: Number of lines to generate (default: 4).

    Returns:
        A string containing the generated greeting text, ready for
        compositor overlay. Returns an error message string on failure.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return "Error: GEMINI_API_KEY environment variable is not set."

    model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/"
        f"models/{model_name}:generateContent?key={api_key}"
    )

    prompt = (
        f"Write a beautiful, {num_lines}-line {tone} greeting about {topic} "
        f"in language {language}. "
        f"Do not use emojis. Use authentic cultural references and, if applicable, "
        f"include a brief Sanskrit shloka with its Hindi meaning."
    )

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            result = json.loads(response.read().decode("utf-8"))
            text = result["candidates"][0]["content"]["parts"][0]["text"]
            logger.info(f"Gemini copy generated successfully for topic: {topic}")
            return text
    except Exception as e:
        logger.error(f"Gemini API call failed: {e}")
        return f"Error contacting Gemini API: {e}"
