#!/usr/bin/env python3
"""Cuts painted buildings out of a flat magenta background (batch B3 and later).

usage: python3 -I tools/images/make_cutouts_key.py [repo_root]

Reads the 1024x1024 originals from assets/_source/gemini/stavby_b3/<key>.jpg (Gemini paints the building on a flat
magenta, see docs/obrazky-stavby.md). Per image:
  - the background colour is the median of the border; alpha is a soft ramp of the colour distance from it,
  - the hard black "contact shadow" parallelogram Gemini likes to put under the building is removed (near-black
    pixels connected to the background; the game draws its own soft shadow),
  - the semi-transparent edge is un-premultiplied and the magenta spill is pulled out of it,
  - crop to the content, assets/buildings/<key>.webp (the cut-out for the maps) and <key>.jpg (560x400 card on parchment).
Writes js/town_art.js (merged with the entries already there: width, height and the "foot", scaled by DISPLAY so the
tight cut-outs stand as big as the older ones that carried a ground patch) and assets/_source/gemini/stavby_b3/manifest.json,
which make_cutouts.py merges back when it rewrites town_art.js. Needs Pillow and numpy.
"""
import json
import os
import re
import sys

import numpy as np
from PIL import Image, ImageFilter

ROOT = sys.argv[1] if len(sys.argv) > 1 else '.'
SRC = os.path.join(ROOT, 'assets/_source/gemini/stavby_b3')
OUT = os.path.join(ROOT, 'assets/buildings')
KEYS = ['vyhen', 'dilna', 'celednik', 'rybnik']
SCALE = 0.5          # 1024 px original -> 512 px working size
LO, HI = 38.0, 105.0  # colour distance from the magenta: transparent below LO, opaque above HI
DISPLAY = 0.8        # a tight cut-out is drawn at this share of its pixel size (the older ones carry a wide ground patch)
CARD = (560, 400)
PARCHMENT = (233, 223, 198)


def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def grow(seed, allowed, limit=400):
    """Flood fill by 8-neighbour dilation: `seed` grows through `allowed`."""
    cur = seed.copy()
    for _ in range(limit):
        p = np.pad(cur, 1)
        nb = np.zeros_like(cur)
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                nb |= p[1 + dy:1 + dy + cur.shape[0], 1 + dx:1 + dx + cur.shape[1]]
        new = nb & allowed
        if (new == cur).all():
            break
        cur = new
    return cur


def cutout(path):
    im = Image.open(path).convert('RGB')
    im = im.resize((int(im.width * SCALE), int(im.height * SCALE)), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32)
    h, w, _ = a.shape
    ring = np.concatenate([a[:8].reshape(-1, 3), a[-8:].reshape(-1, 3), a[:, :8].reshape(-1, 3), a[:, -8:].reshape(-1, 3)])
    bg = np.median(ring, axis=0)
    d = np.sqrt(((a - bg) ** 2).sum(axis=2))
    alpha = smooth((d - LO) / (HI - LO))
    # the hard black contact shadow: near-black pixels that touch the background
    near_black = a.max(axis=2) < 26
    gone = grow(alpha < 0.05, (alpha < 0.05) | near_black)
    # the anti-aliased rim of that shadow is a dark mix with the magenta: take the dark pixels next to it too
    for _ in range(3):
        rim = np.asarray(Image.fromarray((gone * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))) > 0
        gone = gone | (rim & (a.max(axis=2) < 95) & (alpha < 0.97))
    alpha = np.where(gone, 0.0, alpha)
    # soften the edge a little and drop specks: keep the biggest blob
    al = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.9))
    alpha = np.asarray(al).astype(np.float32) / 255.0
    solid = alpha > 0.5
    ys, xs = np.nonzero(solid)
    seed = np.zeros_like(solid)
    cy, cx = int(np.median(ys)), int(np.median(xs))
    seed[cy, cx] = True
    blob = grow(seed, alpha > 0.03, limit=900)
    blob = np.asarray(Image.fromarray((blob * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7))) > 0
    alpha = np.where(blob, alpha, 0.0)
    alpha[alpha < 0.03] = 0.0
    # dark, half-transparent crumbs of the old contact shadow's edge along the foot of the building
    rows = np.arange(h)[:, None] > h * 0.5
    alpha = np.where(rows & (alpha < 0.9) & (a.max(axis=2) < 110), 0.0, alpha)
    safe = np.maximum(alpha, 1e-3)[..., None]
    fg = np.clip((a - (1 - alpha[..., None]) * bg) / safe, 0, 255)
    # magenta spill on the rim: blue and red above green mean pink; pull the blue down on the edge pixels
    edge = (alpha < 0.985) & (alpha > 0)
    edge = np.asarray(Image.fromarray((edge * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))) > 0
    r, g, b = fg[..., 0], fg[..., 1], fg[..., 2]
    spill = edge & (b > g) & (r > g)
    b2 = np.where(spill, g + (b - g) * 0.15, b)
    r2 = np.where(spill, g + (r - g) * 0.75, r)
    # translucent things (the smoke of the forge) took the magenta through the whole body: make them a neutral warm grey
    # (the smoke is dark purple-grey and so as far from the magenta as the building: it stays opaque, only recolour it)
    thin = (alpha > 0.02) & (r > g + 18) & (b > g + 18)
    grey = 0.3 * r + 0.59 * g + 0.11 * b
    grey = np.minimum(grey, 120.0)
    r2 = np.where(thin, grey * 1.04, r2)
    b2 = np.where(thin, grey * 0.92, b2)
    g = np.where(thin, grey, g)
    fg = np.dstack([r2, g, b2])
    rgba = np.dstack([fg, alpha * 255]).astype(np.uint8)
    ys, xs = np.nonzero(alpha > 0.06)
    x0, x1, y0, y1 = max(xs.min() - 3, 0), min(xs.max() + 4, w), max(ys.min() - 3, 0), min(ys.max() + 4, h)
    crop = rgba[y0:y1, x0:x1]
    ca = alpha[y0:y1, x0:x1]
    # foot: the middle of the base (lowest rows of the opaque shape), a hair above the lowest pixel
    ys2, xs2 = np.nonzero(ca > 0.5)
    low = ys2 >= ys2.max() - int(ca.shape[0] * 0.1)
    fx = float((xs2[low].min() + xs2[low].max()) / 2)
    fy = float(ys2.max() - ca.shape[0] * 0.035)
    return Image.fromarray(crop, 'RGBA'), fx, fy


