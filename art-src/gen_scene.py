"""Lays out the Treetop Town proof-of-concept clearing -> scenes/main.scene.json.
usage: python3 art-src/gen_scene.py   (from the project root)
Entities are grouped under named parents; the layout is seeded so reruns are stable."""
import json, math, random

rnd = random.Random(11)
tint_rnd = random.Random(5)  # separate stream so tints never move the layout
PI = math.pi


def yaw_q(yaw, pitch=0.0):
    sy, cy, sx, cx = math.sin(yaw / 2), math.cos(yaw / 2), math.sin(pitch / 2), math.cos(pitch / 2)
    return [round(v, 5) for v in (cy * sx, sy * cx, -sy * sx, cy * cx)]



def align_y(v):
    """Quaternion taking +Y to direction v."""
    L = math.sqrt(sum(c * c for c in v))
    x, y, z = (c / L for c in v)
    ax, az = z, -x  # Y x v = (z, 0, -x)
    sn = math.hypot(ax, az)
    if sn < 1e-6:
        return [0, 0, 0, 1]
    ang = math.acos(max(-1, min(1, y)))
    k = math.sin(ang / 2) / sn
    return [round(ax * k, 5), 0, round(az * k, 5), round(math.cos(ang / 2), 5)]

_ids = {}


def eid(base):
    _ids[base] = _ids.get(base, 0) + 1
    return f'{base}{_ids[base]}'


def prop(name, mesh, x, z, y=0.0, yaw=0.0, s=1.0, shadows=True, solid=None, extra=None):
    e = {
        'name': name, 'id': eid(name.lower()),
        'LocalTransform': {'position': [round(x, 3), y, round(z, 3)], 'rotation': yaw_q(yaw), 'scale': [s, s, s]},
        'MeshRenderer': {'mesh': f'models/{mesh}.glb'},
    }
    if mesh == 'bush':  # cooler, varied greens so the bushes stop reading as one yellow block
        e['MeshRenderer']['color'] = tint_rnd.choice(['#9fd08a', '#b4dc9a', '#8cc8a0', '#a8d89a'])
    if not shadows:
        e['MeshRenderer']['castShadows'] = False
    if solid:
        e['Solid'] = {'radius': round(solid[0] * s, 3), 'height': round(solid[1] * s, 2)}
    if extra:
        e.update(extra)
    return e


def group(name, children):
    return {'name': name, 'id': name.lower(), 'LocalTransform': {}, 'children': children}


root = []

# The first-person rig is scaled about the middle of the sling (not the eye, which would change nothing on screen) and dropped a little.
VM_S = 0.72
VM_C = (0.05, -0.13, -0.6)
VM_T = [round(VM_C[i] * (1 - VM_S), 4) + (-0.07 if i == 1 else 0) for i in range(3)]
# ---- camera, seats and their first-person rigs ----------------------------------------------
# One camera (presentation) shows the seat this device plays through the VirtualCamera under that seat's Player; each seat has its own
# first-person rig (only this device's is visible) and its own body (what the others see; it sits on its own render layer, 2 << seat, which
# the camera leaves out for this device's seat). The sim removes the seats a match does not use.
SEAT_TINTS = ['#ff7a6e', '#6eb4ff', '#ffd95c', '#7ae89a']
SLING_POS = [0.0, 0.04, 0.0]
SLING_ROT = [-0.7071, 0.0, 0.0, 0.7071]
cam_children = []
for k in range(4):
    cam_children.append({'name': f'ViewmodelRig{k}', 'id': f'viewmodelrig{k}', 'LocalTransform': {'position': VM_T, 'scale': [VM_S, VM_S, VM_S]}, 'VmRig': {'index': k},
                         'VisualOffset': {'scale': [1, 1, 1] if k == 0 else [0, 0, 0]},
                         'MeshRenderer': {'mesh': 'models/viewmodel_rig.glb', 'castShadows': False, 'receiveShadows': False},
                         'Animator': {'controller': 'anim/viewmodel.animctrl.json'}})
    cam_children.append({'name': f'SlingStone{k}', 'id': f'slingstone{k}', 'LocalTransform': {'position': [round(0.17 * VM_S + VM_T[0], 4), round(-0.185 * VM_S + VM_T[1], 4), round(-0.625 * VM_S + VM_T[2], 4)], 'scale': [0.075 * VM_S] * 3}, 'VisualOffset': {}, 'Viewmodel': {'part': 'Stone', 'seat': k}, 'VmRig': {'index': k},
                         'BoneAttach': {'rig': f'@viewmodelrig{k}', 'joint': 'Pouch', 'space': 'Bind'},
                         'MeshRenderer': {'mesh': 'models/stone.glb', 'color': '#ffb25c', 'castShadows': False, 'receiveShadows': False}})
