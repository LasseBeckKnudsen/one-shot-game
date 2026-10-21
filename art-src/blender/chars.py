exec(open('/Users/lasse/Desktop/Games/oneshot/art-src/blender/lib.py').read())
PI = math.pi


def critter(name, fur, belly, hat_color, hat_kind, seed=1):
    reset()
    fm = mat('fur', color=fur, rough=0.95)
    bm = mat('belly', color=belly, rough=0.95)
    eye_w = mat('eye_w', color='#ffffff', rough=0.2)
    eye_b = mat('eye_b', color='#1d1410', rough=0.2)
    nose = mat('nose', color='#e86a7a', rough=0.5)
    hat = mat('hat', color=hat_color, rough=0.8)
    band = mat('hat_band', color='#f6efe0', rough=0.9)
    objs = []
    objs.append(ball('body', r=0.42, loc=(0, 0, 0.52), m=fm, sub=3, scale=(1, 0.9, 1.0), flat=False, uv=0))
    objs.append(ball('belly', r=0.33, loc=(0, -0.22, 0.48), m=bm, sub=3, scale=(1, 0.6, 1.05), flat=False, uv=0))
    objs.append(ball('head', r=0.34, loc=(0, -0.03, 1.0), m=fm, sub=3, flat=False, uv=0))
    for sx in (-1, 1):
        objs.append(ball('ear', r=0.12, loc=(sx * 0.24, 0.0, 1.3), m=fm, sub=1, scale=(0.9, 0.6, 1.2), flat=False, uv=0))
        objs.append(ball('eye', r=0.095, loc=(sx * 0.14, -0.3, 1.03), m=eye_w, sub=1, flat=False, uv=0))
        objs.append(ball('pupil', r=0.05, loc=(sx * 0.14, -0.38, 1.03), m=eye_b, sub=1, flat=False, uv=0))
        objs.append(ball('foot', r=0.14, loc=(sx * 0.2, -0.12, 0.1), m=bm, sub=1, scale=(1, 1.4, 0.7), flat=False, uv=0))
        objs.append(ball('arm', r=0.11, loc=(sx * 0.42, -0.1, 0.62), m=fm, sub=1, scale=(0.8, 0.8, 1.3), flat=False, uv=0))
    objs.append(ball('muzzle', r=0.14, loc=(0, -0.31, 0.9), m=bm, sub=1, scale=(1.1, 0.8, 0.8), flat=False, uv=0))
    objs.append(ball('nose', r=0.05, loc=(0, -0.42, 0.93), m=nose, sub=1, flat=False, uv=0))
    objs.append(ball('tail', r=0.26, loc=(0, 0.5, 0.45), m=fm, sub=3, scale=(0.8, 1, 1.3), flat=False, uv=0))
    objs.append(ball('tail_tip', r=0.17, loc=(0, 0.55, 0.78), m=bm, sub=1, flat=False, uv=0))
    # hats
    if hat_kind == 'beanie':
        objs.append(cyl('hat', r=0.33, r2=0.12, h=0.32, loc=(0, -0.03, 1.28), seg=10, m=hat, uv=0, flat=False))
        objs.append(cyl('hat_band', r=0.35, h=0.1, loc=(0, -0.03, 1.27), seg=10, m=band, uv=0, flat=False))
        objs.append(ball('pom', r=0.08, loc=(0, -0.03, 1.62), m=band, sub=1, flat=False, uv=0))
    elif hat_kind == 'wizard':
        objs.append(cyl('hat_brim', r=0.5, h=0.04, loc=(0, -0.03, 1.27), seg=12, m=hat, uv=0, flat=False))
        objs.append(cyl('hat', r=0.3, r2=0.02, h=0.7, loc=(0, -0.03, 1.28), seg=10, m=hat, uv=0, flat=False))
        objs.append(cyl('hat_band', r=0.31, h=0.07, loc=(0, -0.03, 1.32), seg=10, m=band, uv=0, flat=False))
    else:  # acorn cap
        objs.append(ball('hat', r=0.38, loc=(0, -0.03, 1.28), m=hat, sub=2, scale=(1, 1, 0.7), flat=False, uv=0))
        objs.append(cyl('stem', r=0.04, h=0.14, loc=(0, -0.03, 1.55), seg=6, m=band, uv=0, flat=False))
    o = join(objs, name)
    return o


