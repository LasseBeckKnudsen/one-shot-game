exec(open('/Users/lasse/Desktop/Games/oneshot/art-src/blender/lib.py').read())
reset()
rnd = random.Random(7)
bark = mat('bark', tex='bark.png', rough=0.9, tint='#c4ac88')
core = mat('leaf_core', tex='leaves.png', rough=0.8, tint='#8cb35a')
fa = card_mat('foliage_a', 'foliage_a.png')
fb = card_mat('foliage_b', 'foliage_b.png')
PAL = ['#ffffff', '#f4ffc8', '#e4f8b0', '#fff2b8', '#d4f0a0', '#ffffff']

def trunk(r0=1.7, r1=0.95, h=15.0, rings=9, seg=12):
    verts, faces = [], []
    for i in range(rings + 1):
        t = i / rings
        r = r1 + (r0 - r1) * (1 - t) ** 1.6 + 0.9 * math.exp(-t * 18) + 0.06 * math.sin(i * 1.9)
        cx, cy = 0.35 * math.sin(t * 2.2), 0.25 * math.sin(t * 1.7 + 1)
        for s in range(seg):
            a = s / seg * math.tau
            k = 1 + 0.12 * math.sin(a * 5 + i)
            verts.append((cx + math.cos(a) * r * k, cy + math.sin(a) * r * k, t * h))
    for i in range(rings):
        for s in range(seg):
            a, b = i * seg + s, i * seg + (s + 1) % seg
            faces.append((a, b, b + seg, a + seg))
    faces.append(tuple([rings * seg + s for s in range(seg)][::-1]))
    return mesh_from('trunk', verts, faces, m=bark, uv=2.5, flat=False)

objs = [trunk()]
for k in range(6):
    a = k / 6 * math.tau + rnd.uniform(-.2, .2)
    objs.append(cyl('root', r=0.55, r2=0.12, h=2.6, loc=(math.cos(a) * 1.5, math.sin(a) * 1.5, 0.5), rot=(0, math.radians(80), a), m=bark, seg=7, uv=2.5))
tips = []
for k in range(5):
    a = k / 5 * math.tau + rnd.uniform(-.3, .3)
    z0 = 9 + rnd.uniform(0, 3.5)
    ln = rnd.uniform(5, 7)
    tilt = math.radians(rnd.uniform(48, 62))
    objs.append(cyl('limb', r=0.55, r2=0.22, h=ln, loc=(0.3 * math.cos(a), 0.3 * math.sin(a), z0), rot=(0, tilt, a), m=bark, seg=8, uv=2.5))
    tip = Matrix.Rotation(a, 3, 'Z') @ Vector((math.sin(tilt) * ln, 0, z0 + math.cos(tilt) * ln))
    tips.append(tip)
# canopy clumps: (centre, radii)
clumps = [(Vector((0, 0, 18.5)), (6.2, 6.2, 4.2))] + [(t + Vector((0, 0, 1.3)), (3.9, 3.9, 2.9)) for t in tips]
clumps += [(Vector((rnd.uniform(-4, 4), rnd.uniform(-4, 4), rnd.uniform(14.5, 20))), (3.2, 3.2, 2.5)) for _ in range(4)]
cores, cards_a, cards_b = [], [], []
for ci, (c, (rx, ry, rz)) in enumerate(clumps):
    cores.append(ball('core', r=1.0, loc=c, m=core, sub=2, scale=(rx * 0.5, ry * 0.5, rz * 0.45), uv=4.5, flat=True, jitter=0.06, seed=ci))
    n = 24 if ci == 0 else 13
    for i in range(n):
        # fibonacci-ish points on the upper/outer shell
        u, v = rnd.random(), rnd.random()
        th, ph = u * math.tau, math.acos(1 - 1.9 * v)  # upper hemisphere and a little below the equator
        d = Vector((math.sin(ph) * math.cos(th), math.sin(ph) * math.sin(th), math.cos(ph) * 0.9))
        p = c + Vector((d.x * rx, d.y * ry, d.z * rz)) * rnd.uniform(0.75, 1.0)
        size = rnd.uniform(3.8, 5.4) * (1.0 if ci == 0 else 0.85)
        o = quad('card', p, d + Vector((0, 0, 0.15)), size, size * rnd.uniform(0.85, 1.05), rnd.uniform(-0.8, 0.8), fa if i % 2 else fb, rnd.choice(PAL) if d.z > 0.0 else '#b8d890')
        (cards_a if i % 2 else cards_b).append(o)
bark_obj = join(objs, 'tree_bark')
core_obj = join(cores, 'tree_core')
fa_obj = join(cards_a, 'tree_cards_a')
fb_obj = join(cards_b, 'tree_cards_b')
n = export('tree_oak', [bark_obj, core_obj, fa_obj, fb_obj])
set_cutout('tree_oak', ['foliage_a', 'foliage_b'])
print('tris', n)
