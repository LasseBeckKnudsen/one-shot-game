"""Keys the magenta-background logo (art-src/ui_raw/logo.jpg, Create Art) into assets/ui/logo.png. usage: python3 art-src/ui_logo.py"""
import numpy as np
from PIL import Image
im = Image.open('art-src/ui_raw/logo.jpg').convert('RGB')
a = np.asarray(im).astype(np.float32)
mag = np.minimum(a[..., 0], a[..., 2]) - a[..., 1]          # how magenta a pixel is
alpha = np.clip(1 - (mag - 35) / 95, 0, 1)
# despill: remove the magenta cast from semi-transparent edge pixels
spill = np.clip(mag, 0, 255) * (alpha < 1)
a[..., 0] -= spill * 0.55
a[..., 2] -= spill * 0.55
rgba = np.dstack([np.clip(a, 0, 255), alpha * 255]).astype(np.uint8)
img = Image.fromarray(rgba, 'RGBA')
bb = img.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()
pad = 24
img = img.crop((bb[0] - pad, bb[1] - pad, bb[2] + pad, bb[3] + pad))
w = 1100
img = img.resize((w, round(img.height * w / img.width)), Image.LANCZOS)
img.save('assets/ui/logo.png', optimize=True)
print('logo', img.size)