def hand(prefix, p, side, m_skin, m_cuff, m_sleeve, arm_from, rot_z=0.0):
    """A fist wrapped round the vertical grip centred at p (Blender coords): palm behind it, four curled fingers in front,
    thumb along the near side, sleeve running back to arm_from."""
    px, py, pz = p
    objs = [ball('palm', r=0.05, loc=(px + side * 0.012, py + 0.052, pz), m=m_skin, sub=2, scale=(1.05, 0.8, 1.7), flat=False, uv=0)]
    r = 0.056
    for i in range(4):
        z = pz + (1.5 - i) * 0.03
        pts = []
        for k in range(8):
            th = math.radians(-20 + k * 31)  # 0 = straight back, 90 = out to the side, 180 = in front
            pts.append((px + side * math.sin(th) * r, py + math.cos(th) * r, z - 0.004 * k))
        objs.append(tube('finger', pts, 0.0165, 0.0145, m=m_skin, seg=7, uv=0))
        objs.append(ball('knuckle', r=0.019, loc=pts[-1], m=m_skin, sub=1, flat=False, uv=0))
    # thumb: lies up the front of the grip
    tp = [(px - side * 0.045, py + 0.02, pz - 0.035), (px - side * 0.052, py - 0.02, pz + 0.0), (px - side * 0.03, py - 0.056, pz + 0.04)]
    objs.append(tube('thumb', tp, 0.02, 0.017, m=m_skin, seg=7, uv=0))
    d = Vector(arm_from) - Vector((px, py + 0.05, pz))
    objs.append(tube('wrist', [Vector((px, py + 0.05, pz)), Vector((px, py + 0.05, pz)) + d * 0.3], 0.036, 0.04, m=m_skin, seg=9, uv=0))
    objs.append(tube('cuff', [Vector((px, py + 0.05, pz)) + d * 0.26, Vector((px, py + 0.05, pz)) + d * 0.36], 0.042, 0.042, m=m_cuff, seg=10, uv=0))
    objs.append(tube('sleeve', [Vector((px, py + 0.05, pz)) + d * 0.34, arm_from], 0.04, 0.052, m=m_sleeve, seg=10, uv=0))
    return objs


