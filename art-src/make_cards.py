"""Keys the magenta-background foliage sprites into alpha cards (assets/textures/<name>.png).
usage: python3 art-src/make_cards.py <raw dir>"""
import sys, numpy as np
from PIL import Image, ImageFilter
raw = sys.argv[1]
SIZE = {'foliage_a': 512, 'foliage_b': 512, 'tuft': 512, 'ivy': 512}
for name, px in SIZE.items():
    a = np.asarray(Image.open(f'{raw}/{name}.jpg').convert('RGB')).astype(np.float32)
    mag = np.minimum(a[..., 0], a[..., 2]) - a[..., 1]
    alpha = np.clip(1 - (mag - 35) / 70, 0, 1)
    # despill the magenta fringe
    spill = np.clip(mag, 0, 255) * (alpha < 1)
    a[..., 0] -= spill * 0.6
    a[..., 2] -= spill * 0.6
    # bleed colour outward so mip-mapped edges stay green
    img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    al = Image.fromarray((alpha * 255).astype(np.uint8))
    bb = al.point(lambda v: 255 if v > 40 else 0).getbbox()
    if name != 'ivy':
        img, al = img.crop(bb), al.crop(bb)
    else:  # the vine sheet fills the frame: keep the middle band
        w, h = img.size
        box = (int(w * 0.1), 0, int(w * 0.9), h)
        img, al = img.crop(box), al.crop(box)
    w, h = img.size
    s = max(w, h)
    sq = Image.new('RGB', (s, s), (60, 110, 40))
    sa = Image.new('L', (s, s), 0)
    sq.paste(img, ((s - w) // 2, (s - h) // 2))
    sa.paste(al, ((s - w) // 2, (s - h) // 2))
    out = sq.resize((px, px), Image.LANCZOS)
    out.putalpha(sa.resize((px, px), Image.LANCZOS))
    out.save(f'assets/textures/{name}.png', optimize=True)
    print(name, out.size)
