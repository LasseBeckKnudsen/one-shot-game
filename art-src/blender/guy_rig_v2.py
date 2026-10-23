"""Re-rigs assets/models/guy_rig.glb to the animation-3d rigging checklist, keeping its mesh, textures and weights:
a non-deforming Root bone at the origin (pointing up) with Hips as its child, and a non-deforming socket bone on each hand
(+Y along the held item) for BoneAttach. Run headless: blender -b --python art-src/blender/guy_rig_v2.py -- <in.glb> <out.glb>
(`import_scene.gltf` then rebuilds the armature from the same bone table as guy_rig.py, so the weights' vertex groups still match.)"""
import bpy, sys
from mathutils import Vector

IN, OUT_GLB = sys.argv[-2], sys.argv[-1]
S = 0.92


def L(x, y, z):
    return Vector((x, y, z)) * S


bpy.ops.import_scene.gltf(filepath=IN)
body = next(o for o in bpy.data.objects if o.type == 'MESH' and o.name == 'guy')
for o in list(bpy.data.objects):
    if o.type == 'ARMATURE':
        bpy.data.objects.remove(o, do_unlink=True)
for m in list(body.modifiers):
    body.modifiers.remove(m)
body.parent = None
body.matrix_world = body.matrix_world.copy()

bones = {}


def add(n, h, t, parent=None, deform=True):
    bones[n] = (h, t, parent, deform)


add('Root', Vector((0, 0, 0)), Vector((0, 0, 0.3)), None, False)
add('Hips', L(0, 0, 0.72), L(0, 0, 0.84), 'Root')
add('Spine', L(0, 0, 0.84), L(0, 0, 0.98), 'Hips')
add('Chest', L(0, 0, 0.98), L(0, 0, 1.17), 'Spine')
add('Neck', L(0, 0, 1.17), L(0, 0, 1.27), 'Chest')
add('Head', L(0, 0, 1.27), L(0, 0, 1.88), 'Neck')
for sd, sg in (('L', 1), ('R', -1)):
    add(f'Shoulder.{sd}', L(sg * 0.08, 0, 1.18), L(sg * 0.27, 0, 1.13), 'Chest')
    add(f'UpperArm.{sd}', L(sg * 0.27, 0, 1.13), L(sg * 0.46, 0, 0.80), f'Shoulder.{sd}')
    add(f'LowerArm.{sd}', L(sg * 0.46, 0, 0.80), L(sg * 0.58, 0, 0.67), f'UpperArm.{sd}')
    add(f'Hand.{sd}', L(sg * 0.58, 0, 0.67), L(sg * 0.69, 0, 0.50), f'LowerArm.{sd}')
    add(f'Socket.Hand.{sd}', L(sg * 0.63, 0, 0.59), L(sg * 0.63, -0.12, 0.59), f'Hand.{sd}', False)
    add(f'UpperLeg.{sd}', L(sg * 0.13, 0, 0.78), L(sg * 0.14, 0, 0.40), 'Hips')
    add(f'LowerLeg.{sd}', L(sg * 0.14, 0, 0.40), L(sg * 0.14, 0, 0.10), f'UpperLeg.{sd}')
    add(f'Foot.{sd}', L(sg * 0.14, 0, 0.10), L(sg * 0.14, -0.20, 0.04), f'LowerLeg.{sd}')
    add(f'Toes.{sd}', L(sg * 0.14, -0.20, 0.04), L(sg * 0.14, -0.30, 0.03), f'Foot.{sd}')

arm_d = bpy.data.armatures.new('GuyRig')
arm = bpy.data.objects.new('GuyRig', arm_d)
bpy.context.collection.objects.link(arm)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='EDIT')
for n, (h, t, p, d) in bones.items():
    b = arm_d.edit_bones.new(n)
    b.head, b.tail = h, t
    b.use_deform = d
for n, (h, t, p, d) in bones.items():
    if p:
        arm_d.edit_bones[n].parent = arm_d.edit_bones[p]
        if (arm_d.edit_bones[p].tail - h).length < 1e-4:
            arm_d.edit_bones[n].use_connect = True
bpy.ops.object.mode_set(mode='OBJECT')
mod = body.modifiers.new('Armature', 'ARMATURE')
mod.object = arm
body.parent = arm
missing = [n for n, v in bones.items() if v[3] and n not in body.vertex_groups]
print('deform bones without a vertex group:', missing)
influences = max(len([g for g in v.groups if g.weight > 1e-4]) for v in body.data.vertices)
print('max influences', influences, 'bones', len(bones))
bpy.ops.object.select_all(action='DESELECT')
body.select_set(True); arm.select_set(True)
bpy.context.view_layer.objects.active = arm
bpy.ops.export_scene.gltf(filepath=OUT_GLB, export_format='GLB', use_selection=True, export_yup=True, export_skins=True,
                          export_animations=False, export_apply=False, export_image_format='AUTO', export_jpeg_quality=86,
                          export_cameras=False, export_lights=False)
print('exported', OUT_GLB)