root.append({
    'name': 'PlayerCam', 'id': 'playercam',
    'Camera': {'projection': 'Perspective', 'fovY': 1.0, 'near': 0.04, 'far': 600, 'clearColor': '#a8d4ffff', 'postProfile': 'post/day.post.json', 'layerMask': 0xFFFFFFFF & ~2},
    'LocalTransform': {}, 'AudioListener': {}, 'VisualOffset': {}, 'CameraShake': {'maxOffset': [0.06, 0.06, 0.0], 'maxAngle': 0.02, 'decay': 2.5},
    'Fog': {'mode': 'Linear', 'color': '#b4d2f0ff', 'start': 60, 'end': 340},
    'children': cam_children,
})
SEAT_R = 15.7
seats = []
for k in range(4):
    a = PI + k * PI / 2
    seats.append({
        'name': f'Player{k}', 'id': f'player{k}',
        'LocalTransform': {'position': [round(math.sin(a) * SEAT_R, 3), 2.0, round(-math.cos(a) * SEAT_R, 3)]},
        'Player': {'index': k, 'protect': 3.0, 'yaw': round(PI - a, 4) % (2 * PI)},
        'children': [{'name': 'Eye', 'id': f'seatcam{k}', 'LocalTransform': {}, 'SeatCam': {'seat': k},
                      'VirtualCamera': {'camera': '@playercam', 'priority': 100 if k == 0 else 0, 'blend': 0, 'fovY': 1.0}}],
    })
root.append(group('Seats', seats))
bodies = []
for k in range(4):
    bodies.append({'name': f'Body{k}', 'id': f'body{k}',
                   'LocalTransform': {'position': [round(math.sin(PI + k * PI / 2) * SEAT_R, 3), 0, round(-math.cos(PI + k * PI / 2) * SEAT_R, 3)]},
                   'SeatBody': {'index': k},
                   'MeshRenderer': {'mesh': 'models/guy_rig.glb', 'color': SEAT_TINTS[k], 'layers': 2 << k},
                   'Animator': {'controller': 'anim/guy.animctrl.json'},
                   'children': [{'name': 'Sling', 'id': f'body{k}sling', 'BoneAttach': {'rig': f'@body{k}', 'joint': 'Hand.L', 'space': 'Joint'},
                                 'LocalTransform': {'position': SLING_POS, 'rotation': SLING_ROT, 'scale': [1.8, 1.8, 1.8]},
                                 'MeshRenderer': {'mesh': 'models/bot_sling.glb', 'castShadows': False, 'layers': 2 << k}}]})
root.append(group('Bodies', bodies))

# ---- light, sky, ground -------------------------------------------------------------
root.append({'name': 'Sun', 'id': 'sun',
             'Light': {'color': '#ffdcae', 'intensity': 2.6, 'castShadows': True, 'shadowDistance': 70, 'shadowBias': 0.04, 'sunAngle': 0.03},
             'LocalTransform': {'rotation': yaw_q(2.35, -0.45)}})
root.append({'name': 'Sky', 'id': 'sky',
             'Environment': {'map': 'env/sky.jpg', 'intensity': 1.15, 'skybox': True, 'tint': '#c4dcff', 'ambient': '#7b9bc0'},
             'LocalTransform': {}})

