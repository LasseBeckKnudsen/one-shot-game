"""Bakes the ground's light map from scenes/main.scene.json: cast shadows of trees, huts and treehouses along the real sun
direction, soft penumbra, dappled sunlight spots where the canopy lets light through, plus the list of those spots for the
light shafts. Output: assets/textures/ground_light.png (RGBA overlay, 2048^2 over +-55 m) and art-src/dapple_spots.json.
usage: PYTHONSAFEPATH=1 python3 art-src/make_ground.py   (from the project root; rerun after gen_scene.py)"""
import json, math
import numpy as np
from PIL import Image, ImageFilter

N, HALF = 2048, 55.0
scene = json.load(open('scenes/main.scene.json'))


def walk(es):
    for e in es:
        yield e
        yield from walk(e.get('children', []))


ents = list(walk(scene['entities']))
sun = next(e for e in ents if e.get('name') == 'Sun')['LocalTransform']['rotation']
x, y, z, w = sun
# the light shines along its -Z: rotate (0,0,-1) by the quaternion
fx = -(2 * (x * z + w * y))
fy = -(2 * (y * z - w * x))
fz = -(1 - 2 * (x * x + y * y))
to_sun = np.array([-fx, -fy, -fz])
to_sun /= np.linalg.norm(to_sun)
print('to sun', to_sun)

# (height, trunk radius, canopy centre height fraction, canopy radius fraction) per tree model
TREE = {'tree_a': (17.0, 2.4, 0.62, 0.46), 'tree_b': (22.0, 2.2, 0.66, 0.30), 'tree_c': (14.0, 4.5, 0.62, 0.62)}
occ = []  # spheres/cylinders: (kind, cx, cy, cz, r, extra)
for e in ents:
    m = e.get('MeshRenderer', {}).get('mesh', '')
    t = e.get('LocalTransform', {})
    p = t.get('position', [0, 0, 0])
    s = t.get('scale', [1, 1, 1])[0]
    name = m.split('/')[-1][:-4] if m.startswith('models/') else ''
    if name in TREE:
        h, tr, cf, rf = TREE[name]
        occ.append(('cyl', p[0], 0, p[2], tr * s * 0.9, h * s * cf))
        occ.append(('sph', p[0], h * s * cf, p[2], h * s * rf * 1.0, 0))
    elif name == 'hut_meshy':
        occ.append(('box', p[0], 0, p[2], 3.3, 6.0))
    elif name == 'treehouse':
        occ.append(('box', p[0], 4.6, p[2], 3.3, 3.2))
        occ.append(('cyl', p[0], 0, p[2], 0.7, 5.0))
    elif name == 'tower':
        occ.append(('cyl', p[0], 0, p[2], 1.4, 11.0))
print(len(occ), 'occluders')

xs = np.linspace(-HALF, HALF, N, dtype=np.float32)
X, Z = np.meshgrid(xs, xs)  # rows = z, cols = x
shade = np.zeros((N, N), np.float32)  # 0 lit .. 1 in shadow
dapple = np.zeros((N, N), np.float32)
rng = np.random.default_rng(3)


