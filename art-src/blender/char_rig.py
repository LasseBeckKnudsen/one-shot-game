"""Rigs the Meshy critter (char.glb): humanoid-style skeleton (Hips > Spine > Chest > Neck > Head, mirrored
UpperArm/LowerArm/Hand and UpperLeg/LowerLeg/Foot/Toes), plus a 4-bone tail and ears; auto weights; exports
assets/models/critter_rig.glb. Bone names follow the Unity/Mixamo humanoid convention with .L/.R sides.
Coordinates: Blender Z up, character faces -Y, left side = +X."""
exec(open('/Users/lasse/Desktop/Games/oneshot/art-src/blender/lib.py').read())
reset()
bpy.ops.import_scene.gltf(filepath='/private/tmp/claude-501/-Users-lasse-Desktop-Games-oneshot/bcc0e7c7-6a1b-434c-a862-cacad6dfa2ca/scratchpad/meshy/char.glb')
body = [o for o in bpy.context.scene.objects if o.type == 'MESH'][0]
for o in list(bpy.context.scene.objects):
    if o.type != 'MESH':
        bpy.data.objects.remove(o, do_unlink=True)
body.parent = None
body.matrix_world = Matrix.Identity(4)
body.name = 'critter'
bpy.ops.object.select_all(action='DESELECT'); body.select_set(True); bpy.context.view_layer.objects.active = body
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
S = 0.95  # 1.9 -> 1.8 m
SHIFT = Vector((-0.18, 0.40, 0.95))
body.data.transform(Matrix.Scale(S, 4) @ Matrix.Translation(SHIFT))
P = lambda x, y, z: Vector((x, y, z)) * S  # bone positions given in the shifted-but-unscaled frame
SH = lambda x, y, z: P(x + SHIFT.x * 0, y, z)  # (kept for readability)

# landmarks in the shifted frame (feet at z=0, body centre at x=0,y=0)
def L(x, y, z): return Vector((x, y, z)) * S
bones = {}  # name: (head, tail, parent)
def add(name, head, tail, parent=None): bones[name] = (head, tail, parent)

add('Hips', L(0, 0.0, 0.40), L(0, 0.0, 0.62))
add('Spine', L(0, 0.0, 0.62), L(0, -0.02, 0.82))
add('Chest', L(0, -0.02, 0.82), L(0, -0.04, 1.08), 'Spine')
add('Neck', L(0, -0.05, 1.08), L(0, -0.06, 1.18), 'Chest')
add('Head', L(0, -0.06, 1.18), L(0, -0.06, 1.62), 'Neck')
for sd, sg in (('L', 1), ('R', -1)):
    add(f'Shoulder.{sd}', L(sg * 0.06, -0.04, 1.0), L(sg * 0.2, -0.04, 0.98), 'Chest')
    add(f'UpperArm.{sd}', L(sg * 0.2, -0.04, 0.98), L(sg * 0.46, -0.04, 0.82), f'Shoulder.{sd}')
    add(f'LowerArm.{sd}', L(sg * 0.46, -0.04, 0.82), L(sg * 0.64, -0.04, 0.66), f'UpperArm.{sd}')
    add(f'Hand.{sd}', L(sg * 0.64, -0.04, 0.66), L(sg * 0.76, -0.04, 0.56), f'LowerArm.{sd}')
    add(f'UpperLeg.{sd}', L(sg * 0.15, 0.0, 0.40), L(sg * 0.17, -0.02, 0.22), 'Hips')
    add(f'LowerLeg.{sd}', L(sg * 0.17, -0.02, 0.22), L(sg * 0.17, -0.02, 0.09), f'UpperLeg.{sd}')
    add(f'Foot.{sd}', L(sg * 0.17, -0.02, 0.09), L(sg * 0.17, -0.12, 0.03), f'LowerLeg.{sd}')
    add(f'Toes.{sd}', L(sg * 0.17, -0.12, 0.03), L(sg * 0.17, -0.2, 0.02), f'Foot.{sd}')
    add(f'Ear.{sd}', L(sg * 0.16, -0.04, 1.5), L(sg * 0.22, -0.04, 1.68), 'Head')