env = []
env.append({'name': 'Ground', 'id': 'ground', 'LocalTransform': {'scale': [300, 1, 300]},
            'MeshRenderer': {'mesh': 'builtin:plane', 'material': 'materials/ground.mat.json', 'castShadows': False}})
env.append({'name': 'Plaza', 'id': 'plaza', 'LocalTransform': {'position': [0, 0.02, 0], 'scale': [22, 0.05, 22]},
            'MeshRenderer': {'mesh': 'builtin:cylinder', 'material': 'materials/plaza.mat.json', 'castShadows': False}})
root.append(group('Environment', env))

# Meshy oaks: trunk radius, height, (unused fork height), (unused offset)
TREES = {'tree_a': (2.4, 17.0, 6.2, 5.6), 'tree_b': (2.2, 22.0, 8.4, 5.2), 'tree_c': (4.5, 14.0, 5.0, 7.0)}
TREE_NAMES = list(TREES)
# canopy ceiling per tree: (height, radius / height, underside / height)
CANOPY = {'tree_a': (17.0, 0.42, 0.40), 'tree_b': (22.0, 0.26, 0.45), 'tree_c': (14.0, 0.55, 0.33)}
huts = [(-14, -9), (14, -11), (-21, 5), (22, 4), (-7, -23), (9, -24)]
TREEHOUSES = [(-27, -14), (27, -12), (-30, 14), (30, 12), (-12, 30), (14, 30)]
# things a trunk must stay clear of: (x, z, radius)
BUILDINGS = [(x, z, 4.6) for (x, z) in huts] + [(x, z, 6.0) for (x, z) in TREEHOUSES] + [(0, 17.5, 5.0), (0, -33, 3.0)]


def clear_of_buildings(x, z, trunk_r):
    return all(math.hypot(x - bx, z - bz) > br + trunk_r + 1.2 for bx, bz, br in BUILDINGS)


# ---- trees ----------------------------------------------------------------------------
trees = []
placed = []
for k in range(9):  # the inner ring of giants frames the clearing
    nm = TREE_NAMES[k % len(TREE_NAMES)]
    for _ in range(60):
        a = k / 9 * 2 * PI + rnd.uniform(-0.25, 0.25)
        r = rnd.uniform(27, 34)
        s = rnd.uniform(0.95, 1.15)
        x, z = math.sin(a) * r, -math.cos(a) * r
        if clear_of_buildings(x, z, TREES[nm][0] * s) and all(math.hypot(x - px, z - pz) > pr + TREES[nm][0] * s + 3 for px, pz, pr in placed):
            break
    placed.append((x, z, TREES[nm][0] * s))
    trees.append(prop('Tree', nm, x, z, yaw=rnd.uniform(0, 6.28), s=s, solid=(TREES[nm][0] * 0.8, 100)))
    th, rf, yf = CANOPY[nm]
    trees[-1]['Blocker'] = {'radius': round(th * rf * s, 2), 'y0': round(th * yf * s, 2), 'y1': round(th * s, 2)}
for k in range(46):  # the hazy forest beyond
    a = rnd.uniform(0, 2 * PI)
    r = rnd.uniform(48, 120)
    nm = rnd.choice(TREE_NAMES)
    trees.append(prop('Forest', nm, math.sin(a) * r, -math.cos(a) * r, yaw=rnd.uniform(0, 6.28), s=rnd.uniform(1.2, 2.0),
                      solid=(TREES[nm][0] * 0.8, 100) if r < 60 else None))
root.append(group('Trees', trees))

# ---- village --------------------------------------------------------------------------
village = []
for (x, z) in huts:
    face = round(math.atan2(-x, -z) / (PI / 2)) * (PI / 2)
    quarter = int(round(face / (PI / 2))) % 2  # a quarter turn swaps the deck's footprint axes
    hx, hz = (3.15, 3.46) if quarter == 0 else (3.46, 3.15)
    village.append({'name': 'Hut', 'id': eid('hut'),
                    'LocalTransform': {'position': [x, 0, z], 'rotation': yaw_q(face)},
                    'MeshRenderer': {'mesh': 'models/hut_meshy.glb'},
                    'Solid': {'radius': 2.4, 'height': 30},
                    'Platform': {'halfX': hx, 'halfZ': hz, 'top': 0.67}})
