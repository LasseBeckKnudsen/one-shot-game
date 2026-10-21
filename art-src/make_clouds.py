"""Procedural puffy cumulus sprites (RGBA, sunlit top, warm gold belly) -> assets/textures/clouds/cloud_<n>.png and their
unlit blended materials assets/materials/cloud_<n>.mat.json. usage: PYTHONSAFEPATH=1 python3 art-src/make_clouds.py"""
import json, os, uuid
import numpy as np
from PIL import Image, ImageFilter

os.makedirs('assets/textures/clouds', exist_ok=True)
W, H = 768, 384
rng = np.random.default_rng(11)


def fbm(shape, seed, octaves=5):
    r = np.random.default_rng(seed)
    out = np.zeros(shape, np.float32)
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        s = 2 ** (o + 2)
        small = r.random((s * shape[0] // shape[1] + 2, s + 2)).astype(np.float32)
        im = Image.fromarray((small * 255).astype(np.uint8)).resize((shape[1], shape[0]), Image.BICUBIC)
        out += np.asarray(im).astype(np.float32) / 255 * amp
        tot += amp
        amp *= 0.5
    return out / tot


for n in range(4):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    dens = np.zeros((H, W), np.float32)
    k = rng.integers(7, 12)
    for _ in range(k):  # a row of overlapping puffs, bigger in the middle, flat bottom
        cx = rng.uniform(0.18, 0.82) * W
        r = rng.uniform(0.09, 0.2) * W * (1 - abs(cx / W - 0.5) * 0.9)
        cy = H * 0.62 - r * rng.uniform(0.1, 0.8)
        d = np.sqrt(((xx - cx) / r) ** 2 + ((yy - cy) / (r * 0.9)) ** 2)
        dens = np.maximum(dens, np.clip(1 - d, 0, 1) ** 0.7)
    dens *= np.clip((H * 0.74 - yy) / (H * 0.08), 0, 1)  # flat base
    dens *= 0.75 + 0.5 * fbm((H, W), 40 + n)
    a = np.clip((dens - 0.28) / 0.35, 0, 1)
    a = np.asarray(Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(5))).astype(np.float32) / 255
    # light from the upper right: lit tops, golden belly
    lit = np.clip((H * 0.75 - yy) / (H * 0.5), 0, 1) * 0.7 + np.clip((xx / W - 0.3), 0, 1) * 0.3
    top, belly = np.array([255, 253, 248], np.float32), np.array([255, 205, 150], np.float32)
    rgb = belly[None, None] * (1 - lit[..., None]) + top[None, None] * lit[..., None]
    img = np.dstack([rgb, a * 235]).clip(0, 255).astype(np.uint8)
    Image.fromarray(img).save(f'assets/textures/clouds/cloud_{n}.png', optimize=True)
    open(f'assets/materials/cloud_{n}.mat.json', 'w').write(json.dumps({'baseColorMap': f'textures/clouds/cloud_{n}.png', 'baseColor': [1, 1, 1, 1], 'shading': 'unlit', 'alphaMode': 'blend', 'doubleSided': True}) + '\n')
    gm = f'assets/textures/clouds/cloud_{n}.png.gmeta'
    open(gm, 'w').write(f'guid = "{uuid.uuid4()}"\nimporter = "texture"\n\n[settings]\nkind = "texture"\nsrgb = true\nmipmaps = true\n')
    gm = f'assets/materials/cloud_{n}.mat.json.gmeta'
    if not os.path.exists(gm):
        open(gm, 'w').write(f'guid = "{uuid.uuid4()}"\nimporter = "material"\n')
print('clouds ok')
