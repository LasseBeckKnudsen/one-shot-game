"""Planters, bushes, rocks, barrels, watchtower, log pillars, flower patches, vines. Z up, front -Y."""
exec(open('/Users/lasse/Desktop/Games/oneshot/art-src/blender/props_a.py').read().split("for fn, nm in")[0])

FL = {}


def flowers():
    FL['pink'] = mat('fl_pink', color='#ff7aa8')
    FL['white'] = mat('fl_white', color='#fff3dc')
    FL['yellow'] = mat('fl_yellow', color='#ffd23f')
    FL['violet'] = mat('fl_violet', color='#a77bff')
    FL['orange'] = mat('fl_orange', color='#ff9a3c')
    return list(FL.values())


def flower_cluster(cx, cy, cz, radius, n, seed, size=0.11):
    rnd = random.Random(seed)
    ms = flowers()
    out = []
    for i in range(n):
        a = rnd.uniform(0, math.tau)
        r = radius * math.sqrt(rnd.random())
        out.append(ball('bloom', r=size * rnd.uniform(0.8, 1.3), loc=(cx + math.cos(a) * r, cy + math.sin(a) * r, cz + rnd.uniform(0, radius * 0.5)),
                        m=rnd.choice(ms), sub=2, flat=False))
    return out


def planter_hanging():
    new('planter_hanging')
    objs = [ball('bowl', r=0.42, loc=(0, 0, 0.45), m=M['dirt'], sub=2, scale=(1, 1, 0.55), flat=False),
            ball('moss', r=0.46, loc=(0, 0, 0.6), m=M['leaves'], sub=2, scale=(1, 1, 0.5), uv=2.0)]
    objs += flower_cluster(0, 0, 0.62, 0.38, 14, 5, 0.12)
    for k in range(3):
        a = k / 3 * math.tau
        objs.append(cyl('chain', r=0.012, h=1.1, loc=(math.cos(a) * 0.3, math.sin(a) * 0.3, 0.55), rot=(math.sin(a) * -0.2, math.cos(a) * 0.2, 0), seg=4, m=M['rope'], uv=1.0))
    return join(objs, 'planter_hanging')


def planter_box():
    new('planter_box')
    objs = [box('box', (1.6, 0.55, 0.5), m=M['planks'], uv=1.5),
            box('rim', (1.7, 0.62, 0.08), loc=(0, 0, 0.46), m=M['wood_dark'], uv=1.0),
            ball('foliage', r=0.6, loc=(0, 0, 0.62), m=M['leaves'], sub=2, scale=(1.2, 0.5, 0.45), uv=2.0)]
    objs += flower_cluster(0, 0, 0.65, 0.7, 22, 11, 0.12)
    return join(objs, 'planter_box')


def bush():
    new('bush')
    rnd = random.Random(21)
    objs = []
    for i in range(5):
        a = i / 5 * math.tau
        objs.append(ball('b', r=rnd.uniform(0.6, 0.85), loc=(math.cos(a) * 0.6, math.sin(a) * 0.6, 0.5), m=M['leaves'], sub=2, scale=(1, 1, 0.8), uv=2.5, jitter=0.08, seed=i))
    objs.append(ball('b', r=0.9, loc=(0, 0, 0.75), m=M['leaves'], sub=2, scale=(1, 1, 0.8), uv=2.5, jitter=0.08, seed=9))
    objs += flower_cluster(0, 0, 1.1, 1.0, 12, 4, 0.1)
    return join(objs, 'bush')


def rock():
    new('rock')
    st = mat('rock', color='#b9ab94', rough=0.95)
    st2 = mat('rock_moss', tex='stone.png', rough=0.95, tint='#d7d0bd')
    objs = [ball('r1', r=0.9, loc=(0, 0, 0.35), m=st2, sub=2, scale=(1.2, 1, 0.7), uv=2.0, jitter=0.18, seed=3),
            ball('r2', r=0.5, loc=(0.9, 0.3, 0.2), m=st2, sub=1, scale=(1, 1, 0.7), uv=2.0, jitter=0.2, seed=4),
            ball('moss', r=0.7, loc=(0, 0, 0.62), m=M['leaves'], sub=2, scale=(1.05, 0.85, 0.28), uv=3.0, jitter=0.1, seed=6)]
    return join(objs, 'rock')


def barrel():
    new('barrel')
    objs = [cyl('barrel', r=0.5, r2=0.5, h=1.0, seg=12, m=M['planks'], uv=1.2),
            cyl('belly', r=0.56, r2=0.56, h=0.62, loc=(0, 0, 0.19), seg=12, m=M['planks'], uv=1.2, cap=False)]
    for z in (0.1, 0.4, 0.78):
        objs.append(cyl('hoop', r=0.585 if z == 0.4 else 0.53, h=0.07, loc=(0, 0, z), seg=12, m=M['iron'], uv=1.0))
    objs.append(cyl('lid', r=0.46, h=0.04, loc=(0, 0, 1.0), seg=12, m=M['wood_dark'], uv=1.0))
    return join(objs, 'barrel')


def log_pillar():
    new('log_pillar')
    objs = [cyl('log', r=0.3, h=1.4, seg=9, m=M['bark'], uv=1.5)]
    objs.append(cyl('rope_band', r=0.33, h=0.14, loc=(0, 0, 1.05), seg=9, m=M['rope'], uv=1.0))
    objs.append(cyl('cap', r=0.31, h=0.03, loc=(0, 0, 1.4), seg=9, m=mat('log_cut', color='#e6c48c'), uv=1.0))
    return join(objs, 'log_pillar')