village.append(prop('Tower', 'tower', 0, -33, solid=(1.6, 100)))
village.append({'name': 'TowerDeck', 'id': 'towerdeck', 'LocalTransform': {'position': [0, 0, -33]}, 'Platform': {'halfX': 2.6, 'halfZ': 2.6, 'top': 7.75}, 'Blocker': {'halfX': 2.6, 'halfZ': 2.6, 'y0': 7.0, 'y1': 7.75}})
for k, (deg, r_, sc) in enumerate([(35, 62, 1.5), (95, 70, 1.8), (160, 64, 1.4), (215, 72, 1.7), (275, 66, 1.5), (330, 74, 1.9)]):  # distant towers beyond the fence: vertical silhouettes, no collision
    village.append(prop('FarTower', 'tower', math.sin(math.radians(deg)) * r_, -math.cos(math.radians(deg)) * r_, yaw=k * 1.3, s=sc))
village.append({'name': 'Ladder', 'id': eid('ladder'), 'LocalTransform': {'position': [0, 0, -31.78]}, 'Ladder': {'top': 7.75, 'nx': 0, 'nz': 1, 'reach': 1.5}})

# the lookout deck the player starts on: railed on the far side, steps toward the plaza
village.append({'name': 'LookoutDeck', 'id': 'lookoutdeck', 'LocalTransform': {'position': [0, 0, 17.5]}, 'MeshRenderer': {'mesh': 'models/deck.glb'},
                'Platform': {'halfX': 3.0, 'halfZ': 3.0, 'top': 0.35}})
village.append(prop('Crate', 'crate', -2.2, 15.9, y=0.35, yaw=0.35, s=1.0, solid=(0.85, 1.1)))
village.append(prop('Crate', 'crate', -2.3, 17.3, y=0.35, yaw=-0.2, s=0.8, solid=(0.7, 0.9)))
village.append(prop('Barrel', 'barrel', 2.3, 16.2, y=0.35, yaw=0.0, solid=(0.55, 1.0)))
village.append(prop('Lantern', 'lantern_post', 2.5, 18.8, y=0.35, yaw=PI))
village.append(prop('PlanterL', 'planter_box', -1.7, 14.95, y=0.35, yaw=0.0, solid=(0.8, 0.6)))
village.append(prop('PlanterR', 'planter_box', 1.9, 14.95, y=0.35, yaw=0.0, solid=(0.8, 0.6)))
village.append(prop('Lantern', 'lantern_post', -2.7, 14.8, y=0.35, yaw=PI))
village.append(prop('Banner', 'banner_post', -2.5, 18.9, y=0.35, yaw=PI))
root.append(group('Village', village))

# ---- Meshy treehouses on their own posts, linked by rope bridges ------------------------------
canopy = []
DECK_TOP = 5.3
for (x, z) in TREEHOUSES:
    face = math.atan2(-x, -z)
    canopy.append({'name': 'Treehouse', 'id': eid('treehouse'),
                   'LocalTransform': {'position': [x, 0, z], 'rotation': yaw_q(face)},
                   'MeshRenderer': {'mesh': 'models/treehouse.glb'},
                   'Solid': {'radius': 2.3, 'height': 30},
                   'Platform': {'halfX': 3.2, 'halfZ': 3.2, 'top': DECK_TOP},
                   'Blocker': {'halfX': 3.2, 'halfZ': 3.2, 'yaw': round(face, 4), 'y0': 4.3, 'y1': DECK_TOP}})
    # the rope ladder hangs from the deck's front-right corner (model space x +1.5, z +3.3), facing the middle of the arena
    lx = x + 1.5 * math.cos(face) + 3.3 * math.sin(face)
    lz = z - 1.5 * math.sin(face) + 3.3 * math.cos(face)
    canopy.append({'name': 'Ladder', 'id': eid('ladder'), 'LocalTransform': {'position': [round(lx, 3), 0, round(lz, 3)]},
                   'Ladder': {'top': DECK_TOP, 'nx': round(math.sin(face), 4), 'nz': round(math.cos(face), 4), 'reach': 1.6}})
