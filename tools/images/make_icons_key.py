#!/usr/bin/env python3
"""Cuts the painted icons of the top-bar tabs out of their flat magenta background.

usage: python3 -I tools/images/make_icons_key.py [repo_root]

Reads assets/_source/gemini/ikony/<key>.jpg (2000 x 2000, a single icon on flat magenta, see docs/obrazky-ikony.md)
and writes assets/ui/tab_<key>.webp (192 x 192, transparent). The key of a tab is added to TAB_ART in js/tab_icons.js.
Modes (JOBS below):
  cut    key out the magenta, un-premultiply the edge, pull the pink out of it, trim, fit into a square
  frame  the painting came on a wooden board: key out the magenta, then take off the frame of the board
  tile   the painting has its own painted background (a rectangle): crop the rectangle, round the corners
Needs Pillow and numpy.
"""
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = sys.argv[1] if len(sys.argv) > 1 else '.'
SRC = os.path.join(ROOT, 'assets/_source/gemini/ikony')
OUT = os.path.join(ROOT, 'assets/ui')
SIZE = 192
WORK = 0.5          # 2000 px original -> 1000 px working size
LO, HI = 38.0, 105.0

JOBS = {'chronicle': 'tile', 'character': 'frame', 'map': 'cut', 'trade': 'cut', 'war': 'cut'}


def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def grow(seed, allowed, limit=1200):
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


def key(path):
    im = Image.open(path).convert('RGB')
    im = im.resize((int(im.width * WORK), int(im.height * WORK)), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32)
    ring = np.concatenate([a[:8].reshape(-1, 3), a[-8:].reshape(-1, 3), a[:, :8].reshape(-1, 3), a[:, -8:].reshape(-1, 3)])
    bg = np.median(ring, axis=0)
    d = np.sqrt(((a - bg) ** 2).sum(axis=2))
    alpha = smooth((d - LO) / (HI - LO))
    return a, alpha, bg


def blob(alpha):
    """Keep the one big shape (specks of the background texture go)."""
    solid = alpha > 0.5
    ys, xs = np.nonzero(solid)
    seed = np.zeros_like(solid)
    seed[int(np.median(ys)), int(np.median(xs))] = True
    keep = grow(seed, alpha > 0.03)
    keep = np.asarray(Image.fromarray((keep * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7))) > 0
    return np.where(keep, alpha, 0.0)


def finish(a, alpha, bg):
    # one pixel in from the edge: the rim of a keyed edge is where the pink hides
    a8 = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.6))
    alpha = np.minimum(alpha, np.asarray(a8).astype(np.float32) / 255.0 * 1.04).clip(0, 1)
    safe = np.maximum(alpha, 1e-3)[..., None]
    fg = np.clip((a - (1 - alpha[..., None]) * bg) / safe, 0, 255)
    edge = (alpha < 0.985) & (alpha > 0)
    edge = np.asarray(Image.fromarray((edge * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))) > 0
    r, g, b = fg[..., 0], fg[..., 1], fg[..., 2]
    spill = edge & (b > g) & (r > g)
    b2 = np.where(spill, g + (b - g) * 0.05, b)
    r2 = np.where(spill, g + (r - g) * 0.55, r)
    return np.dstack([np.dstack([r2, g, b2]), alpha * 255]).astype(np.uint8), alpha


def square(rgba, alpha):
    ys, xs = np.nonzero(alpha > 0.06)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    crop = Image.fromarray(rgba[y0:y1, x0:x1], 'RGBA')
    side = int(max(crop.width, crop.height) * 1.06)
    canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    canvas.alpha_composite(crop, ((side - crop.width) // 2, (side - crop.height) // 2))
    return canvas.resize((SIZE, SIZE), Image.LANCZOS)


def cut(path):
    a, alpha, bg = key(path)
    alpha = blob(alpha)
    alpha[alpha < 0.03] = 0.0
    return square(*finish(a, alpha, bg))


def frame(path):
    a, alpha, bg = key(path)
    # the board with the painting: the magenta inside it is keyed away too, then the wooden rim is taken off
    ys, xs = np.nonzero(alpha > 0.5)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    t = int((x1 - x0) * 0.028)
    ring = np.ones_like(alpha, dtype=bool)
    ring[y0 + t:y1 - t, x0 + t:x1 - t] = False
    alpha = np.where(ring, 0.0, alpha)
    alpha = blob(alpha)
    alpha[alpha < 0.03] = 0.0
    return square(*finish(a, alpha, bg))


def tile(path):
    a, alpha, bg = key(path)
    ys, xs = np.nonzero(alpha > 0.5)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    img = Image.fromarray(np.clip(a[y0:y1, x0:x1], 0, 255).astype(np.uint8)).convert('RGBA')
    side = max(img.width, img.height)
    sq = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    sq.paste(img, ((side - img.width) // 2, (side - img.height) // 2))
    r = int(side * 0.12)
    mask = Image.new('L', (side, side), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, side - 1, side - 1), r, fill=255)
    sq.putalpha(mask)
    ImageDraw.Draw(sq).rounded_rectangle((0, 0, side - 1, side - 1), r, outline=(200, 164, 106, 255), width=max(3, side // 120))
    return sq.resize((SIZE, SIZE), Image.LANCZOS)


MODES = {'cut': cut, 'frame': frame, 'tile': tile}


def main():
    os.makedirs(OUT, exist_ok=True)
    total = 0
    for key_, mode in JOBS.items():
        path = os.path.join(SRC, key_ + '.jpg')
        if not os.path.exists(path):
            continue
        img = MODES[mode](path)
        dest = os.path.join(OUT, f'tab_{key_}.webp')
        img.save(dest, 'WEBP', quality=88, method=6, alpha_quality=95)
        total += os.path.getsize(dest)
        print(f'{key_} ({mode}): {os.path.getsize(dest) // 1024} KB')
    print(f'total {total // 1024} KB')


main()
