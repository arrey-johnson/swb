#!/usr/bin/env python3
"""Generate PWA icons for SaveWithBanks."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

PUBLIC = Path(__file__).resolve().parent.parent / "public"
COLOR = (109, 40, 217)  # #6D28D9
WHITE = (255, 255, 255)


def make_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    radius = int(size * 0.25)
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=COLOR)
    font_size = int(size * 0.26)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
    except OSError:
        font = ImageFont.load_default()
    text = "SWB"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(((size - tw) / 2, (size - th) / 2 - size * 0.04), text, fill=WHITE, font=font)
    return img


def main():
    PUBLIC.mkdir(parents=True, exist_ok=True)
    for size in (192, 512):
        path = PUBLIC / f"pwa-{size}x{size}.png"
        make_icon(size).save(path, "PNG")
        print(f"Wrote {path}")
    # Apple touch icon
    make_icon(180).save(PUBLIC / "apple-touch-icon.png", "PNG")
    print(f"Wrote {PUBLIC / 'apple-touch-icon.png'}")


if __name__ == "__main__":
    main()