for i, a_ in enumerate(TREEHOUSES):
    for j, b_ in enumerate(TREEHOUSES):
        if j <= i:
            continue
        dist = math.hypot(b_[0] - a_[0], b_[1] - a_[1])
        if dist > 31:
            continue
        mx, mz = (a_[0] + b_[0]) / 2, (a_[1] + b_[1]) / 2
        ang = math.atan2(-(b_[1] - a_[1]), b_[0] - a_[0])
        canopy.append({'name': 'Bridge', 'id': eid('bridge'),
                       'LocalTransform': {'position': [round(mx, 3), DECK_TOP + 0.05, round(mz, 3)], 'rotation': yaw_q(ang), 'scale': [round((dist - 6.4) / 10.0, 3), 1, 1]},
                       'MeshRenderer': {'mesh': 'models/bridge.glb'},
                       'Blocker': {'halfX': round((dist - 6.4) / 2, 3), 'halfZ': 0.85, 'yaw': round(ang, 4), 'y0': DECK_TOP - 0.45, 'y1': DECK_TOP + 0.05, 'walk': True}})
for (x, z) in TREEHOUSES:  # hanging baskets and lanterns frame the decks
    face = math.atan2(-x, -z)
    for j in range(4):
        ang = face + j * PI / 2 + PI / 4
        canopy.append(prop('Basket', 'planter_hanging', x + math.sin(ang) * 3.5, z + math.cos(ang) * 3.5, y=DECK_TOP - 1.3, yaw=ang, shadows=False))
root.append(group('Treehouses', canopy))

# ---- the level boundary: fence ring, bushes and rocks just outside the invisible wall --------------
BOUND_R = 41.0
bound = []
nseg = int(2 * PI * BOUND_R / 3.0)
for k in range(nseg):
    a = k / nseg * 2 * PI
    x, z = math.sin(a) * BOUND_R, -math.cos(a) * BOUND_R
    bound.append({'name': 'Fence', 'id': eid('fence'),
                  'LocalTransform': {'position': [round(x, 3), 0, round(z, 3)], 'rotation': yaw_q(-a)},
                  'MeshRenderer': {'mesh': 'models/fence.glb', 'castShadows': False},
                  'Solid': {'radius': 1.6, 'height': 2.0}})
for k in range(46):
    a = rnd.uniform(0, 2 * PI)
    r = BOUND_R + rnd.uniform(-1.2, 2.4)
    bound.append(prop('BoundaryBush', 'bush', math.sin(a) * r, -math.cos(a) * r, yaw=rnd.uniform(0, 6.28), s=rnd.uniform(1.3, 2.1), shadows=False))
for k in range(26):
    a = rnd.uniform(0, 2 * PI)
    r = BOUND_R + rnd.uniform(-0.8, 3.2)
    bound.append(prop('BoundaryRock', 'rock', math.sin(a) * r, -math.cos(a) * r, yaw=rnd.uniform(0, 6.28), s=rnd.uniform(0.9, 1.8)))
root.append(group('Boundary', bound))

# ---- cover and dressing ------------------------------------------------------------
props = []
spots = []


def free(x, z, r):
    return all((x - sx) ** 2 + (z - sz) ** 2 > (r + sr) ** 2 for sx, sz, sr in spots)


for (x, z) in huts:
    spots.append((x, z, 4.5))
for (x, z) in TREEHOUSES:
    spots.append((x, z, 6.0))
spots.append((0, -33, 3))
for t in trees:
    p = t['LocalTransform']['position']
    spots.append((p[0], p[2], 3.5))
spots.append((0, 17.5, 5))  # the lookout deck


