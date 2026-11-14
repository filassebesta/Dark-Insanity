"""Cut the painted buildings out of their parchment-beige background.

usage: python3 -I tools/images/make_cutouts.py [repo_root]

Reads the 1024x1024 originals from assets/_source/gemini/stavby_b2/<key>.jpg (the 560x400 JPGs in
assets/buildings/ stay as they are: the build menu and the detail panel use them), keys out the
background with a soft alpha ramp (the painted olive ground patch stays, so it blends into the
scene), un-premultiplies the semi-transparent edge (a soft shadow becomes dark + transparent
instead of a beige smudge), crops to the content and saves assets/buildings/<key>.webp.
Also writes js/town_art.js: size and "foot" point of every cut-out (where it touches the ground),
which town.js uses to stand the building on its plot.
Needs Pillow and numpy.
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageFilter

ROOT = sys.argv[1] if len(sys.argv) > 1 else '.'
SRC = os.path.join(ROOT, 'assets/_source/gemini/stavby_b2')
OUT = os.path.join(ROOT, 'assets/buildings')
KEYS = ['stodola', 'mlynek', 'chlev', 'staj', 'chlivek', 'kolna', 'vcelin', 'sad', 'kaplicka', 'kostel']
SCALE = 0.5          # 1024 px original -> 512 px working size (a building ends up ~300-400 px wide)
LO, HI = 9.0, 44.0   # colour distance from the background: fully transparent below LO, opaque above HI


def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def cutout(path):
    im = Image.open(path).convert('RGB')
    im = im.resize((int(im.width * SCALE), int(im.height * SCALE)), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32)
    h, w, _ = a.shape
    ring = np.concatenate([a[:8].reshape(-1, 3), a[-8:].reshape(-1, 3), a[:, :8].reshape(-1, 3), a[:, -8:].reshape(-1, 3)])
    bg = np.median(ring, axis=0)
    # the background is not perfectly flat (a faint vignette): follow it with a heavy blur of the border colour
    d = np.sqrt(((a - bg) ** 2).sum(axis=2))
    alpha = smooth((d - LO) / (HI - LO))
    # a single pass of blur closes pin-holes and softens the brushy edge of the ground patch
    al = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.1))
    alpha = np.asarray(al).astype(np.float32) / 255.0
    # remove isolated specks of alpha far from the content (paper grain): keep the largest blob by a coarse mask
    coarse = np.asarray(al.resize((w // 8, h // 8), Image.BOX)).astype(np.float32) / 255.0
    from_edge = np.zeros_like(coarse, dtype=bool)
    # the content is one connected island; a flood fill from the centre of mass keeps it
    ys, xs = np.nonzero(coarse > 0.15)
    cy, cx = int(ys.mean()), int(xs.mean())
    stack = [(cy, cx)]
    while stack:
        y, x = stack.pop()
        if y < 0 or x < 0 or y >= coarse.shape[0] or x >= coarse.shape[1] or from_edge[y, x] or coarse[y, x] <= 0.02:
            continue
        from_edge[y, x] = True
        stack += [(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1), (y + 1, x + 1), (y - 1, x - 1), (y + 1, x - 1), (y - 1, x + 1)]
    keep = np.kron(from_edge, np.ones((8, 8)))[:h, :w] > 0
    keep = np.asarray(Image.fromarray((keep * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9))) > 0
    alpha = np.where(keep, alpha, 0.0)
    # the painted ground patch has a pale brushy rim: eat it away and feather the edge, but only in the lower
    # part of the picture (the patch), never at the roofline
    hard = Image.fromarray((np.clip(alpha * 1.6 - 0.3, 0, 1) * 255).astype(np.uint8))
    feather = np.asarray(hard.filter(ImageFilter.MinFilter(9)).filter(ImageFilter.GaussianBlur(5))).astype(np.float32) / 255.0
    rows = np.linspace(0, 1, h)[:, None]
    wy = smooth((rows - 0.5) / 0.2)
    alpha = alpha * (1 - wy) + np.minimum(alpha, feather) * wy
    alpha[alpha < 0.035] = 0.0
    safe = np.maximum(alpha, 1e-3)[..., None]
    fg = np.clip((a - (1 - alpha[..., None]) * bg) / safe, 0, 255)
    # semi-transparent rim of the patch: pull its colour to the patch's own olive so no pale line is left
    low_rows = (rows > 0.78) & (alpha > 0.97)
    if low_rows.sum() > 50:
        patch = np.median(fg[low_rows], axis=0)
        k = (np.clip(1 - alpha, 0, 1) ** 0.6 * wy)[..., None]
        k = np.where(alpha[..., None] > 0.02, k, 0)
        fg = fg * (1 - k) + patch * 0.82 * k
    rgba = np.dstack([fg, alpha * 255]).astype(np.uint8)
    ys, xs = np.nonzero(alpha > 0.06)
    x0, x1, y0, y1 = max(xs.min() - 4, 0), min(xs.max() + 5, w), max(ys.min() - 4, 0), min(ys.max() + 5, h)
    crop = rgba[y0:y1, x0:x1]
    ca = alpha[y0:y1, x0:x1]
    # foot: the middle of the painted ground patch (centroid of the opaque pixels in the lowest quarter)
    low = ca[int(ca.shape[0] * 0.72):]
    lys, lxs = np.nonzero(low > 0.5)
    fx = float(lxs.mean()) if len(lxs) else crop.shape[1] / 2
    fy = float(int(ca.shape[0] * 0.72) + lys.mean()) if len(lys) else crop.shape[0] * 0.88
    return Image.fromarray(crop, 'RGBA'), fx, fy


def main():
    manifest = {}
    total = 0
    for key in KEYS:
        img, fx, fy = cutout(os.path.join(SRC, key + '.jpg'))
        dest = os.path.join(OUT, key + '.webp')
        img.save(dest, 'WEBP', quality=84, method=6, alpha_quality=90)
        size = os.path.getsize(dest)
        total += size
        manifest[key] = {'w': img.width, 'h': img.height, 'fx': round(fx), 'fy': round(fy)}
        print(f'{key}: {img.width}x{img.height} foot=({fx:.0f},{fy:.0f}) {size // 1024} KB')
    print(f'total {total // 1024} KB')
    lines = ['// Generated by tools/images/make_cutouts.py: size and foot point (where the building touches the ground)',
             '// of every cut-out in assets/buildings/<key>.webp, in image pixels. Do not edit by hand.',
             'export const CUTOUTS = {']
    for key, m in manifest.items():
        lines.append(f"  {key}: {{ w: {m['w']}, h: {m['h']}, fx: {m['fx']}, fy: {m['fy']} }},")
    lines.append('};')
    with open(os.path.join(ROOT, 'js/town_art.js'), 'w') as f:
        f.write('\n'.join(lines) + '\n')


main()
