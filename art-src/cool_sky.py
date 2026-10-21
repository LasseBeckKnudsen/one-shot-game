"""Shifts the warm horizon of assets/env/sky.jpg toward blue (keeps a little of the sun glow). usage: PYTHONSAFEPATH=1 python3 art-src/cool_sky.py (from art-src/ui_raw/sky_warm.jpg)"""
import numpy as np
from PIL import Image
a = np.asarray(Image.open('art-src/ui_raw/sky_warm.jpg').convert('RGB')).astype(np.float32)
H = a.shape[0]
y = np.arange(H)[:, None, None] / (H / 2)           # 0 top .. 1 horizon .. 2 bottom
w = (0.55 + 0.3 * np.clip(y, 0, 1)) * (y <= 1.0) + 0.85 * (y > 1.0)
top = np.array([70, 140, 232], np.float32)
horizon = np.array([176, 212, 247], np.float32)
t = np.clip(y, 0, 1)
blue = top * (1 - t) + horizon * t
out = a * (1 - w) + blue * w
out = np.where(y > 1.0, a * 0.55 + np.array([150, 175, 135], np.float32)[None, None] * 0.45, out)
Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save('assets/env/sky.jpg', quality=90)
