"""Procedural particle textures for assets/textures/fx (white shapes, alpha = shape; tint comes from the effect).
usage: PYTHONSAFEPATH=1 python3 art-src/make_fx_textures.py"""
import numpy as np
from PIL import Image

OUT = 'assets/textures/fx'


def grid(w, h=None):
    h = h or w
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    return (x + 0.5) / w * 2 - 1, (y + 0.5) / h * 2 - 1


def save(name, a):
    """a: float HxW alpha 0..1 -> white RGBA with that alpha (rgb also carries the shape for additive)."""
    a = np.clip(a, 0, 1)
    rgb = np.ones((*a.shape, 3), np.float32)  # pure white: the effect's colour tints it, alpha is the shape
    rgba = np.dstack([rgb, a])
    Image.fromarray((rgba * 255 + 0.5).astype(np.uint8)).save(f'{OUT}/{name}.png', optimize=True)


def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def glow(n=128):
    x, y = grid(n)
    r = np.clip(np.hypot(x, y), 0, 1)
    a = (1 - r) ** 2.2 * 0.85 + np.exp(-(r * 4.5) ** 2) * 0.5  # wide soft falloff to the quad edge, hot core
    save('glow', a * (1 - smooth(0.9, 1.0, r)))


def star4(n=128):
    x, y = grid(n)
    r = np.hypot(x, y)
    # four thin spikes (cross) + a soft core, plus faint diagonal spikes
    cross = np.maximum(np.exp(-np.abs(y) * 16) * (1 - np.abs(x)) ** 1.6, np.exp(-np.abs(x) * 16) * (1 - np.abs(y)) ** 1.6)
    core = np.exp(-(r * 5) ** 2)
    halo = np.exp(-(r * 2.4) ** 2) * 0.35
    a = np.clip(cross + core + halo, 0, 1)
    save('star4', a * (1 - smooth(0.85, 1.0, np.maximum(np.abs(x), np.abs(y)))))


def ring(n=256):
    x, y = grid(n)
    r = np.hypot(x, y)
    band = np.exp(-((r - 0.82) / 0.07) ** 2)
    inner = np.exp(-((r - 0.78) / 0.2) ** 2) * 0.25
    save('ring', (band + inner) * (1 - smooth(0.93, 1.0, r)))


def feather(w=64, h=128):
    """Chunky cartoon feather: fat leaf vane, soft quill line, tip up."""
    x, y = grid(w, h)
    t = (y + 1) / 2  # 0 tip .. 1 base
    bend = 0.12 * np.sin(t * np.pi)  # slight curve
    xc = x - bend
    half = (np.sin(np.clip(t, 0, 1) ** 0.75 * np.pi * 0.96) ** 0.7) * 0.92
    vane = smooth(half, half - 0.12, np.abs(xc)) * smooth(0.0, 0.04, t) * smooth(1.0, 0.9, t)
    quill = np.exp(-(xc / 0.05) ** 2) * smooth(0.0, 0.1, t) * smooth(1.0, 0.96, t)
    notch = 0.12 * np.sin(t * 28) * smooth(0.2, 0.8, np.abs(xc) / np.maximum(half, 0.05))  # soft vane texture
    a = vane * (0.95 - notch * 0.25)
    save('feather', np.clip(np.maximum(a, quill * 0.95), 0, 1))


def puff(n=128, seed=3):
    rng = np.random.default_rng(seed)
    x, y = grid(n)
    d = np.full((n, n), 9.0, np.float32)
    # union of round blobs -> cartoon cloud silhouette
    blobs = [(0, 0.05, 0.58)] + [(np.cos(a) * 0.42, np.sin(a) * 0.38 + 0.05, 0.34 + rng.uniform(-0.04, 0.06)) for a in np.linspace(0, 6.28, 7)[:-1]]
    for bx, by, br in blobs:
        d = np.minimum(d, (np.hypot(x - bx, y - by) - br))
    a = smooth(0.12, -0.02, d)  # soft but defined edge
    shade = 0.78 + 0.22 * smooth(-0.6, 0.5, -y)  # lighter top, slightly greyer underside
    img = np.dstack([np.repeat(shade[..., None], 3, 2), a])  # rgb: shading, alpha: silhouette
    Image.fromarray((img * 255 + 0.5).astype(np.uint8)).save(f'{OUT}/puff.png', optimize=True)


def streak(w=128, h=32):
    x, y = grid(w, h)  # long axis = x, head at +x
    along = smooth(-1.0, 0.65, x) * (1 - smooth(0.8, 1.0, x))
    width = np.exp(-(y / (0.18 + 0.5 * (1 - (x + 1) / 2) * 0.0 + 0.0)) ** 2) * (0.35 + 0.65 * smooth(-1, 1, x))
    save('streak', along * width)


def pebble(n=32):
    x, y = grid(n)
    r = np.hypot(x * 1.05, y * 0.9)
    a = smooth(0.95, 0.75, r)
    save('pebble', a)


def pillar(w=64, h=256):
    """Soft light shaft: bright core, feathered sides, fades out at both ends (the ground end a bit later)."""
    x, y = grid(w, h)
    t = (y + 1) / 2  # 0 top .. 1 bottom
    side = np.exp(-(x / 0.55) ** 2) ** 1.2
    core = np.exp(-(x / 0.18) ** 2) * 0.6
    ends = smooth(0.0, 0.35, t) * smooth(1.0, 0.8, t)
    save('pillar', (side * 0.7 + core) * ends)


for fn in (glow, star4, ring, feather, puff, streak, pebble, pillar):
    fn()
print('ok')
