"""
Agentic PR Manager — Multimodal Image Generation Tool

Strands @tool that generates AI backdrop images for greeting cards.
Supports a multi-provider fallback chain:
  1. NVIDIA NIM API (FLUX.1-dev / Qwen-image)
  2. High-quality procedural festive backdrop via Pillow (deterministic fallback)

The generated backdrop includes strategic negative space for the
compositor to overlay Devanagari typography and the user's portrait.
"""

import base64
import json
import logging
import os
import urllib.request
from pathlib import Path
from typing import Optional

from PIL import Image, ImageDraw, ImageFilter
from strands import tool

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════
# Internal Helpers (not exposed to the agent)
# ═══════════════════════════════════════════════════════════

def _generate_procedural_festive_backdrop(
    prompt: str,
    width: int = 1080,
    height: int = 1350,
) -> str:
    """
    Generates a rich, warm devotional/festive gradient backdrop locally
    using Pillow. Used as a reliable fallback when external APIs are
    unavailable or rate-limited.
    """
    img = Image.new("RGB", (width, height), "#1a0826")
    draw = ImageDraw.Draw(img)

    # Warm spiritual gradient (deep saffron → royal indigo)
    for y in range(height):
        ratio = y / height
        r = int(230 * (1 - ratio * 0.7) + 20 * (ratio * 0.7))
        g = int(81 * (1 - ratio * 0.8) + 10 * (ratio * 0.8))
        b = int(10 * (1 - ratio * 0.5) + 60 * (ratio * 0.5))
        draw.line([(0, y), (width, y)], fill=(r, g, b))

    # Soft radial glowing gold aura in the center
    aura = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    aura_draw = ImageDraw.Draw(aura)
    center_x, center_y = width // 2, int(height * 0.45)
    radius = int(width * 0.42)
    aura_draw.ellipse(
        [center_x - radius, center_y - radius,
         center_x + radius, center_y + radius],
        fill=(255, 215, 0, 60),
    )
    aura = aura.filter(ImageFilter.GaussianBlur(radius=80))
    img.paste(aura, (0, 0), aura)

    # Save to local cache
    out_dir = Path("backend/static/generated_backdrops")
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"backdrop_festive_{abs(hash(prompt)) % 100000}.png"
    img.save(out_path, format="PNG")
    logger.info(f"Procedural backdrop generated at: {out_path}")
    return str(out_path.resolve())


def _generate_backdrop_nvidia(
    prompt: str,
    api_key: str,
    width: int = 1080,
    height: int = 1350,
) -> Optional[str]:
    """Attempts image generation via NVIDIA NIM API endpoints."""
    endpoints = [
        "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-dev",
        "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-schnell",
    ]

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    payload = {
        "prompt": (
            f"{prompt}, Indian festival aesthetic, divine lighting, "
            f"ornate decorations, 8k resolution cinematic, photorealistic"
        ),
        "mode": "base",
    }

    for url in endpoints:
        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode(),
                headers=headers,
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=20) as resp:
                data = json.loads(resp.read().decode())
                if "artifacts" in data and len(data["artifacts"]) > 0:
                    b64_data = data["artifacts"][0].get("base64")
                    if b64_data:
                        out_dir = Path("backend/static/generated_backdrops")
                        out_dir.mkdir(parents=True, exist_ok=True)
                        out_path = out_dir / f"nvidia_{abs(hash(prompt)) % 100000}.png"
                        with open(out_path, "wb") as f:
                            f.write(base64.b64decode(b64_data))
                        logger.info(f"NVIDIA backdrop generated at: {out_path}")
                        return str(out_path.resolve())
        except Exception as e:
            logger.debug(f"NVIDIA endpoint {url} failed: {e}")
            continue

    return None


# ═══════════════════════════════════════════════════════════
# Public Strands Tool
# ═══════════════════════════════════════════════════════════

@tool
def generate_backdrop(
    prompt: str,
    style: str = "cinematic",
    width: int = 1080,
    height: int = 1350,
) -> str:
    """Generate an AI backdrop image for a greeting card.

    Creates a high-quality festive or devotional background image with
    strategic negative space for typography and portrait overlay. The
    system tries external AI providers first and falls back to a
    procedural generator.

    Args:
        prompt: Descriptive prompt for the backdrop. Should include the
                festival name, deity context, and visual mood
                (e.g., "Diwali celebration, golden diyas, Lakshmi motifs,
                warm saffron tones, leave 40% negative space on the left").
        style: Visual style hint. Options: "cinematic", "traditional",
               "minimalist". Default is "cinematic".
        width: Image width in pixels. Default 1080.
        height: Image height in pixels. Default 1350.

    Returns:
        Absolute file path to the generated backdrop image (PNG format).
    """
    nvidia_key = os.getenv("NVIDIA_API_KEY", "")

    # 1. Try NVIDIA NIM
    if nvidia_key:
        logger.info("Attempting image generation via NVIDIA NIM API...")
        img_path = _generate_backdrop_nvidia(
            prompt, nvidia_key, width=width, height=height
        )
        if img_path:
            return img_path

    # 2. Fallback: Deterministic procedural festive backdrop
    logger.info("Using procedural festive background generation...")
    return _generate_procedural_festive_backdrop(prompt, width=width, height=height)