def slingshot():
    reset()
    wood = mat('sling_wood', color='#8f5424', rough=0.6)
    wood_d = mat('sling_wood_d', color='#5e3416', rough=0.6)
    leather = mat('sling_leather', color='#74401f', rough=0.7)
    band = mat('sling_band', color='#c79a5e', rough=0.6)
    stone_m = mat('stone_glow', color='#ffc888', emit='#ff7a1c', emit_strength=0.2, rough=0.2)
    skin = mat('skin', color='#c9703f', rough=0.8)
    sleeve = mat('sleeve', color='#4f5d30', rough=0.95)
    cuff = mat('cuff', color='#33401f', rough=0.95)
    Y = 0.55
    H = [(0.04, Y + 0.02, -0.40), (0.04, Y + 0.01, -0.28), (0.04, Y, -0.17)]
    L = [(0.04, Y, -0.17), (-0.005, Y + 0.01, -0.10), (-0.06, Y + 0.02, -0.02), (-0.075, Y + 0.025, 0.045)]
    R = [(0.04, Y, -0.17), (0.085, Y + 0.01, -0.10), (0.14, Y + 0.02, -0.02), (0.158, Y + 0.025, 0.05)]
    fr = []
    fr.append(tube('handle', H, 0.034, 0.038, m=wood, seg=12, uv=0))
    fr.append(tube('prong_l', L, 0.04, 0.03, m=wood, seg=12, uv=0, cap=False))
    fr.append(tube('prong_r', R, 0.04, 0.03, m=wood, seg=12, uv=0, cap=False))
    fr.append(ball('knob_l', r=0.037, loc=L[-1], m=wood_d, sub=2, flat=False, uv=0))
    fr.append(ball('knob_r', r=0.037, loc=R[-1], m=wood_d, sub=2, flat=False, uv=0))
    fr.append(ball('joint', r=0.047, loc=H[-1], m=wood, sub=2, flat=False, uv=0))
    fr.append(tube('wrap_l', [L[2], L[3]], 0.042, 0.042, m=leather, seg=12, uv=0))
    fr.append(tube('wrap_r', [R[2], R[3]], 0.042, 0.042, m=leather, seg=12, uv=0))
    fr.append(ball('pommel', r=0.04, loc=H[0], m=wood_d, sub=2, flat=False, uv=0))
    fr += hand('l', (0.04, Y + 0.012, -0.235), -1, skin, cuff, sleeve, (-0.26, 0.44, -0.27))
    fr += hand('r', (0.115, Y - 0.07, -0.205), 1, skin, cuff, sleeve, (0.30, 0.44, -0.24))
    rope = mat('sling_rope', color='#d9b46c', rough=0.9)
    for zz in (-0.185, -0.205, -0.33):
        fr.append(torus('rope_bind', R=0.043, r=0.012, loc=(0.04, Y + 0.012, zz), m=rope, seg=14, rseg=5))
    frame = join(fr, 'slingshot_fp')
    P = (0.04, Y - 0.05, -0.115)
    pouch_objs = [ball('pouch', r=0.06, loc=P, m=leather, sub=2, scale=(1.1, 0.5, 0.8), flat=False, uv=0),
                  tube('band_l', [(-0.075, Y + 0.025, 0.045), (P[0] - 0.03, P[1] + 0.01, P[2] + 0.02)], 0.011, 0.011, m=band, seg=6, uv=0),
                  tube('band_r', [(0.158, Y + 0.025, 0.05), (P[0] + 0.03, P[1] + 0.01, P[2] + 0.02)], 0.011, 0.011, m=band, seg=6, uv=0)]
    pouch = join(pouch_objs, 'sling_pouch')
    st = ball('sling_stone', r=0.042, loc=(P[0], P[1] - 0.03, P[2] + 0.02), m=stone_m, sub=3, flat=False, uv=0)
    attr = st.data.color_attributes.new('Col', 'BYTE_COLOR', 'POINT')
    lo, hi = srgb('#ff5a0a'), srgb('#ffb347')
    for v in st.data.vertices:
        t = max(0.0, min(1.0, (v.co.z - (P[2] + 0.02 - 0.042)) / 0.084))
        attr.data[v.index].color = tuple(lo[i] + (hi[i] - lo[i]) * t ** 0.8 for i in range(3)) + (1,)
    return frame, pouch, st


def stone_world():
    reset()
    stone_m = mat('stone_glow', color='#ffd9a0', emit='#ffa640', emit_strength=0.9, rough=0.2)
    return ball('stone', r=0.5, loc=(0, 0, 0), m=stone_m, sub=2, flat=False, uv=0)


for nm, fur, belly, hatc, kind in (('critter_a', '#c9773a', '#f6dfb4', '#d8453b', 'beanie'),
                                   ('critter_b', '#8b6a4f', '#ecd9b6', '#3d62c9', 'wizard'),
                                   ('critter_c', '#d9a24a', '#fff1cf', '#8a5a2b', 'acorn')):
    o = critter(nm, fur, belly, hatc, kind)
    print(nm, export(nm, [o]))
f, p, s = slingshot()
print('slingshot_fp', export('slingshot_fp', [f]))
print('sling_pouch', export('sling_pouch', [p]))
print('sling_stone', export('sling_stone', [s]))
o = stone_world()
print('stone', export('stone', [o]))