add('Tail_01', L(0, 0.12, 0.45), L(0, 0.42, 0.55), 'Hips')
add('Tail_02', L(0, 0.42, 0.55), L(0, 0.62, 0.82), 'Tail_01')
add('Tail_03', L(0, 0.62, 0.82), L(0, 0.6, 1.1), 'Tail_02')
add('Tail_04', L(0, 0.6, 1.1), L(0, 0.46, 1.38), 'Tail_03')
add('Tail_05', L(0, 0.46, 1.38), L(0, 0.2, 1.5), 'Tail_04')
bones['Spine'] = (bones['Spine'][0], bones['Spine'][1], 'Hips')

arm_d = bpy.data.armatures.new('CritterRig')
arm = bpy.data.objects.new('CritterRig', arm_d)
bpy.context.collection.objects.link(arm)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='EDIT')
for n, (h, t, p) in bones.items():
    b = arm_d.edit_bones.new(n)
    b.head, b.tail = h, t
for n, (h, t, p) in bones.items():
    if p:
        arm_d.edit_bones[n].parent = arm_d.edit_bones[p]
        if (arm_d.edit_bones[p].tail - h).length < 1e-4:
            arm_d.edit_bones[n].use_connect = True
bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.object.select_all(action='DESELECT')
body.select_set(True); arm.select_set(True)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.parent_set(type='ARMATURE_AUTO')
vg = {g.name for g in body.vertex_groups}
print('bones', len(bones), 'groups', len(vg), 'tris', tri_count([body]))

import collections
def weight_report():
    cnt = collections.Counter()
    for v in body.data.vertices:
        for g in v.groups:
            if g.weight > 0.05:
                cnt[body.vertex_groups[g.group].name] += 1
    return cnt
cnt = weight_report()
empty = [n for n in bones if cnt.get(n, 0) < 15]
print('weak groups', empty)
# fallback: distance-based weights for bones the heat solver dropped (blend over the nearest bone segments)
if empty or sum(1 for v in body.data.vertices if not any(g.weight > 0.05 for g in v.groups)):
    def seg_dist(p, a, b):
        ab = b - a
        t = max(0.0, min(1.0, (p - a).dot(ab) / max(1e-9, ab.length_squared)))
        return (p - (a + ab * t)).length
    for v in body.data.vertices:
        def allowed(n):
            x, y, z = v.co.x / S, v.co.y / S, v.co.z / S
            if n.startswith(('UpperLeg', 'LowerLeg', 'Foot', 'Toes')):
                return z < 0.44 and y < 0.2 and abs(x) > 0.02
            if n.startswith('Tail'):
                return y > 0.3 or (n == 'Tail_01' and y > 0.2)
            if n.startswith(('UpperArm', 'LowerArm', 'Hand')):
                return abs(x) > 0.2 and 0.45 < z < 1.12 and y < 0.2
            if n.startswith('Shoulder'):
                return abs(x) > 0.08 and 0.8 < z < 1.12
            if n.startswith('Ear'):
                return z > 1.4
            return True
        ds = sorted(((seg_dist(v.co, h, t), n) for n, (h, t, p) in bones.items() if allowed(n)))
        picks = ds[:3]
        ws = [1.0 / (0.03 + d) ** 4 for d, n in picks]
        tot = sum(ws)
        for g in v.groups:
            body.vertex_groups[g.group].remove([v.index])
        for (d, n), w in zip(picks, ws):
            body.vertex_groups[n].add([v.index], w / tot, 'REPLACE')
    print('distance fallback applied')
    print({n: c for n, c in weight_report().items()})

if globals().get('EXPORT_RIG', True):
    for img in bpy.data.images:
        img.file_format = 'JPEG'
    bpy.ops.object.select_all(action='DESELECT')
    body.select_set(True); arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.export_scene.gltf(filepath=OUT + 'critter_rig.glb', export_format='GLB', use_selection=True, export_yup=True,
                              export_skins=True, export_animations=False, export_apply=False,
                              export_image_format='AUTO', export_jpeg_quality=85, export_cameras=False, export_lights=False)
    print('exported critter_rig.glb')
