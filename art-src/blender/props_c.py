"""Rope bridge, struts, card bush, grass tufts, ivy curtain. Z up, front -Y."""
exec(open('/Users/lasse/Desktop/Games/oneshot/art-src/blender/props_a.py').read().split("for fn, nm in")[0])
fa = None


def cards():
    return card_mat('foliage_a', 'foliage_a.png'), card_mat('foliage_b', 'foliage_b.png'), card_mat('tuft', 'tuft.png'), card_mat('ivy', 'ivy.png')


def bridge():
    """A 10 m rope bridge along X: sagging planks between two rope rails, posts at both ends."""
    new('bridge')
    L, W = 10.0, 1.5
    objs = []
    n = 22
    sag = 0.55
    def z(x):
        t = (x + L / 2) / L
        return -sag * 4 * t * (1 - t)
    for i in range(n):
        x = -L / 2 + (i + 0.5) * L / n
        dz = (z(x + 0.1) - z(x - 0.1)) / 0.2
        objs.append(box('plank', (L / n * 0.82, W, 0.07), loc=(x, 0, z(x)), rot=(0, -math.atan(dz), 0), m=M['planks'], uv=1.5))
    for sy in (-W / 2, W / 2):
        pts = [(-L / 2 + L * k / 12, sy, z(-L / 2 + L * k / 12) + 0.95) for k in range(13)]
        objs.append(tube('rope', pts, 0.035, 0.035, m=M['rope'], seg=5, uv=1.0))
        pts2 = [(p[0], sy, p[2] - 0.5) for p in pts]
        objs.append(tube('rope_low', pts2, 0.028, 0.028, m=M['rope'], seg=5, uv=1.0))
        for k in range(0, 13, 2):  # hanger ropes
            p = pts[k]
            objs.append(cyl('hanger', r=0.016, h=0.5, loc=(p[0], sy, p[2] - 0.5), seg=4, m=M['rope'], uv=1.0))
        for sx in (-L / 2, L / 2):
            objs.append(cyl('post', r=0.1, h=1.25, loc=(sx, sy, z(sx) - 0.1), seg=6, m=M['bark'], uv=1.5))
    return join(objs, 'bridge')


def strut():
    new('strut')
    return join([cyl('strut', r=0.17, r2=0.14, h=1.0, seg=7, m=M['bark'], uv=1.5)], 'strut')


def bush2():
    new('bush2')
    fa_, fb_, tu, iv = cards()
    rnd = random.Random(21)
    core = mat('leaf_core', tex='leaves.png', rough=0.8, tint='#5c8a3c')
    objs = [ball('core', r=0.8, loc=(0, 0, 0.55), m=core, sub=2, scale=(1.0, 1.0, 0.7), uv=2.5, flat=True, jitter=0.06, seed=3)]
    pa, pb = [], []
    for i in range(30):
        th = rnd.uniform(0, math.tau)
        ph = math.acos(1 - 1.7 * rnd.random())
        d = Vector((math.sin(ph) * math.cos(th), math.sin(ph) * math.sin(th), math.cos(ph)))
        p = Vector((0, 0, 0.5)) + Vector((d.x * 1.05, d.y * 1.05, d.z * 0.85))
        o = quad('c', p, d + Vector((0, 0, 0.2)), rnd.uniform(1.0, 1.5), rnd.uniform(1.0, 1.4), rnd.uniform(-1, 1), fa_ if i % 2 else fb_, rnd.choice(['#ffffff', '#f4ffc8', '#e4f8b0', '#fff2b8']))
        (pa if i % 2 else pb).append(o)
    objs_a, objs_b = join(pa, 'bush_a'), join(pb, 'bush_b')
    # flowers
    ms = [mat('fl_pink', color='#ff7aa8'), mat('fl_white', color='#fff3dc'), mat('fl_yellow', color='#ffd23f'), mat('fl_violet', color='#a77bff')]
    fls = []
    for i in range(9):
        th = rnd.uniform(0, math.tau)
        ph = math.acos(1 - 1.2 * rnd.random())
        fls.append(ball('bloom', r=0.09, loc=(math.sin(ph) * math.cos(th) * 1.1, math.sin(ph) * math.sin(th) * 1.1, 0.5 + math.cos(ph) * 0.9), m=rnd.choice(ms), sub=2, flat=False))
    return [join(objs, 'bush_core'), objs_a, objs_b, join(fls, 'bush_flowers')]


def tuft():
    new('tuft')
    fa_, fb_, tu, iv = cards()
    qs = []
    for k in range(3):  # three crossed vertical cards
        a = k * math.pi / 3
        qs.append(quad('t', (0, 0, 0.42), (math.cos(a), math.sin(a), 0), 1.2, 0.84, 0, tu, '#ffffff'))
    return join(qs, 'tuft')


def ivy():
    new('ivy')
    fa_, fb_, tu, iv = cards()
    qs = [quad('v', (0, 0, 1.4), (0, -1, 0), 1.9, 2.8, 0, iv, '#ffffff')]
    return join(qs, 'ivy')


o = bridge(); print('bridge', export('bridge', [o]))
o = strut(); print('strut', export('strut', [o]))
objs = bush2(); print('bush', export('bush', objs)); set_cutout('bush', ['foliage_a', 'foliage_b'])
o = tuft(); print('tuft', export('tuft', [o])); set_cutout('tuft', ['tuft'])
o = ivy(); print('ivy', export('ivy', [o])); set_cutout('ivy', ['ivy'])
