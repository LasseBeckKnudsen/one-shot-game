"""Rigs the Meshy adventurer (guy.glb) with a humanoid skeleton -> assets/models/guy_rig.glb (1.75 m, ~4.1k tris).
Blender frame: Z up, the character faces -Y, its left side is +X. Weights: nearest bone segments among the bones allowed
in a region (the Meshy mesh is not manifold, so heat weights fail)."""
exec(open('/Users/lasse/Desktop/Games/oneshot/art-src/blender/lib.py').read())
reset()
bpy.ops.import_scene.gltf(filepath='/private/tmp/claude-501/-Users-lasse-Desktop-Games-oneshot/bcc0e7c7-6a1b-434c-a862-cacad6dfa2ca/scratchpad/meshy/guy.glb')
body = [o for o in bpy.context.scene.objects if o.type == 'MESH'][0]
for o in list(bpy.context.scene.objects):
    if o.type != 'MESH':
        bpy.data.objects.remove(o, do_unlink=True)
body.parent = None
body.matrix_world = Matrix.Identity(4)
body.name = 'guy'
bpy.ops.object.select_all(action='DESELECT'); body.select_set(True); bpy.context.view_layer.objects.active = body
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
for img in bpy.data.images:
    img.file_format = 'JPEG'
S = 0.92
body.data.transform(Matrix.Scale(S, 4) @ Matrix.Translation((0, 0, 0.95)))  # feet on z = 0, 1.75 m tall


def L(x, y, z):
    return Vector((x, y, z)) * S


bones = {}


def add(n, h, t, parent=None):
    bones[n] = (h, t, parent)


add('Hips', L(0, 0, 0.72), L(0, 0, 0.84))
add('Spine', L(0, 0, 0.84), L(0, 0, 0.98), 'Hips')
add('Chest', L(0, 0, 0.98), L(0, 0, 1.17), 'Spine')
add('Neck', L(0, 0, 1.17), L(0, 0, 1.27), 'Chest')
add('Head', L(0, 0, 1.27), L(0, 0, 1.88), 'Neck')
for sd, sg in (('L', 1), ('R', -1)):
    add(f'Shoulder.{sd}', L(sg * 0.08, 0, 1.18), L(sg * 0.27, 0, 1.13), 'Chest')
    add(f'UpperArm.{sd}', L(sg * 0.27, 0, 1.13), L(sg * 0.46, 0, 0.80), f'Shoulder.{sd}')
    add(f'LowerArm.{sd}', L(sg * 0.46, 0, 0.80), L(sg * 0.58, 0, 0.67), f'UpperArm.{sd}')
    add(f'Hand.{sd}', L(sg * 0.58, 0, 0.67), L(sg * 0.69, 0, 0.50), f'LowerArm.{sd}')
    add(f'UpperLeg.{sd}', L(sg * 0.13, 0, 0.78), L(sg * 0.14, 0, 0.40), 'Hips')
    add(f'LowerLeg.{sd}', L(sg * 0.14, 0, 0.40), L(sg * 0.14, 0, 0.10), f'UpperLeg.{sd}')
    add(f'Foot.{sd}', L(sg * 0.14, 0, 0.10), L(sg * 0.14, -0.20, 0.04), f'LowerLeg.{sd}')
    add(f'Toes.{sd}', L(sg * 0.14, -0.20, 0.04), L(sg * 0.14, -0.30, 0.03), f'Foot.{sd}')

arm_d = bpy.data.armatures.new('GuyRig')
arm = bpy.data.objects.new('GuyRig', arm_d)
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
bpy.ops.object.parent_set(type='ARMATURE_NAME')
for n in bones:
    if n not in body.vertex_groups:
        body.vertex_groups.new(name=n)


def seg_dist(p, a, b):
    ab = b - a
    t = max(0.0, min(1.0, (p - a).dot(ab) / max(1e-9, ab.length_squared)))
    return (p - (a + ab * t)).length


def allowed(n, m):
    x, y, z = m.x, m.y, m.z
    ax = abs(x)
    if n.startswith(('UpperLeg', 'LowerLeg', 'Foot', 'Toes')):
        return z < 0.82 and ax < 0.36 and (ax > 0.015) and ((x > 0) == n.endswith('.L'))
    if n.startswith('Hand'):
        return ax > 0.50 and z > 0.40 and ((x > 0) == n.endswith('.L'))
    if n.startswith('LowerArm'):
        return ax > 0.40 and 0.6 < z < 1.0 and ((x > 0) == n.endswith('.L'))
    if n.startswith('UpperArm'):
        return ax > 0.32 and 0.66 < z < 1.26 and ((x > 0) == n.endswith('.L'))
    if n.startswith('Shoulder'):
        return ax > 0.12 and 0.95 < z < 1.3 and ((x > 0) == n.endswith('.L'))
    if n == 'Head':
        return z > 1.22
    if n == 'Neck':
        return 1.1 < z < 1.34
    return True


for v in body.data.vertices:
    m = v.co / 1.0
    m = Vector((m.x / S, m.y / S, m.z / S))
    ds = sorted(((seg_dist(v.co, h, t), n) for n, (h, t, p) in bones.items() if allowed(n, m)))
    picks = ds[:3]
    ws = [1.0 / (0.035 + d) ** 4 for d, n in picks]
    tot = sum(ws)
    for (d, n), w in zip(picks, ws):
        body.vertex_groups[n].add([v.index], w / tot, 'REPLACE')
print('guy tris', tri_count([body]), 'bones', len(bones))

if globals().get('EXPORT_RIG', True):
    bpy.ops.object.select_all(action='DESELECT')
    body.select_set(True); arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.export_scene.gltf(filepath=OUT + 'guy_rig.glb', export_format='GLB', use_selection=True, export_yup=True,
                              export_skins=True, export_animations=False, export_apply=False,
                              export_image_format='AUTO', export_jpeg_quality=86, export_cameras=False, export_lights=False)
    print('exported guy_rig.glb')
