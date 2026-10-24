"""
Gera as medalhas recoloridas das conquistas Brutal (vermelha) e Secreta (verde-água) a partir das ORIGINAIS de
public/sprites/badges (comum-*, rara-*, lenda-*). Regra da equipe (24/10/2026): só as artes originais; quando uma se
repete, no máximo muda a cor. Comum, rara e lendária usam as originais direto (config/assets.ts, BADGE_ART).

Uso (precisa de Pillow): python3 scripts/gerar-conquistas.py   (na pasta frontend)
Saída: public/sprites/badges/{b-01,b-02,s-01,s-02,s-03}.png
"""

from __future__ import annotations

import colorsys
from collections import Counter
from pathlib import Path

from PIL import Image

BADGES = Path(__file__).resolve().parent.parent / "public" / "sprites" / "badges"

RED = 0.0
TEAL = 0.47

# código → (original, matiz de destino)
RECOLORS: dict[str, tuple[str, float]] = {
    "b-01": ("lenda-2", RED),
    "b-02": ("lenda-1", RED),
    "s-01": ("rara-4", TEAL),
    "s-02": ("comum-4", TEAL),
    "s-03": ("rara-2", TEAL),
}


def main_hue(image: Image.Image) -> float:
    """Matiz mais comum entre os pixels coloridos (a cor da moldura)."""
    hues = Counter()
    for r, g, b, a in image.getdata():
        if a == 0:
            continue
        h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
        if s > 0.4 and 0.15 < l < 0.85:
            hues[round(h, 2)] += 1
    return hues.most_common(1)[0][0]


def recolor(image: Image.Image, target: float) -> Image.Image:
    shift = target - main_hue(image)
    out = image.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
            r2, g2, b2 = colorsys.hls_to_rgb((h + shift) % 1.0, l, s)
            px[x, y] = (round(r2 * 255), round(g2 * 255), round(b2 * 255), a)
    return out


def main() -> None:
    for code, (source, target) in RECOLORS.items():
        recolor(Image.open(BADGES / f"{source}.png").convert("RGBA"), target).save(BADGES / f"{code}.png")
    print(f"{len(RECOLORS)} medalhas recoloridas.")


if __name__ == "__main__":
    main()
