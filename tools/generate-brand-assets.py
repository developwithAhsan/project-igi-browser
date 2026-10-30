#!/usr/bin/env python3
"""Generate web icons and a social preview from repository-owned brand assets."""
from pathlib import Path
import base64
import io

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
logo_path = ROOT / "logo.png"
social_svg = ROOT / "og-project-igi.svg"
if not logo_path.exists():
    raise SystemExit("logo.png is missing")
if not social_svg.exists():
    raise SystemExit("og-project-igi.svg is missing")

logo = Image.open(logo_path).convert("RGBA")

def square_icon(size: int, inset: float = 0.08) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    max_side = max(1, int(size * (1 - inset * 2)))
    mark = ImageOps.contain(logo, (max_side, max_side), Image.Resampling.LANCZOS)
    canvas.alpha_composite(mark, ((size - mark.width) // 2, (size - mark.height) // 2))
    return canvas

# Multi-resolution ICO and the platform-specific PNG sizes.
square_icon(48).save(ROOT / "favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
square_icon(180, 0.06).save(ROOT / "apple-touch-icon.png", format="PNG", optimize=True)
square_icon(192, 0.06).save(ROOT / "icon-192.png", format="PNG", optimize=True)
square_icon(512, 0.06).save(ROOT / "icon-512.png", format="PNG", optimize=True)

# SVG favicon embeds the same original PNG mark; it is not a separate logo design.
png_data = base64.b64encode(logo_path.read_bytes()).decode("ascii")
favicon_svg = (
    '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">'
    f'<image href="data:image/png;base64,{png_data}" width="128" height="128" '
    'preserveAspectRatio="xMidYMid meet"/></svg>\n'
)
(ROOT / "favicon.svg").write_text(favicon_svg, encoding="utf-8")

# The original SVG is our own typography-and-grid preview graphic, not game artwork.
import cairosvg
png_bytes = cairosvg.svg2png(url=str(social_svg), output_width=1200, output_height=630)
out = ROOT / "og-project-igi.png"
out.write_bytes(png_bytes)
if out.stat().st_size > 300 * 1024:
    image = Image.open(io.BytesIO(png_bytes)).convert("RGB")
    jpg = ROOT / "og-project-igi.jpg"
    image.save(jpg, "JPEG", quality=88, optimize=True, progressive=True)
    if jpg.stat().st_size > 300 * 1024:
        raise SystemExit("Open Graph image exceeds 300 KB after JPEG optimization")
    out.unlink()
    print(f"Generated {jpg.name}: {jpg.stat().st_size} bytes")
else:
    print(f"Generated {out.name}: {out.stat().st_size} bytes")
for name in ["favicon.ico", "favicon.svg", "apple-touch-icon.png", "icon-192.png", "icon-512.png"]:
    print(f"Generated {name}: {(ROOT / name).stat().st_size} bytes")
