"""Create Art clear-sky painting -> seamless 2:1 equirect panorama (assets/env/sky.jpg). The left/right wrap is cross-faded.
usage: PYTHONSAFEPATH=1 python3 art-src/make_sky.py <sky.jpg> [sun_roll_fraction]"""
import sys
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance

src = Image.open(sys.argv[1]).convert('RGB')
roll = float(sys.argv[2]) if len(sys.argv) > 2 else 0.0
w, h = src.size
src = src.crop((0, 0, int(w * 0.945), h))  # the generated image carries a seam strip on its right edge
W, H = 4096, 2048
horizon = int(src.height * 0.86)
top = src.crop((0, 0, src.width, horizon)).resize((W, H // 2), Image.LANCZOS)
a = np.asarray(top).astype(np.float32)
# seamless in x: blend the image with a half-turn rolled copy, weighted so both edges come from the rolled one
t = np.abs(np.linspace(-1, 1, W))
wgt = (1 - t) ** 1.2
m = np.minimum.outer(np.ones(H // 2), wgt)[..., None]
b = np.roll(a, W // 2, axis=1)
a = a * m + b * (1 - m)
a = np.roll(a, int(roll * W), axis=1)
last = a[-6:].mean(axis=0)
g = np.linspace(0, 1, H // 2)[:, None, None]
ground = last[None] * (1 - g * 0.5) + np.array([160, 170, 130], np.float32)[None, None] * (g * 0.5)
out = np.concatenate([a, ground], axis=0)
img = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
img = ImageEnhance.Color(img).enhance(1.12)
img.save('assets/env/sky.jpg', quality=90)
print(img.size)
