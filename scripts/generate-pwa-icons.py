#!/usr/bin/env python3
"""Generate PWA icons and iOS splash screens from public/app-icon.png."""
from pathlib import Path
from PIL import Image

PUBLIC = Path(__file__).resolve().parent.parent / "public"
SOURCE = PUBLIC / "app-icon.png"


def resize_icon(size: int) -> Image.Image:
    img = Image.open(SOURCE).convert("RGBA")
    return img.resize((size, size), Image.LANCZOS)


def main():
    if not SOURCE.exists():
        raise SystemExit(f"Missing source icon: {SOURCE}")

    PUBLIC.mkdir(parents=True, exist_ok=True)
    for icon_size in (192, 512):
        path = PUBLIC / f"pwa-{icon_size}x{icon_size}.png"
        resize_icon(icon_size).save(path, "PNG", optimize=True)
        print(f"Wrote {path}")

    apple_path = PUBLIC / "apple-touch-icon.png"
    resize_icon(180).save(apple_path, "PNG", optimize=True)
    print(f"Wrote {apple_path}")

    favicon_path = PUBLIC / "favicon.png"
    resize_icon(32).save(favicon_path, "PNG", optimize=True)
    print(f"Wrote {favicon_path}")


if __name__ == "__main__":
    main()
