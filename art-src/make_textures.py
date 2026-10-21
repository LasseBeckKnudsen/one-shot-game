"""Turns the raw Create Art generations into seamless 1024px tiles in assets/textures.
usage: python3 -I art-src/make_textures.py <raw dir>"""
import sys, numpy as np
from PIL import Image

raw = sys.argv[1]
out = 'assets/textures'

def square(img, box=None):
    w, h = img.size
    if box: return img.crop(box)
    s = min(w, h); x = (w - s) // 2; y = (h - s) // 2
    return img.crop((x, y, x + s, y + s))

def seamless(img, size=1024):
    img = img.resize((size, size), Image.LANCZOS)
    a = np.asarray(img).astype(np.float32)
    r = np.roll(a, (size // 2, size // 2), (0, 1))
    t = np.abs(np.linspace(-1, 1, size))
    w = (1 - t) ** 0.75
    m = np.minimum.outer(w, w)[..., None]  # 1 in the middle, 0 on every edge
    return Image.fromarray(np.clip(a * m + r * (1 - m), 0, 255).astype(np.uint8))

def hue_shift(img, fn, sat=1.0, val=1.0):
    hsv = np.asarray(img.convert('HSV')).astype(np.float32)
    hsv[..., 0] = fn(hsv[..., 0]) % 256
    hsv[..., 1] = np.clip(hsv[..., 1] * sat, 0, 255)
    hsv[..., 2] = np.clip(hsv[..., 2] * val, 0, 255)
    return Image.fromarray(hsv.astype(np.uint8), 'HSV').convert('RGB')

jobs = {
    'bark': (None, None),
    'thatch': (None, None),
    'stone': (None, None),
    'planks': ((1390, 225, 4120, 2855), None),
    'grass': (None, lambda i: hue_shift(i, lambda h: np.where(h < 60, h + 26, h), 1.1, 1.18)),
    'leaves': (None, lambda i: hue_shift(i, lambda h: np.where(h < 48, h + 42, h + 6), 1.05, 1.08)),
}
for name, (box, post) in jobs.items():
    im = Image.open(f'{raw}/{name}.jpg').convert('RGB')
    im = square(im, box)
    if post: im = post(im)
    seamless(im).save(f'{out}/{name}.png', optimize=True)
    print(name, 'ok')
