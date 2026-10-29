#!/bin/sh
# Post-translation patch for Project I.G.I.; build.sh runs it with the generated-code directory (it finds it next
# to the profile, or PATCH=...). The game keeps the tangent of half its horizontal field of view at 0xbcab20
# (rewritten every frame from its camera); its projection and its own transform of near polygons read it there.
# Every read is multiplied by rc_aspect_x (runtime.h), which the recorder sets to (display aspect) / (4/3) for
# frames drawn wide and to 1 otherwise (host/render_rec.c), so the picture is wider, not stretched, once the
# game is told a wide display (host/ddraw7.c SetDisplayMode). Idempotent.
set -e
OUT="$1"
[ -d "$OUT" ] || { echo "patch.sh: no directory $OUT" >&2; exit 1; }
for f in "$OUT"/*.c; do
    grep -q 'RF32((uint32_t)(0xbcab20u))' "$f" || continue
    grep -q 'rc_aspect_x' "$f" && continue
    sed -i '' 's|(double)RF32((uint32_t)(0xbcab20u))|((double)RF32((uint32_t)(0xbcab20u)) * rc_aspect_x)|g' "$f"
    echo "  patched $(basename "$f"): $(grep -c 'rc_aspect_x' "$f") reads of the field-of-view tangent"
done
