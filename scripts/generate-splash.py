#!/usr/bin/env python3
"""Generate iOS PWA startup splash screens from public/app-icon.png."""
from __future__ import annotations

import json
from pathlib import Path
from PIL import Image

PUBLIC = Path(__file__).resolve().parent.parent / "public"
SOURCE = PUBLIC / "app-icon.png"
SPLASH_DIR = PUBLIC / "splash"
META_PATH = SPLASH_DIR / "startup-meta.json"

# Dark purple matching app-icon edges / manifest splash background
EDGE_RGB = (18, 8, 40)       # #120828
CENTER_RGB = (42, 16, 96)    # #2a1060

# Portrait startup images: (filename_suffix, pixel_w, pixel_h, media_query)
IOS_SPLASHES = [
    (
        "iphone-se",
        750,
        1334,
        "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
    ),
    (
        "iphone-xr",
        828,
        1792,
        "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
    ),
    (
        "iphone-xs",
        1125,
        2436,
        "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
    ),
    (
        "iphone-12",
        1170,
        2532,
        "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
    ),
    (
        "iphone-14-pro",
        1179,
        2556,
        "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
    ),
    (
        "iphone-14-pro-max",
        1284,
        2778,
        "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
    ),
    (
        "iphone-15-plus",
        1290,
        2796,
        "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
    ),
    (
        "iphone-16-pro-max",
        1320,
        2868,
        "(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
    ),
]


def radial_gradient(width: int, height: int) -> Image.Image:
    """Build a radial gradient at small size then scale up for speed."""
    size = 512
    img = Image.new("RGB", (size, size))
    px = img.load()
    center = size // 2
    max_r = center
    for y in range(size):
        for x in range(size):
            d = ((x - center) ** 2 + (y - center) ** 2) ** 0.5 / max_r
            t = min(1.0, d)
            rgb = tuple(int(CENTER_RGB[i] * (1 - t) + EDGE_RGB[i] * t) for i in range(3))
            px[x, y] = rgb
    return img.resize((width, height), Image.LANCZOS)


def make_splash(width: int, height: int, logo: Image.Image) -> Image.Image:
    splash = radial_gradient(width, height)
    logo_size = int(min(width, height) * 0.34)
    icon = logo.resize((logo_size, logo_size), Image.LANCZOS)
    x = (width - logo_size) // 2
    y = (height - logo_size) // 2
    splash.paste(icon, (x, y), icon)
    return splash


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"Missing source icon: {SOURCE}")

    SPLASH_DIR.mkdir(parents=True, exist_ok=True)
    logo = Image.open(SOURCE).convert("RGBA")
    meta: list[dict[str, str]] = []

    for name, width, height, media in IOS_SPLASHES:
        filename = f"splash-{width}x{height}.png"
        path = SPLASH_DIR / filename
        make_splash(width, height, logo).save(path, "PNG", optimize=True)
        print(f"Wrote {path}")
        meta.append({"href": f"/splash/{filename}", "media": media})

    # Fallback for newer/unknown iPhones (portrait)
    fallback_w, fallback_h = 1290, 2796
    fallback_name = f"splash-{fallback_w}x{fallback_h}.png"
    fallback_path = SPLASH_DIR / fallback_name
    if not fallback_path.exists():
        make_splash(fallback_w, fallback_h, logo).save(fallback_path, "PNG", optimize=True)
    meta.append({"href": f"/splash/{fallback_name}", "media": "(orientation: portrait)"})

    META_PATH.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(f"Wrote {META_PATH}")


if __name__ == "__main__":
    main()