def noise(scale, seed):
    r = np.random.default_rng(seed).random((N // scale + 2, N // scale + 2)).astype(np.float32)
    im = Image.fromarray((r * 255).astype(np.uint8)).resize((N, N), Image.BICUBIC)
    return np.asarray(im).astype(np.float32) / 255


leaf = noise(48, 1) * 0.65 + noise(22, 2) * 0.35  # canopy density per ground pixel (dapple pattern)
for kind, cx, cy, cz, r, ex in occ:
    # distance of each ground pixel's sun ray to the occluder
    if kind == 'sph':
        # ray from ground point P toward the sun: P + t*to_sun; closest approach to the centre
        px, pz = X - cx, Z - cz
        pc = np.stack([px, np.full_like(px, -cy), pz])  # centre -> P is -(C-P); use C-P = (-px, cy, -pz)
        cpx, cpy, cpz = -px, np.full_like(px, cy), -pz
        tproj = cpx * to_sun[0] + cpy * to_sun[1] + cpz * to_sun[2]
        qx, qy, qz = cpx - tproj * to_sun[0], cpy - tproj * to_sun[1], cpz - tproj * to_sun[2]
        d = np.sqrt(qx * qx + qy * qy + qz * qz)
        hit = np.clip((r - d) / (0.28 * r), 0, 1) * (tproj > 0)
        # leaves are not solid: sunlight pokes through where the leaf pattern is thin
        thin = np.clip((leaf - 0.46) / 0.14, 0, 1)
        shade = np.maximum(shade, hit * (1 - 0.0 * thin))
        dapple = np.maximum(dapple, hit * np.clip(0.62 - leaf, 0, 1) * 3.2)
    elif kind == 'cyl':
        # vertical cylinder from y=cy to y=cy+ex; its shadow is a streak along the sun's ground projection
        sx, sz = -to_sun[0] / to_sun[1], -to_sun[2] / to_sun[1]  # ground displacement per unit height
        best = np.zeros_like(X)
        for hh in np.linspace(cy, cy + ex, 14):
            gx, gz = cx + sx * hh, cz + sz * hh
            d = np.sqrt((X - gx) ** 2 + (Z - gz) ** 2)
            best = np.maximum(best, np.clip((r - d) / (0.35 * r + 0.2), 0, 1))
        shade = np.maximum(shade, best)
    else:  # a box standing at height cy with half-size r and height ex
        sx, sz = -to_sun[0] / to_sun[1], -to_sun[2] / to_sun[1]
        best = np.zeros_like(X)
        for hh in np.linspace(cy, cy + ex, 10):
            gx, gz = cx + sx * hh, cz + sz * hh
            d = np.maximum(np.abs(X - gx), np.abs(Z - gz))
            best = np.maximum(best, np.clip((r - d) / 0.5, 0, 1))
        shade = np.maximum(shade, best)

# soft penumbra
sh = Image.fromarray((np.clip(shade, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(7))
shade = np.asarray(sh).astype(np.float32) / 255
dp = Image.fromarray((np.clip(dapple, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(9))
dapple = np.asarray(dp).astype(np.float32) / 255
# a little large-scale variation so open ground is not flat
var = noise(160, 5) * 0.6 + noise(60, 6) * 0.4

# data map for the ground material: R = shade (cool darkening), G = sunlit warm highlight, fading to 0 at the border
shade_a = np.clip(shade * (0.80 + 0.2 * var), 0, 1)
hi_a = np.clip(dapple * 0.9 + (1 - shade) * np.clip(var - 0.45, 0, 1) * 0.35, 0, 1) * (1 - shade * 0.2)
edge = np.clip((HALF - np.maximum(np.abs(X), np.abs(Z))) / 8.0, 0, 1)
img = np.dstack([shade_a * edge * 255, hi_a * edge * 255, np.zeros_like(X), np.full_like(X, 255)]).clip(0, 255).astype(np.uint8)
Image.fromarray(img).save('assets/textures/ground_light.png', optimize=True)

# dapple spots for the light shafts: local maxima of the dapple map inside the playable disc, away from each other
spots = []
flat = dapple.copy()
flat[(np.sqrt(X ** 2 + Z ** 2) > 36) | (np.sqrt(X ** 2 + Z ** 2) < 3)] = 0
for _ in range(60):
    i = int(np.argmax(flat))
    if flat.flat[i] < 0.25 or len(spots) >= 12:
        break
    r_, c_ = divmod(i, N)
    spots.append([round(float(xs[c_]), 2), round(float(xs[r_]), 2), round(float(flat.flat[i]), 2)])
    rr = int(9 / (2 * HALF / N))
    flat[max(0, r_ - rr):r_ + rr, max(0, c_ - rr):c_ + rr] = 0
json.dump({'to_sun': [float(v) for v in to_sun], 'spots': spots}, open('art-src/dapple_spots.json', 'w'), indent=1)
print('spots', len(spots), 'shade mean', float(shade.mean()))
