import os
import textwrap
from pathlib import Path
from typing import Optional
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def _apply_gradient_scrim(image: Image.Image, start_ratio: float = 0.6) -> Image.Image:
    """Applies a dark gradient scrim to the lower part of the image."""
    width, height = image.size
    scrim = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(scrim)
    
    start_y = int(height * start_ratio)
    for y in range(start_y, height):
        ratio = (y - start_y) / (height - start_y)
        alpha = int(255 * 0.7 * ratio)
        draw.line([(0, y), (width, y)], fill=(0, 0, 0, alpha))
        
    return Image.alpha_composite(image.convert('RGBA'), scrim)

def _create_circular_portrait(portrait: Image.Image, size: int = 250) -> Image.Image:
    """Creates a circular mask for the portrait and resizes it."""
    portrait = portrait.resize((size, size), Image.Resampling.LANCZOS).convert('RGBA')
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size, size), fill=255)
    
    output = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    output.paste(portrait, (0, 0), mask)
    return output

def _add_gold_border(image: Image.Image, center: tuple, radius: int, width: int = 4) -> Image.Image:
    """Draws a gold circular border."""
    draw = ImageDraw.Draw(image)
    x, y = center
    bbox = [x - radius, y - radius, x + radius, y + radius]
    draw.ellipse(bbox, outline="#D4A843", width=width)
    return image

def _draw_text_wrapped(draw: ImageDraw.ImageDraw, text: str, position: tuple, font: ImageFont.FreeTypeFont, max_width: int, fill: str, align: str):
    """Wraps text to fit within max_width and draws it."""
    lines = []
    paragraphs = text.split('\n')
    
    for paragraph in paragraphs:
        words = paragraph.split(' ')
        current_line = []
        for word in words:
            current_line.append(word)
            line_str = ' '.join(current_line)
            bbox = draw.textbbox((0, 0), line_str, font=font)
            line_w = bbox[2] - bbox[0]
            if line_w > max_width:
                current_line.pop()
                if current_line:
                    lines.append(' '.join(current_line))
                current_line = [word]
        if current_line:
            lines.append(' '.join(current_line))
            
    y = position[1]
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        line_w = bbox[2] - bbox[0]
        line_h = bbox[3] - bbox[1]
        
        if align == "center":
            x = position[0] - line_w / 2
        elif align == "left":
            x = position[0]
        elif align == "right":
            x = position[0] - line_w
        else:
            x = position[0]
            
        draw.text((x, y), line, font=font, fill=fill)
        y += line_h + 4

def get_font(font_name: str, size: int) -> ImageFont.FreeTypeFont:
    """Attempts to load a font, falls back to default."""
    try:
        font_dir = Path(__file__).parent / "fonts"
        font_path = font_dir / font_name
        return ImageFont.truetype(str(font_path), size)
    except IOError:
        return ImageFont.load_default()

def compose_greeting_card(background_path: str, portrait_path: str, headline: str, shloka: str, user_name: str, user_designation: str, output_path: str = None) -> str:
    """Deterministic image compositing pipeline."""
    if output_path is None:
        output_path = "output.webp"

    try:
        # a) Load background image, resize to 1080x1350 px
        bg = Image.open(background_path).convert('RGBA')
        bg = bg.resize((1080, 1350), Image.Resampling.LANCZOS)

        # b) Apply a dark gradient scrim on the lower 40%
        bg = _apply_gradient_scrim(bg, start_ratio=0.6)
        draw = ImageDraw.Draw(bg)

        # c) Draw headline text
        headline_font = get_font('NotoSansDevanagari-Bold.ttf', 40)
        _draw_text_wrapped(draw, headline, (540, int(1350 * 0.55)), headline_font, 900, "#FFFFFF", "center")

        # d) Draw shloka text
        shloka_font = get_font('NotoSansDevanagari-Regular.ttf', 26)
        # Position slightly below headline. We estimate position.
        _draw_text_wrapped(draw, shloka, (540, int(1350 * 0.65)), shloka_font, 900, "#DDDDDD", "center")

        # e) Load user portrait PNG (with alpha) or generate initials avatar
        if portrait_path and os.path.exists(portrait_path):
            portrait = Image.open(portrait_path)
            portrait = _create_circular_portrait(portrait, size=250)
        else:
            # Generate clean devotional monogram circular avatar
            avatar = Image.new("RGBA", (250, 250), (212, 168, 67, 220)) # Gold tint
            av_draw = ImageDraw.Draw(avatar)
            av_mask = Image.new("L", (250, 250), 0)
            ImageDraw.Draw(av_mask).ellipse((0, 0, 250, 250), fill=255)
            # Draw initial or Om symbol
            init_font = get_font('NotoSansDevanagari-Bold.ttf', 60)
            initial = user_name[0] if user_name else "ॐ"
            av_draw.text((125, 125), initial, font=init_font, fill="#FFFFFF", anchor="mm")
            portrait = Image.new("RGBA", (250, 250), (0, 0, 0, 0))
            portrait.paste(avatar, (0, 0), av_mask)

        # h) Position portrait at bottom-right corner (with padding)
        p_x, p_y = 1080 - 250 - 40, 1350 - 250 - 120
        bg.paste(portrait, (p_x, p_y), portrait)

        # g) Draw a gold circular border (4px wide, color #D4A843) around the portrait
        center = (p_x + 125, p_y + 125)
        bg = _add_gold_border(bg, center, 125, width=4)
        draw = ImageDraw.Draw(bg)

        # i) Draw user name in semi-transparent dark banner
        name_font = get_font('NotoSansDevanagari-Bold.ttf', 20)
        # Banner background
        draw.rectangle([40, 1350 - 100, 1080 - 40, 1350 - 40], fill=(0, 0, 0, 128))
        draw.text((60, 1350 - 90), user_name, font=name_font, fill="#FFFFFF")

        # j) Draw user designation below name
        desig_font = get_font('NotoSansDevanagari-Regular.ttf', 16)
        draw.text((60, 1350 - 65), user_designation, font=desig_font, fill="#CCCCCC")

        # k) Export as WebP at quality 85
        bg.convert('RGB').save(output_path, 'WEBP', quality=85)
        return output_path

    except Exception as e:
        print(f"Error compositing image: {e}")
        raise