def card(img):
    """560x400 parchment card for the build menu and the detail panel, with a soft shadow under the building."""
    bw, bh = CARD
    fit = min((bw - 60) / img.width, (bh - 50) / img.height)
    big = img.resize((max(1, int(img.width * fit)), max(1, int(img.height * fit))), Image.LANCZOS)
    canvas = Image.new('RGBA', CARD, PARCHMENT + (255,))
    x = (bw - big.width) // 2
    y = int(bh - 26 - big.height)
    shadow = Image.new('RGBA', CARD, (0, 0, 0, 0))
    sh = Image.new('L', CARD, 0)
    ell = Image.new('L', CARD, 0)
    from PIL import ImageDraw
    ImageDraw.Draw(ell).ellipse((x - 10, bh - 26 - 14, x + big.width + 10, bh - 26 + 18), fill=70)
    sh = ell.filter(ImageFilter.GaussianBlur(9))
    shadow.putalpha(sh)
    canvas = Image.alpha_composite(canvas, shadow)
    canvas.alpha_composite(big, (x, y))
    return canvas.convert('RGB')


def main():
    manifest = {}
    total = 0
    for key in KEYS:
        img, fx, fy = cutout(os.path.join(SRC, key + '.jpg'))
        dest = os.path.join(OUT, key + '.webp')
        img.save(dest, 'WEBP', quality=84, method=6, alpha_quality=92)
        card(img).save(os.path.join(OUT, key + '.jpg'), quality=88, optimize=True)
        size = os.path.getsize(dest)
        total += size
        manifest[key] = {'w': round(img.width * DISPLAY), 'h': round(img.height * DISPLAY), 'fx': round(fx * DISPLAY), 'fy': round(fy * DISPLAY), 'clean': 1}
        print(f'{key}: {img.width}x{img.height} foot=({fx:.0f},{fy:.0f}) {size // 1024} KB')
    print(f'total {total // 1024} KB')
    with open(os.path.join(SRC, 'manifest.json'), 'w') as f:
        json.dump(manifest, f, indent=1)
    # merge with the entries already in town_art.js
    path = os.path.join(ROOT, 'js/town_art.js')
    old = open(path).read()
    entries = {}
    for m in re.finditer(r'^\s+(\w+): \{ w: (\d+), h: (\d+), fx: (\d+), fy: (\d+)(, clean: 1)? \},$', old, re.M):
        entries[m.group(1)] = {'w': int(m.group(2)), 'h': int(m.group(3)), 'fx': int(m.group(4)), 'fy': int(m.group(5)), 'clean': 1 if m.group(6) else 0}
    entries.update(manifest)
    lines = ['// Generated by tools/images/make_cutouts.py and make_cutouts_key.py: size and foot point (where the building touches',
             '// the ground) of every cut-out in assets/buildings/<key>.webp, in image pixels. `clean` = cut out of a flat background',
             '// (no ground patch, drawn without the soft edge mask). Do not edit by hand.',
             'export const CUTOUTS = {']
    for key, m in entries.items():
        lines.append(f"  {key}: {{ w: {m['w']}, h: {m['h']}, fx: {m['fx']}, fy: {m['fy']}{', clean: 1' if m.get('clean') else ''} }},")
    lines.append('};')
    with open(path, 'w') as f:
        f.write('\n'.join(lines) + '\n')


main()
