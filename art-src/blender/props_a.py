"""Huts, decks, crates, lanterns, banners. Blender Z up, front of every asset faces -Y (glTF +Z)."""
exec(open('/Users/lasse/Desktop/Games/oneshot/art-src/blender/lib.py').read())

PI = math.pi
M = {}


def materials():
    M['planks'] = mat('planks', tex='planks.png', rough=0.8)
    M['wood_dark'] = mat('wood_dark', tex='planks.png', rough=0.85, tint='#9a6a48')
    M['bark'] = mat('bark', tex='bark.png', rough=0.9)
    M['thatch'] = mat('thatch', tex='thatch.png', rough=0.95)
    M['leaves'] = mat('leaves', tex='leaves.png', rough=0.7)
    M['rope'] = mat('rope', color='#d9b46c', rough=0.95)
    M['glow'] = mat('glow', color='#ffc266', emit='#ff9d2e', emit_strength=2.6, rough=0.4)
    M['iron'] = mat('iron', color='#3a3633', rough=0.5)
    M['green'] = mat('banner_green', color='#4d8a45', rough=0.9)
    M['cream'] = mat('cream', color='#f3e6c4', rough=0.9)
    M['dirt'] = mat('pot', color='#a85d3a', rough=0.9)


def new(name):
    reset()
    materials()
    return name


def rail_run(x0, y0, x1, y1, z=0.35, h=1.05, post_every=1.5):
    """A railing between two points: posts, top & mid rail, rope loops."""
    objs = []
    d = Vector((x1 - x0, y1 - y0, 0))
    L = d.length
    ang = math.atan2(d.y, d.x)
    n = max(1, round(L / post_every))
    for i in range(n + 1):
        t = i / n
        p = Vector((x0, y0, 0)) + d * t
        objs.append(cyl('post', r=0.11, h=h, loc=(p.x, p.y, z), seg=7, m=M['bark'], uv=1.5))
        objs.append(cyl('post_cap', r=0.14, h=0.07, loc=(p.x, p.y, z + h), seg=7, m=M['wood_dark'], uv=1.5))
        objs.append(torus('rope_loop', R=0.12, r=0.028, loc=(p.x, p.y, z + h * 0.62), m=M['rope'], seg=10, rseg=4))
    mid = Vector((x0, y0, 0)) + d * 0.5
    objs.append(box('rail_top', (L, 0.1, 0.09), loc=(mid.x, mid.y, z + h - 0.05), rot=(0, 0, ang), m=M['wood_dark'], uv=1.5))
    objs.append(box('rail_mid', (L, 0.07, 0.07), loc=(mid.x, mid.y, z + h * 0.45), rot=(0, 0, ang), m=M['wood_dark'], uv=1.5))
    # sagging rope between two posts' loops
    return objs


def deck():
    new('deck')
    S, T, Z = 6.0, 0.35, 0.0
    objs = [box('slab', (S, S, T), loc=(0, 0, 0), m=M['planks'], uv=3.0)]
    # beams under the slab
    for x in (-2.4, 0, 2.4):
        objs.append(box('beam', (0.25, S + 0.4, 0.22), loc=(x, 0, -0.1), m=M['bark'], uv=1.5))
    h = S / 2 - 0.1
    objs += rail_run(-h, h, h, h, z=T)  # back (+Y)
    objs += rail_run(-h, -h, -h, h, z=T)
    objs += rail_run(h, -h, h, h, z=T)
    objs += rail_run(-h, -h, -1.0, -h, z=T)  # front left & right, open middle for steps
    objs += rail_run(1.0, -h, h, -h, z=T)
    for i in range(2):  # steps in front (-Y)
        objs.append(box('step', (2.0, 0.55, 0.18 * (2 - i)), loc=(0, -S / 2 - 0.2 - 0.5 * i, 0), m=M['planks'], uv=3.0))
    o = join(objs, 'deck')
    return o


