"""Chroma-keys the magenta-background Create Art icons into 256px RGBA sprites. usage: python3 art-src/make_icons.py <raw dir>"""
import sys, numpy as np
from PIL import Image
raw = sys.argv[1]
for name, out in (('acorn', 'acorn'), ('clock', 'clock'), ('pebble', 'pebble')):
    im = Image.open(f'{raw}/{name}.jpg').convert('RGB')
    a = np.asarray(im).astype(np.float32)
    # distance from magenta in the (r, b high, g low) sense
    mag = np.minimum(a[..., 0], a[..., 2]) - a[..., 1]
    alpha = np.clip(1 - (mag - 40) / 90, 0, 1)
    # despill: pull magenta out of edge pixels
    spill = np.clip(mag, 0, 255) * (alpha < 1)
    a[..., 0] -= spill * 0.5
    a[..., 2] -= spill * 0.5
    rgba = np.dstack([np.clip(a, 0, 255), alpha * 255]).astype(np.uint8)
    img = Image.fromarray(rgba, 'RGBA')
    bb = img.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox()
    img = img.crop(bb)
    s = max(img.size)
    sq = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    sq.paste(img, ((s - img.width) // 2, (s - img.height) // 2))
    sq.resize((256, 256), Image.LANCZOS).save(f'assets/ui/sprites/{out}.png', optimize=True)
    print(out, bb)