def scatter(count, mesh, name, rmin, rmax, clear, solid=None, scale=(0.9, 1.15), shadows=True, tries=40):
    placed = 0
    for _ in range(count):
        for _ in range(tries):
            a = rnd.uniform(0, 2 * PI)
            r = rnd.uniform(rmin, rmax)
            x, z = math.sin(a) * r, -math.cos(a) * r
            if free(x, z, clear):
                s = rnd.uniform(*scale)
                props.append(prop(name, mesh, x, z, yaw=rnd.uniform(0, 6.28), s=s, solid=solid, shadows=shadows))
                spots.append((x, z, clear))
                placed += 1
                break
    return placed


# cover to hide behind: all solid (they stop players, bots and stones)
scatter(22, 'crate', 'Crate', 4, 36, 1.5, solid=(0.85, 1.1), scale=(0.9, 1.6))
scatter(18, 'barrel', 'Barrel', 4, 36, 1.2, solid=(0.55, 1.0), scale=(0.9, 1.4))
scatter(14, 'log_pillar', 'LogPillar', 4, 36, 0.9, solid=(0.32, 1.4), scale=(0.9, 1.5))
scatter(6, 'rock', 'Rock', 8, 36, 2.2, solid=(1.1, 0.9), scale=(1.0, 1.8))
scatter(16, 'rock', 'BigRock', 6, 37, 4.2, solid=(1.1, 0.9), scale=(2.4, 3.8))
scatter(34, 'bush', 'Bush', 6, 38, 2.0, solid=(0.95, 1.0), scale=(1.1, 1.9), shadows=False)
scatter(8, 'planter_box', 'PlanterBox', 4, 30, 1.6, solid=(0.8, 0.6), scale=(1.0, 1.4))
scatter(8, 'stump', 'Stump', 4, 34, 1.1, solid=(0.5, 0.6), scale=(1.0, 1.8))
scatter(330, 'tuft', 'Tuft', 12.5, 39, 0.25, scale=(0.9, 1.9), shadows=False, tries=8)
scatter(40, 'flower_patch', 'Flowers', 12.5, 38, 0.4, scale=(0.7, 1.1), shadows=False)
scatter(7, 'mushroom', 'Mushroom', 12.5, 36, 0.4, scale=(0.8, 1.5), shadows=False)
for k in range(7):  # lanterns ring the plaza
    a = k / 7 * 2 * PI + 0.3
    x, z = math.sin(a) * 11.5, -math.cos(a) * 11.5
    props.append(prop('Lantern', 'lantern_post', x, z, yaw=a + PI / 2 * 0 + PI, solid=(0.2, 3)))
for k in range(5):
    a = k / 5 * 2 * PI + 0.9
    x, z = math.sin(a) * 15.5, -math.cos(a) * 15.5
    if free(x, z, 1):
        props.append(prop('Banner', 'banner_post', x, z, yaw=rnd.uniform(0, 6.28), solid=(0.12, 3.4)))
for t in trees[:9]:  # vines on the giants' trunks
    p = t['LocalTransform']['position']
    s = t['LocalTransform']['scale'][0]
    for j in range(3):
        a = rnd.uniform(0, 2 * PI)
        props.append(prop('Ivy', 'ivy', p[0] + math.sin(a) * 2.2 * s, p[2] + math.cos(a) * 2.2 * s, y=rnd.uniform(5.5, 8.5), yaw=a, shadows=False))
root.append(group('Props', props))


# ---- baked ground light (shadows + dappled sunlight) and the light shafts that fall through its bright spots ----
import os
rays = []
if os.path.exists('art-src/dapple_spots.json'):
    dd = json.load(open('art-src/dapple_spots.json'))
    sun_dir = [-c for c in dd['to_sun']]  # the way the light travels
    for (sx, sz, strength) in dd['spots']:
        ln = 16.0 + 10.0 * strength
        w = 1.6 + 1.6 * strength
        # the shaft's base is the spot on the ground; it rises toward the sun (anchor at the top, aligned with the light)
        top = (sx - sun_dir[0] * ln, -sun_dir[1] * ln * -1 * -1, sz - sun_dir[2] * ln)
        top = (top[0], 0 - sun_dir[1] * ln, top[2])
        rays.append({'name': 'Ray', 'id': eid('ray'),
                     'LocalTransform': {'position': [round(top[0], 2), round(top[1], 2), round(top[2], 2)], 'rotation': align_y(sun_dir), 'scale': [w, ln, w]},
                     'MeshRenderer': {'mesh': 'models/beam.glb', 'material': 'materials/beam.mat.json', 'castShadows': False, 'receiveShadows': False}})
