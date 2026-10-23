"""Procedural, truly tileable cobblestone albedo (assets/textures/stone.png): jittered Voronoi stones with rounded bevels, warm grey-brown
palette per stone and dark mortar. The earlier painted texture was made tileable by cross-fading an offset copy, which left every stone doubled
as a translucent ghost. usage: PYTHONSAFEPATH=1 python3 art-src/make_cobble.py   (from the project root)"""
import numpy as np
from PIL import Image

N, G = 1024, 9          # texture size, stones per side
rng = np.random.default_rng(11)

# jittered grid of stone centres on a torus
gx, gy = np.meshgrid(np.arange(G), np.arange(G))
pts = np.stack([(gx + 0.5 + rng.uniform(-0.36, 0.36, gx.shape)) / G, (gy + 0.5 + rng.uniform(-0.36, 0.36, gy.shape)) / G], -1).reshape(-1, 2)
ids = np.arange(len(pts))
u = (np.arange(N) + 0.5) / N
X, Y = np.meshgrid(u, u)
d1 = np.full((N, N), 9.0, np.float32)
d2 = np.full((N, N), 9.0, np.float32)
who = np.zeros((N, N), np.int32)
for i, (px, py) in enumerate(pts):
    best = np.full((N, N), 9.0, np.float32)
    for ox in (-1, 0, 1):
        for oy in (-1, 0, 1):
            d = np.hypot(X - (px + ox), Y - (py + oy)).astype(np.float32)
            best = np.minimum(best, d)
    closer = best < d1
    d2 = np.where(closer, d1, np.minimum(d2, best))
    who = np.where(closer, i, who)
    d1 = np.where(closer, best, d1)
edge = (d2 - d1) * G                     # 0 on the border between two stones, ~0.3..1 inside
# round the stones' corners: blur the edge map (wrapped, so the tile still tiles)
from PIL import ImageFilter
pad = 48
e8 = np.pad(np.clip(edge / 1.2, 0, 1), pad, mode='wrap')
e8 = np.asarray(Image.fromarray((e8 * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(5))).astype(np.float32) / 255
edge = e8[pad:-pad, pad:-pad] * 1.2
height = np.clip(edge / 0.42, 0, 1)
height = height * height * (3 - 2 * height)   # rounded dome
mortar = np.clip((0.12 - edge) / 0.05, 0, 1)   # 1 in the gap

def periodic_noise(scale, seed):
    r = np.random.default_rng(seed).random((scale, scale)).astype(np.float32)
    big = np.kron(r, np.ones((N // scale, N // scale), np.float32))
    from PIL import ImageFilter
    im = Image.fromarray((big * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(N / scale * 0.6))
    return np.asarray(im).astype(np.float32) / 255

palette = np.array([[150, 136, 116], [164, 146, 120], [122, 116, 106], [174, 154, 126], [138, 120, 100], [132, 126, 116]], np.float32)
col = palette[rng.integers(0, len(palette), len(pts))] * rng.uniform(0.9, 1.1, (len(pts), 1))
stone = col[who]
n = 0.75 * periodic_noise(32, 1) + 0.25 * periodic_noise(128, 2)
stone = stone * (0.82 + 0.36 * n[..., None]) * (0.78 + 0.28 * height[..., None])
# light from the top left on the dome
gy_, gx_ = np.gradient(height)
shade = np.clip(1.0 + 3.0 * (-gx_ - gy_), 0.7, 1.3)
stone = stone * shade[..., None]
mort = np.array([62, 52, 42], np.float32) * (0.8 + 0.4 * periodic_noise(64, 3))[..., None]
out = stone * (1 - mortar[..., None]) + mort * mortar[..., None]
Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save('assets/textures/stone.png', optimize=True)
print('stone.png', N)
