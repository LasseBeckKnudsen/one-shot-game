"""Shifts the warm horizon of assets/env/sky.jpg toward blue (keeps a little of the sun glow). usage: PYTHONSAFEPATH=1 python3 art-src/cool_sky.py (from art-src/ui_raw/sky_warm.jpg)"""
import numpy as np
from PIL import Image
a = np.asarray(Image.open('art-src/ui_raw/sky_warm.jpg').convert('RGB')).astype(np.float32)
H = a.shape[0]
y = np.arange(H)[:, None, None] / (H / 2)           # 0 top .. 1 horizon .. 2 bottom
w = np.clip(y, 0, 1) ** 1.3 * 0.72 * (y <= 1.0) + 0.72 * (y > 1.0)
blue = np.array([196, 224, 250], np.float32)[None, None]
out = a * (1 - w) + blue * w
out = np.where(y > 1.0, a * 0.55 + np.array([150, 175, 135], np.float32)[None, None] * 0.45, out)
Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save('assets/env/sky.jpg', quality=90)