root.append(group('LightShafts', rays))


# ---- slow clouds on a ring around the world ---------------------------------------------------------
cloud_rnd = random.Random(77)  # its own stream, so the clouds never move the layout
for _ in range(18 * 5):  # the 18 original clouds drew this many numbers from the layout stream; keeps every later position where it was
    rnd.uniform(0, 1)
clouds = []
for k in range(24):
    a = k / 24 * 2 * PI + cloud_rnd.uniform(-0.1, 0.1)
    r = cloud_rnd.uniform(200, 250)
    h = cloud_rnd.uniform(38, 100)
    w = cloud_rnd.uniform(90, 180)
    clouds.append({'name': 'Cloud', 'id': eid('cloud'),
                   'LocalTransform': {'position': [round(math.sin(a) * r, 1), round(h, 1), round(-math.cos(a) * r, 1)], 'rotation': yaw_q(-a), 'scale': [round(w, 1), round(w * 0.5, 1), 1]},
                   'MeshRenderer': {'mesh': 'models/cloud_card.glb', 'material': f'materials/cloud_{k % 4}.mat.json', 'castShadows': False, 'receiveShadows': False},
                   'Cloud': {'angle': round(a, 4), 'radius': round(r, 1), 'speed': round(cloud_rnd.uniform(0.0055, 0.011), 5)}, 'VisualOffset': {}})
root.append(group('Clouds', clouds))

# ---- critters and spawns ---------------------------------------------------------------
critters = []
TINTS = ['#ffffff', '#9cc4ff', '#ffb07a', '#a8f08a', '#d79cff', '#ffe27a', '#ff8f8f', '#7af0d8']
for k in range(8):
    a = k / 8 * 2 * PI + 0.2
    for _ in range(40):
        r = rnd.uniform(9, 30)
        x, z = math.sin(a) * r, -math.cos(a) * r
        if clear_of_buildings(x, z, 1.0):
            break
    bid = f'bot{k + 1}'
    critters.append({'name': f'Bot{k + 1}', 'id': bid,
                     'LocalTransform': {'position': [round(x, 3), 0, round(z, 3)], 'rotation': yaw_q(a)},
                     'MeshRenderer': {'mesh': 'models/guy_rig.glb', 'color': TINTS[k]},
                     'Animator': {'controller': 'anim/guy.animctrl.json'},
                     'Critter': {'id': k + 1, 'heading': round(rnd.uniform(0, 6.28), 3), 'turn': round(rnd.uniform(0.3, 2), 3), 'speed': round(rnd.uniform(2.4, 3.4), 2),
                                 'aim': round(rnd.uniform(4.0, 9.0), 2)},
                     'children': [{'name': 'Sling', 'id': f'{bid}sling', 'BoneAttach': {'rig': f'@{bid}', 'joint': 'Hand.L', 'space': 'Joint'},
                                   'LocalTransform': {'position': SLING_POS, 'rotation': SLING_ROT, 'scale': [1.8, 1.8, 1.8]},
                                   'MeshRenderer': {'mesh': 'models/bot_sling.glb', 'castShadows': False}}]})
root.append(group('Critters', critters))
spawns = []
for k in range(6):
    a = k / 6 * 2 * PI + 0.5
    spawns.append({'name': 'Spawn', 'id': eid('spawn'), 'LocalTransform': {'position': [round(math.sin(a) * 17, 2), 0, round(-math.cos(a) * 17, 2)]}, 'SpawnPoint': {}})
root.append(group('Spawns', spawns))

json.dump({'$schemaVersion': 2, 'id': 'main', 'entities': root}, open('scenes/main.scene.json', 'w'), indent=1)
print('entities', sum(1 + len(e.get('children', [])) for e in root))
