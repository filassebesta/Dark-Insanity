"""Process a batch of generated images into the game's assets.

usage: python3 process_batch.py <dir1,dir2,...> <scratch_dir> <repo_root> detect|place
  detect  — print the suspected pasted dark band (row, coverage, strength) for each file
  place   — resize/crop to the game format and save into assets/{portraits,endings,events}
            FIX=a.jpg,b.jpg  files whose band should be corrected (before/after preview
                             goes to <scratch_dir>/bandfix_<name>.png)
            BATCH=name       originals are copied to assets/_source/gemini/<name> (default "batch")
            ROW=a.jpg:692,b.jpg:640  band row set by hand, for a band the detector misses
                             (one that covers only part of the width); implies FIX for that file
Needs Pillow and numpy. File names must already be the game's names.
"""
import sys, os, glob, shutil
import numpy as np
from PIL import Image, ImageFilter
SRC_DIRS, S, ROOT, MODE = sys.argv[1].split(','), sys.argv[2], sys.argv[3], sys.argv[4]

def detect(a, lo=0.55, hi=0.8):
    g = a.mean(axis=2)
    h, w = g.shape
    strips = g[:, : w // 32 * 32].reshape(h, 32, w // 32).mean(axis=2)
    best = None
    for y in range(int(h * lo), int(h * hi)):
        d = strips[y - 4:y - 1].mean(axis=0) - strips[y + 1:y + 4].mean(axis=0)
        frac, mean = float((d > 3).mean()), float(d.mean())
        if frac >= 0.6 and mean >= 8 and (best is None or frac * mean > best[1] * best[2]):
            best = (y, frac, mean)
    return best

def fix(a, y):
    h, w = a.shape[:2]
    ww = w // 32 * 32
    above = np.median(a[y - 8:y - 1, :ww].reshape(7, 32, ww // 32, 3).mean(axis=(0, 2)), axis=0)
    below = np.median(a[y + 2:y + 9, :ww].reshape(7, 32, ww // 32, 3).mean(axis=(0, 2)), axis=0)
    ratio = np.clip(above / np.maximum(below, 1), 1, 4)
    out = a.copy()
    out[y:] = np.clip(a[y:] * ratio, 0, 255)
    seam = slice(max(0, y - 2), min(h, y + 3))
    out[seam] = np.mean(out[max(0, y - 4):min(h, y + 5)], axis=0)
    return out

def target(name):
    if name.startswith(('ruler_', 'heir_')) or name.split('_')[0] == 's' and name.rsplit('_', 1)[-1] in ('male.jpg', 'female.jpg'):
        return 'portraits', (1024, 1280)
    if name.startswith('ending_'):
        return 'endings', (1365, 768)
    return 'events', (1024, 1024)

def fit(im, size):
    tw, th = size
    k = max(tw / im.width, th / im.height)
    im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    l, t = (im.width - tw) // 2, (im.height - th) // 2
    im = im.crop((l, t, l + tw, t + th))
    if k > 1.01:
        im = im.filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))
    return im

files = sorted(f for d in SRC_DIRS for f in glob.glob(d + '/*.jpg'))
for f in files:
    name = os.path.basename(f)
    a = np.asarray(Image.open(f).convert('RGB')).astype(np.float32)
    band = detect(a)
    rows = dict(x.split(':') for x in os.environ.get('ROW', '').split(',') if ':' in x)
    if name in rows:
        band = (int(rows[name]), None, None)
    if MODE == 'detect':
        print(name, band)
        continue
    folder, size = target(name)
    fixes = os.environ.get('FIX', '').split(',') + list(rows)
    if band and name in fixes:
        b = fix(a, band[0])
        Image.fromarray(np.hstack([np.asarray(Image.fromarray(a.astype(np.uint8)).resize((400, 400))), np.asarray(Image.fromarray(b.astype(np.uint8)).resize((400, 400)))])).save(f'{S}/bandfix_{name}.png')
        a = b
    out = fit(Image.fromarray(a.astype(np.uint8)), size)
    out.save(f'{ROOT}/assets/{folder}/{name}', quality=86, optimize=True, progressive=True)
    batch = os.environ.get('BATCH', 'batch')
    os.makedirs(f'{ROOT}/assets/_source/gemini/{batch}', exist_ok=True)
    shutil.copy(f, f'{ROOT}/assets/_source/gemini/{batch}/{name}')
    print('placed', folder, name, 'band fixed' if band and name in fixes else '')
