"""Process a batch of generated images into the game's assets.

usage: python3 process_batch.py <dir1,dir2,...> <scratch_dir> <repo_root> detect|place
  detect  — print the suspected pasted dark band (row, coverage, strength, row where it ends) for each file
  place   — resize/crop to the game format and save into assets/{portraits,endings,events}
            FIX=a.jpg,b.jpg  files whose band should be corrected (before/after preview
                             goes to <scratch_dir>/bandfix_<name>.png)
            BATCH=name       originals are copied to assets/_source/gemini/<name> (default "batch")
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

def band_end(a, y):
    """Where a pasted dark band ends again (the image below it is normal), or None if it runs to the bottom."""
    g = a.mean(axis=2)
    h, w = g.shape
    strips = g[:, : w // 32 * 32].reshape(h, 32, w // 32).mean(axis=2)
    best = None
    for yy in range(y + 40, h - 5):
        d = strips[yy + 1:yy + 4].mean(axis=0) - strips[yy - 4:yy - 1].mean(axis=0)  # brighter below = the band ends
        frac, mean = float((d > 3).mean()), float(d.mean())
        if frac >= 0.6 and mean >= 8 and (best is None or frac * mean > best[1] * best[2]):
            best = (yy, frac, mean)
    return best[0] if best else None

def chan(a, rows):
    ww = a.shape[1] // 32 * 32
    n = rows.stop - rows.start
    return np.median(a[rows, :ww].reshape(n, 32, ww // 32, 3).mean(axis=(0, 2)), axis=0)

def fix(a, y):
    """Brightens the band from row y: to the bottom, or only to where it ends (ratio blended between both edges)."""
    h = a.shape[0]
    end = band_end(a, y)
    top = np.clip(chan(a, slice(y - 8, y - 1)) / np.maximum(chan(a, slice(y + 2, y + 9)), 1), 1, 4)
    out = a.copy()
    if end is None:
        out[y:] = np.clip(a[y:] * top, 0, 255)
        seams = [y]
    else:
        bottom = np.clip(chan(a, slice(end + 2, end + 9)) / np.maximum(chan(a, slice(end - 9, end - 2)), 1), 1, 4)
        n = end - y
        for i in range(n):
            t = i / max(1, n - 1)
            out[y + i] = np.clip(a[y + i] * (top * (1 - t) + bottom * t), 0, 255)
        seams = [y, end]
    for sy in seams:
        out[max(0, sy - 2):min(h, sy + 3)] = np.mean(out[max(0, sy - 4):min(h, sy + 5)], axis=0)
    return out

def target(name):
    if name.startswith(('ruler_', 'realm_')) or name.split('_')[0] == 's' and name.rsplit('_', 1)[-1] in ('male.jpg', 'female.jpg'):
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
    if MODE == 'detect':
        print(name, band, 'ends at', band_end(a, band[0]) if band else None)
        continue
    folder, size = target(name)
    fixes = os.environ.get('FIX', '').split(',')
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
