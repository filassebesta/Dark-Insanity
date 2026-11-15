#!/usr/bin/env python3
"""Removes the zone guides Gemini painted into the three battle backdrops (bt_field, bt_siege, bt_ambush).

  python3 tools/images/clean_battle_guides.py            # originals in assets/_source/gemini/bitvy -> assets/battle

The model drew my "three vertical thirds" as artifacts:
  bojiste.jpg         translucent grey panels (centre lighter, right darker) and a darker band across the lower part
                      -> per channel linear fit across each seam (the scene is continuous there), then a soft seam
  pevnost.jpg         two black vertical lines                      -> filled from the mirrored neighbouring columns
  horsky_prusmyk.jpg  a black rectangle outline around the centre   -> filled from the mirrored neighbouring pixels
Needs only Pillow and numpy.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

SRC = Path(__file__).resolve().parents[2] / 'assets' / '_source' / 'gemini' / 'bitvy'
OUT = Path(__file__).resolve().parents[2] / 'assets' / 'battle'


def fill_cols(a, x0, x1, y0=0, y1=None):
    """Columns x0..x1 (inclusive) in rows y0..y1 become the blend of the mirrored columns on both sides."""
    y1 = a.shape[0] - 1 if y1 is None else y1
    w = x1 - x0 + 1
    for k in range(w):
        # each half copies the mirrored columns of its own side, so an edge (rock against sky) stays crisp
        a[y0:y1 + 1, x0 + k] = a[y0:y1 + 1, x0 - 1 - k] if k < w / 2 else a[y0:y1 + 1, x1 + 1 + (w - 1 - k)]


def fill_rows(a, y0, y1, x0=0, x1=None):
    x1 = a.shape[1] - 1 if x1 is None else x1
    h = y1 - y0 + 1
    for k in range(h):
        a[y0 + k, x0:x1 + 1] = a[y0 - 1 - k, x0:x1 + 1] if k < h / 2 else a[y1 + 1 + (h - 1 - k), x0:x1 + 1]


def fit(ref, reg):
    """Per channel (gain, offset) so that gain * reg + offset ~ ref (rows of correspondences, robust to outliers)."""
    out = []
    for c in range(3):
        x, y = reg[:, c], ref[:, c]
        g, o = np.polyfit(x, y, 1)
        r = y - (g * x + o)
        keep = np.abs(r) < 2.5 * (r.std() + 1e-6)
        g, o = np.polyfit(x[keep], y[keep], 1)
        out.append((g, o))
    return out


def apply(a, box, gains):
    y0, y1, x0, x1 = box
    for c, (g, o) in enumerate(gains):
        a[y0:y1, x0:x1, c] = a[y0:y1, x0:x1, c] * g + o


def clean_field(a):
    """Panels: centre x 459..917, right x 918.., band y 595..708 over the whole width."""
    H, W, _ = a.shape
    top = slice(0, 592)
    # centre against the left third
    ref = a[top, 438:454].mean(1); reg = a[top, 463:479].mean(1)
    apply(a, (0, 592, 459, 918), fit(ref, reg))
    # right against the (now corrected) centre
    ref = a[top, 898:914].mean(1); reg = a[top, 922:938].mean(1)
    apply(a, (0, 592, 918, W), fit(ref, reg))
    # the band, against the calm strip below it (the top edge is the real edge of that strip: the scene above is
    # darker by itself, so only the lower seam is a guide)
    ref_dn = a[711:726, :].mean(0); reg_dn = a[692:707, :].mean(0)
    before = a[595:635].copy()
    apply(a, (595, 709, 0, W), fit(ref_dn, reg_dn))
    # the corrected strip fades in over its first rows, like a soft shadow at the edge of the meadow
    t = (np.arange(40) / 40.0)[:, None, None]
    a[595:635] = before * (1 - t) + a[595:635] * t
    # soft seams: a few pixels of linear cross-fade where the old edges were
    for x in (458, 459, 917, 918):
        a[:592, x] = (a[:592, x - 2] + a[:592, x + 2]) / 2
    for y in (708, 709):
        a[y, :] = (a[y - 2, :] + a[y + 2, :]) / 2
    return a


def clean_siege(a):
    fill_cols(a, 452, 461)
    fill_cols(a, 913, 922)
    return a


def clean_ambush(a):
    # black outline: left x 454..462, right x 912..920 (rows 0..565), bottom y 555..565 between them
    fill_rows(a, 555, 566, 454, 921)
    fill_cols(a, 454, 463, 0, 566)
    fill_cols(a, 911, 920, 0, 566)
    return a


JOBS = [('bojiste.jpg', 'bt_field.jpg', clean_field), ('pevnost.jpg', 'bt_siege.jpg', clean_siege),
        ('horsky_prusmyk.jpg', 'bt_ambush.jpg', clean_ambush)]

if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    for src, dst, fn in JOBS:
        a = np.asarray(Image.open(SRC / src).convert('RGB')).astype(np.float64)
        a = np.clip(fn(a), 0, 255).astype(np.uint8)
        Image.fromarray(a).save(OUT / dst, quality=90, optimize=True)
        print(dst, a.shape)