def stump_seat():
    new('stump')
    return join([cyl('stump', r=0.55, r2=0.45, h=0.6, seg=10, m=M['bark'], uv=1.5), cyl('cut', r=0.45, h=0.03, loc=(0, 0, 0.6), seg=10, m=mat('log_cut', color='#e6c48c'), uv=1.0)], 'stump')


def tower():
    new('tower')
    objs = [cyl('trunk', r=1.25, r2=0.95, h=7.5, seg=10, m=M['bark'], uv=2.5)]
    for k in range(5):
        a = k / 5 * math.tau
        objs.append(cyl('root', r=0.4, r2=0.1, h=1.8, loc=(math.cos(a) * 1.0, math.sin(a) * 1.0, 0.3), rot=(0, math.radians(75), a), seg=6, m=M['bark'], uv=2.5))
    z = 7.4
    objs.append(cyl('floor', r=2.6, h=0.35, loc=(0, 0, z), seg=8, m=M['planks'], uv=3.0, flat=True))
    objs.append(cyl('floor_rim', r=2.72, h=0.18, loc=(0, 0, z - 0.1), seg=8, m=M['wood_dark'], uv=2.0, flat=True))
    for k in range(8):
        a = (k + 0.5) / 8 * math.tau
        x, y = math.cos(a) * 2.45, math.sin(a) * 2.45
        objs.append(cyl('post', r=0.1, h=2.4, loc=(x, y, z + 0.3), seg=6, m=M['wood_dark'], uv=1.5, flat=True))
    objs.append(cyl('rail', r=2.5, h=0.1, loc=(0, 0, z + 1.3), seg=8, m=M['wood_dark'], uv=2.0, flat=True, cap=False))
    objs.append(cyl('rail_mid', r=2.5, h=0.07, loc=(0, 0, z + 0.85), seg=8, m=M['wood_dark'], uv=2.0, flat=True, cap=False))
    objs.append(cyl('roof', r=3.4, r2=0.2, h=2.8, loc=(0, 0, z + 2.7), seg=8, m=M['thatch'], uv=2.6, flat=True))
    objs.append(cyl('mast', r=0.05, h=1.6, loc=(0, 0, z + 5.4), seg=5, m=M['wood_dark'], uv=1.0))
    objs.append(mesh_from('flag', [(0, 0, 0), (1.1, 0, -0.2), (0, 0, -0.55)], [(0, 1, 2), (0, 2, 1)], m=M['green'], uv=1.0, loc=(0.02, 0, z + 6.95)))
    objs.append(box('ladder_l', (0.07, 0.07, 7.5), loc=(-0.4, -1.3, 0), rot=(0.17, 0, 0), m=M['wood_dark'], uv=1.0))
    objs.append(box('ladder_r', (0.07, 0.07, 7.5), loc=(0.4, -1.3, 0), rot=(0.17, 0, 0), m=M['wood_dark'], uv=1.0))
    for i in range(12):
        objs.append(box('rung', (0.8, 0.06, 0.06), loc=(0, -1.22 - i * 0.0, 0.5 + i * 0.58), m=M['wood_dark'], uv=1.0))
    return join(objs, 'tower')


def flower_patch():
    new('flower_patch')
    objs = [ball('tuft', r=0.4, loc=(0, 0, 0.1), m=M['leaves'], sub=1, scale=(1.2, 1.2, 0.5), uv=2.0)]
    objs += flower_cluster(0, 0, 0.18, 0.45, 8, 13, 0.1)
    return join(objs, 'flower_patch')


def vine():
    new('vine')
    vm = mat('vine', color='#4f9b3c', rough=0.8)
    objs = [cyl('stem', r=0.04, r2=0.02, h=3.0, seg=5, m=vm, uv=1.0)]
    rnd = random.Random(8)
    for i in range(9):
        z = 0.2 + i * 0.3
        a = i * 2.4
        objs.append(ball('lf', r=0.17, loc=(math.cos(a) * 0.12, math.sin(a) * 0.12, z), m=M['leaves'], sub=1, scale=(1, 0.3, 1.2), uv=2.0, rot=(0, 0, a)))
    return join(objs, 'vine')


def mushroom():
    new('mushroom')
    cap = mat('cap_red', color='#e8453c', rough=0.6)
    stem = mat('stem_cream', color='#f3e6c4')
    dot = mat('dot_white', color='#ffffff')
    objs = [cyl('stem', r=0.16, r2=0.12, h=0.4, seg=8, m=stem, uv=1.0), ball('cap', r=0.4, loc=(0, 0, 0.42), m=cap, sub=2, scale=(1, 1, 0.65))]
    for i in range(5):
        a = i * 1.25
        objs.append(ball('dot', r=0.06, loc=(math.cos(a) * 0.25, math.sin(a) * 0.25, 0.62), m=dot, sub=1, scale=(1, 1, 0.4)))
    return join(objs, 'mushroom')


for fn, nm in ((planter_hanging, 'planter_hanging'), (planter_box, 'planter_box'), (bush, 'bush'), (rock, 'rock'), (barrel, 'barrel'),
               (log_pillar, 'log_pillar'), (stump_seat, 'stump'), (tower, 'tower'), (flower_patch, 'flower_patch'), (mushroom, 'mushroom')):
    o = fn()
    print(nm, export(nm, [o]))
