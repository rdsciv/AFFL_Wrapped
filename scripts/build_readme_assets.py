#!/usr/bin/env python3
"""Generate the animated README tour from reproducible vector-like frames."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "media" / "affl-demo.gif"
WIDTH, HEIGHT = 960, 540

FONT_CANDIDATES = {
    "display": [
        "/System/Library/Fonts/Supplemental/Arial Narrow Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed-Bold.ttf",
    ],
    "body": [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ],
    "mono": [
        "/System/Library/Fonts/Menlo.ttc",
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
    ],
}

SCENES = [
    ("THE ANNUALS", "EVERY SEASON\nLEFT A MARK.", "#f2c84b", "2014-2025 / 12 CINEMATIC SEASON STORIES", ["2025", "2024", "2023"]),
    ("2025 / VOLUME 12", "THE LONG\nCAMPAIGN.", "#e63b2e", "CHAMPION / SAN DIEGO SHADOWCOCKS", ["11-3", "1543 PF", "#1 SEED"]),
    ("NO SCHEDULE EXCUSES", "POWER\nAND LUCK.", "#1e56d8", "ACTUAL WINS VS. ALL-PLAY EXPECTED WINS", ["+2.36", "+0.82", "-2.00"]),
    ("GAMES WE REMEMBER", "MATCHUP\nAWARDS.", "#f2c84b", "BLOWOUTS / NAIL-BITERS / FIREWORKS / PILLOW FIGHTS", ["0.12", "83.4", "291.8"]),
    ("THE LEAGUE HISTORY ENGINE", "YOUR LEAGUE\nDESERVES THIS.", "#e63b2e", "EXPLORE THE OPEN-SOURCE AFFL WRAPPED EXPERIENCE", ["DATA", "STORY", "GLORY"]),
]


def font(kind: str, size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for candidate in FONT_CANDIDATES[kind]:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()


def frame(scene: tuple[str, str, str, str, list[str]], index: int) -> Image.Image:
    eyebrow, headline, accent, detail, cards = scene
    image = Image.new("RGB", (WIDTH, HEIGHT), "#151513")
    draw = ImageDraw.Draw(image)

    draw.polygon([(570, 0), (960, 0), (960, 244), (515, 155)], fill=accent)
    draw.ellipse((745, 350, 1115, 720), outline="#353431", width=42)
    draw.rectangle((45, 42, 103, 100), fill="#e63b2e")
    draw.text((74, 71), "AFFL", font=font("display", 21), anchor="mm", fill="#ffffff")

    draw.text((46, 132), eyebrow, font=font("mono", 11), fill="#f2c84b")
    draw.multiline_text((44, 173), headline, font=font("display", 72), fill="#f2ecdf", spacing=-6)
    draw.text((48, 358), detail, font=font("body", 12), fill="#999287")

    for card_index, card in enumerate(cards):
        left = 536 + card_index * 132
        top = 304
        draw.rectangle((left, top, left + 116, top + 105), fill="#f2ecdf")
        draw.text((left + 13, top + 12), f"0{card_index + 1}", font=font("mono", 8), fill="#6d685f")
        draw.text((left + 13, top + 56), card, font=font("display", 23), fill="#151513")
        draw.rectangle((left + 13, top + 84, left + 68, top + 88), fill=accent)

    draw.line((46, 470, 914, 470), fill="#484641", width=1)
    draw.text((46, 492), "AFFL WRAPPED / SEASON HISTORY IN MOTION", font=font("mono", 8), fill="#777168")
    draw.text((914, 492), f"{index + 1} / {len(SCENES)}", font=font("mono", 8), anchor="ra", fill="#f2ecdf")
    return image


def main() -> None:
    frames = [frame(scene, index) for index, scene in enumerate(SCENES)]
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    frames[0].save(
        OUTPUT,
        save_all=True,
        append_images=frames[1:],
        duration=[1200, 1200, 1200, 1200, 1800],
        loop=0,
        optimize=True,
        disposal=2,
    )
    print(f"Wrote {OUTPUT} ({OUTPUT.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
