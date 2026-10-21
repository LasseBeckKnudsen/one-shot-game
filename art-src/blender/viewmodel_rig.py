"""Rigs the Meshy first-person slingshot-with-hands (sling_hands.glb) -> assets/models/viewmodel_rig.glb.
Blender frame: player looks along +Y, Z up, left = -X (the model is seen from behind the sling).
Bones: Root > Sling (frame + rope + bands) ; LowerArm.L > Hand.L holds the handle ; LowerArm.R > Hand.R > Pouch.
Spatial weights (the Meshy mesh is 1600 loose shells, so topology based weighting is useless)."""
exec(open('/Users/lasse/Desktop/Games/oneshot/art-src/blender/lib.py').read())
reset()
bpy.ops.import_scene.gltf(filepath='/private/tmp/claude-501/-Users-lasse-Desktop-Games-oneshot/bcc0e7c7-6a1b-434c-a862-cacad6dfa2ca/scratchpad/meshy/sling_hands.glb')
body = [o for o in bpy.context.scene.objects if o.type == 'MESH'][0]
for o in list(bpy.context.scene.objects):
    if o.type != 'MESH':
        bpy.data.objects.remove(o, do_unlink=True)
body.parent = None
body.matrix_world = Matrix.Identity(4)
body.name = 'viewmodel'
bpy.ops.object.select_all(action='DESELECT'); body.select_set(True); bpy.context.view_layer.objects.active = body
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
# the texture ships at 2048 to keep the GLB small
for img in bpy.data.images:
    if img.size[0] > 2048:
        img.scale(2048, 2048)
    img.file_format = 'JPEG'

# the final transform: model units -> metres, placed 0.6 m in front of the camera (camera looks along +Y here)
S = 0.40
OFFSET = Vector((0.05, 0.60, -0.13))
body.data.transform(Matrix.Translation(OFFSET) @ Matrix.Scale(S, 4))


def P(x, y, z):  # a point given in model units
    return Vector((x, y, z)) * S + OFFSET


bones = {}


def add(n, h, t, parent=None):
    bones[n] = (h, t, parent)


add('Root', P(0, 0.4, -0.8), P(0, 0.4, -0.6))
add('Sling', P(-0.02, 0.45, -0.45), P(0.0, 0.45, 0.78), 'Hand.L')
add('LowerArm.L', P(-0.95, 0.25, -0.78), P(-0.33, 0.45, -0.28), 'Root')
add('Hand.L', P(-0.33, 0.45, -0.28), P(-0.08, 0.45, 0.0), 'LowerArm.L')
add('LowerArm.R', P(0.95, 0.1, -0.78), P(0.50, 0.12, -0.55), 'Root')
add('Hand.R', P(0.50, 0.12, -0.55), P(0.12, 0.10, -0.50), 'LowerArm.R')
add('Pouch', P(0.30, 0.08, -0.12), P(0.30, 0.0, -0.06), 'Hand.R')

arm_d = bpy.data.armatures.new('ViewmodelRig')
arm = bpy.data.objects.new('ViewmodelRig', arm_d)
bpy.context.collection.objects.link(arm)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='EDIT')
for n, (h, t, p) in bones.items():
    b = arm_d.edit_bones.new(n)
    b.head, b.tail = h, t
for n, (h, t, p) in bones.items():
    if p:
        arm_d.edit_bones[n].parent = arm_d.edit_bones[p]
bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.object.select_all(action='DESELECT')
body.select_set(True); arm.select_set(True)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.parent_set(type='ARMATURE_NAME')  # empty groups; weights follow

# ---- spatial weights --------------------------------------------------------------------------
for n in bones:
    if n not in body.vertex_groups:
        body.vertex_groups.new(name=n)
M = lambda v: ((v.co - OFFSET) / S)  # back to model units


def region(m):
    x, y, z = m.x, m.y, m.z
    if x < -0.2 and z < -0.12:
        return 'LowerArm.L'
    if -0.36 < x < 0.10 and -0.46 < z < 0.08 and y > 0.2:
        return 'Hand.L'
    if x > 0.34 and z < -0.5:
        return 'LowerArm.R'
    if 0.0 < x < 0.56 and -0.72 < z < -0.30 and y < 0.42:
        return 'Hand.R'
    if 0.08 < x < 0.46 and -0.32 < z < 0.04 and y < 0.34:
        return 'Pouch'
    return 'Sling'


pouch_c = Vector((0.30, 0.08, -0.12))
for v in body.data.vertices:
    m = M(v)
    r = region(m)
    ws = {r: 1.0}
    if r == 'Sling':
        # bands near the pouch follow it a little so they stretch when it is pulled
        dp = (m - pouch_c).length
        if dp < 0.34 and m.z < 0.35 and m.x > 0.0:
            wp = (1 - dp / 0.34) ** 1.3
            ws = {'Sling': 1 - wp, 'Pouch': wp}
    elif r in ('Hand.L', 'Hand.R'):
        pass
    for n, w in ws.items():
        body.vertex_groups[n].add([v.index], w, 'REPLACE')
# smooth the group borders so the wrists do not crack
bpy.context.view_layer.objects.active = body
bpy.ops.object.mode_set(mode='WEIGHT_PAINT')
bpy.ops.object.mode_set(mode='OBJECT')
print('tris', tri_count([body]), 'groups', len(body.vertex_groups))

if globals().get('EXPORT_RIG', True):
    bpy.ops.object.select_all(action='DESELECT')
    body.select_set(True); arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.export_scene.gltf(filepath=OUT + 'viewmodel_rig.glb', export_format='GLB', use_selection=True, export_yup=True,
                              export_skins=True, export_animations=False, export_apply=False,
                              export_image_format='AUTO', export_jpeg_quality=88, export_cameras=False, export_lights=False)
    print('exported viewmodel_rig.glb')
