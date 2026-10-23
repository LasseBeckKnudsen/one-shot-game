"""The frozen-screen frame (assets/ui/frost_edge.png): ice-blue shards crowding in from every screen edge, clear in the middle (a missed shot freezes the player).
Drawn over the whole HUD stretched to the screen, so it is wide and low-res on purpose. usage: PYTHONSAFEPATH=1 python3 art-src/make_frost.py (from the project root)"""
import numpy as np
from PIL import Image, ImageFilter

W, H = 768, 432
rng = np.random.default_rng(5)
x = np.linspace(-1, 1, W, dtype=np.float32)[None, :].repeat(H, 0)
y = np.linspace(-1, 1, H, dtype=np.float32)[:, None].repeat(W, 1)

# shards: Voronoi cells, brighter along their borders
G = 16
pts = rng.uniform(-1.1, 1.1, (G * G, 2)).astype(np.float32)
d = np.stack([np.hypot((x - px) * 1.0, (y - py) * 0.62) for px, py in pts])
order = np.argsort(d, 0)
d1 = np.take_along_axis(d, order[:1], 0)[0]
d2 = np.take_along_axis(d, order[1:2], 0)[0]
cell = order[0]
border = np.clip(1 - (d2 - d1) / 0.035, 0, 1)
shade = (rng.uniform(0.0, 1.0, G * G).astype(np.float32))[cell]

# how far in from the edge it reaches: a thin wobbly frame hugging the screen edge, a little thicker in the corners (the middle 90 percent stays clear)
r = (np.abs(x) ** 2.4 + np.abs(y * 1.12) ** 2.4) ** (1 / 2.4)
wob = (shade - 0.5) * 0.12
cover = np.clip((r + wob - 0.9) / 0.18, 0, 1)
cover = cover * cover * (3 - 2 * cover)

alpha = np.clip(cover * (0.62 + 0.3 * shade) + border * cover * 0.45, 0, 1)
base = np.array([0.28, 0.66, 1.0], np.float32)
white = np.array([0.93, 0.99, 1.0], np.float32)
t = np.clip(0.25 + 0.5 * shade + 0.6 * border, 0, 1)[..., None]
rgb = base * (1 - t) + white * t
img = np.concatenate([rgb, alpha[..., None]], -1)
im = Image.fromarray((img * 255).astype(np.uint8), 'RGBA').filter(ImageFilter.GaussianBlur(0.8))
im.save('assets/ui/frost_edge.png')
print('wrote assets/ui/frost_edge.png', im.size)