def hut():
    new('hut')
    objs = []
    walls = cyl('walls', r=2.1, h=2.7, seg=8, m=M['planks'], uv=3.0, flat=True)
    objs.append(walls)
    objs.append(cyl('base_ring', r=2.25, h=0.28, seg=8, m=M['bark'], uv=2.0, flat=True))
    for k in range(8):  # timber posts at the corners
        a = (k + 0.5) / 8 * math.tau
        objs.append(cyl('timber', r=0.13, h=2.75, loc=(math.cos(a) * 2.2, math.sin(a) * 2.2, 0), seg=6, m=M['wood_dark'], uv=1.5, flat=True))
    objs.append(cyl('beam_ring', r=2.28, h=0.22, loc=(0, 0, 2.55), seg=8, m=M['wood_dark'], uv=1.5, flat=True))
    roof = cyl('roof', r=3.45, r2=0.22, h=3.0, loc=(0, 0, 2.65), seg=8, m=M['thatch'], uv=2.6, flat=True)
    objs.append(roof)
    objs.append(cyl('eave', r=3.5, h=0.12, loc=(0, 0, 2.6), seg=8, m=M['thatch'], uv=2.6, flat=True))
    objs.append(cyl('finial', r=0.07, r2=0.04, h=0.7, loc=(0, 0, 5.55), seg=6, m=M['wood_dark'], uv=1.0))
    objs.append(ball('finial_ball', r=0.14, loc=(0, 0, 6.25), m=M['rope'], sub=1))
    # front (-Y): door and round window
    objs.append(box('door', (1.0, 0.16, 1.75), loc=(0, -2.02, 0.28), m=M['wood_dark'], uv=1.5))
    objs.append(cyl('door_arch', r=0.5, h=0.16, loc=(0, -2.02, 2.03), rot=(PI / 2, 0, 0), seg=10, m=M['wood_dark'], uv=1.5, flat=True))
    objs.append(ball('knob', r=0.06, loc=(0.32, -2.14, 1.1), m=M['glow'], sub=1))
    for sx in (-1.25, 1.25):
        objs.append(torus('win_frame', R=0.42, r=0.07, loc=(sx, -2.02, 1.7), rot=(PI / 2, 0, 0), m=M['wood_dark'], seg=14, rseg=5))
        objs.append(cyl('win_glow', r=0.4, h=0.05, loc=(sx, -2.0, 1.7), rot=(PI / 2, 0, 0), seg=14, m=M['glow'], uv=1.0))
        objs.append(box('win_cross_h', (0.84, 0.05, 0.05), loc=(sx, -2.07, 1.7), m=M['wood_dark'], uv=1.0, bottom=False))
        objs.append(box('win_cross_v', (0.05, 0.05, 0.84), loc=(sx, -2.07, 1.7), m=M['wood_dark'], uv=1.0, bottom=False))
    # flower boxes
    rnd = random.Random(3)
    fl = [mat('fl_pink', color='#ff7aa8'), mat('fl_white', color='#fff3dc'), mat('fl_yellow', color='#ffd23f'), mat('fl_violet', color='#a77bff')]
    for sx in (-1.25, 1.25):
        objs.append(box('flowerbox', (1.1, 0.3, 0.28), loc=(sx, -2.2, 0.95), m=M['wood_dark'], uv=1.5))
        objs.append(ball('box_leaf', r=0.34, loc=(sx, -2.2, 1.3), m=M['leaves'], sub=1, scale=(1.5, 0.9, 0.6), uv=3.0))
        for i in range(6):
            objs.append(ball('bloom', r=0.1, loc=(sx - 0.45 + i * 0.18, -2.25 + rnd.uniform(-.06, .06), 1.4 + rnd.uniform(0, .08)), m=fl[(i + int(sx)) % 4], sub=2, flat=False))
    # hanging banner
    objs.append(box('banner_rod', (0.9, 0.05, 0.05), loc=(0, -2.3, 2.45), m=M['wood_dark'], uv=1.0, bottom=False))
    objs.append(box('banner', (0.7, 0.04, 1.0), loc=(0, -2.3, 1.43), m=M['green'], uv=1.0))
    objs.append(ball('banner_leaf', r=0.2, loc=(0, -2.34, 1.95), m=M['cream'], sub=1, scale=(0.8, 0.15, 1.2)))
    return join(objs, 'hut')


def crate():
    new('crate')
    objs = [box('crate_body', (1.2, 1.2, 1.1), m=M['planks'], uv=1.2)]
    for dx in (-0.55, 0.55):
        for dy in (-0.55, 0.55):
            objs.append(box('crate_post', (0.12, 0.12, 1.14), loc=(dx, dy, 0), m=M['wood_dark'], uv=1.0))
    for z in (0.02, 1.0):
        objs.append(box('crate_band_x', (1.24, 0.1, 0.1), loc=(0, -0.58, z), m=M['wood_dark'], uv=1.0))
        objs.append(box('crate_band_y', (0.1, 1.24, 0.1), loc=(0.58, 0, z), m=M['wood_dark'], uv=1.0))
        objs.append(box('crate_band_x2', (1.24, 0.1, 0.1), loc=(0, 0.58, z), m=M['wood_dark'], uv=1.0))
        objs.append(box('crate_band_y2', (0.1, 1.24, 0.1), loc=(-0.58, 0, z), m=M['wood_dark'], uv=1.0))
    objs.append(ball('crate_leaf', r=0.34, loc=(0, -0.61, 0.55), m=M['leaves'], sub=1, scale=(0.9, 0.08, 1.2)))
    return join(objs, 'crate')


def lantern_post():
    new('lantern_post')
    objs = [cyl('pole', r=0.1, r2=0.075, h=2.6, seg=7, m=M['iron'], uv=1.0),
            cyl('pole_base', r=0.2, h=0.25, seg=7, m=M['iron'], uv=1.0)]
    objs.append(cyl('arm', r=0.05, h=0.8, loc=(0, 0, 2.5), rot=(0, PI / 2, 0), seg=6, m=M['iron'], uv=1.0))
    objs.append(torus('curl', R=0.18, r=0.03, loc=(0.35, 0, 2.35), rot=(PI / 2, 0, 0), m=M['iron'], seg=10, rseg=4))
    objs.append(cyl('lamp_frame', r=0.13, r2=0.11, h=0.5, loc=(0.78, 0, 2.0), seg=6, m=M['iron'], uv=1.0, flat=True))
    objs.append(cyl('lamp_glow', r=0.2, r2=0.17, h=0.4, loc=(0.78, 0, 2.05), seg=6, m=M['glow'], uv=1.0, flat=True))
    objs.append(cyl('lamp_cap', r=0.24, r2=0.03, h=0.18, loc=(0.78, 0, 2.5), seg=6, m=M['iron'], uv=1.0, flat=True))
    return join(objs, 'lantern_post')


def banner_post():
    new('banner_post')
    objs = [cyl('pole', r=0.09, h=3.4, seg=7, m=M['bark'], uv=1.5),
            box('crossbar', (1.2, 0.07, 0.07), loc=(0.55, 0, 3.15), m=M['wood_dark'], uv=1.0),
            box('cloth', (0.9, 0.04, 1.7), loc=(0.55, 0, 1.45), m=M['green'], uv=1.0),
            ball('leaf_emblem', r=0.28, loc=(0.55, -0.03, 2.2), m=M['cream'], sub=1, scale=(0.8, 0.12, 1.2)),
            ball('top', r=0.12, loc=(0, 0, 3.45), m=M['glow'], sub=1)]
    for i in range(3):
        objs.append(cyl('tail', r=0.1, r2=0.001, h=0.3, loc=(0.2 + i * 0.35, 0, 1.15), rot=(PI, 0, 0), seg=4, m=M['green'], uv=1.0, flat=True))
    return join(objs, 'banner_post')


for fn, nm in ((deck, 'deck'), (hut, 'hut'), (crate, 'crate'), (lantern_post, 'lantern_post'), (banner_post, 'banner_post')):
    o = fn()
    print(nm, export(nm, [o]))
