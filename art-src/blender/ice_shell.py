"""The ice a missed shot freezes a character in (assets/models/ice_shell.glb): a faceted crystal block about 1.2 m wide and 2 m tall around a standing character
(feet on y = 0), with crystal spikes at the base and shoulders. Translucent icy blue, flat shaded, about 250 triangles.
usage: blender -b --python art-src/blender/ice_shell.py"""
import bpy, bmesh, math, random
from mathutils import Vector

random.seed(7)
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)

mat = bpy.data.materials.new('Ice')
mat.use_nodes = True
nt = mat.node_tree
bsdf = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
bsdf.inputs['Base Color'].default_value = (0.55, 0.85, 1.0, 1.0)
bsdf.inputs['Alpha'].default_value = 0.42
bsdf.inputs['Roughness'].default_value = 0.08
for name in ('Emission Color', 'Emission'):
    if name in bsdf.inputs:
        bsdf.inputs[name].default_value = (0.35, 0.7, 1.0, 1.0)
        break
if 'Emission Strength' in bsdf.inputs:
    bsdf.inputs['Emission Strength'].default_value = 0.6
try:
    mat.surface_render_method = 'BLENDED'
except Exception:
    mat.blend_method = 'BLEND'

parts = []


def finish(obj):
    obj.data.materials.append(mat)
    for p in obj.data.polygons:
        p.use_smooth = False
    parts.append(obj)


# the block: an icosphere stretched into a tall crystal, its facets pushed in and out a little
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1.0, location=(0, 0, 1.0))
body = bpy.context.active_object
body.scale = (0.62, 0.62, 1.05)
bm = bmesh.new()
bm.from_mesh(body.data)
for v in bm.verts:
    v.co *= 1.0 + random.uniform(-0.07, 0.09)
bm.to_mesh(body.data)
bm.free()
finish(body)

# spikes: cones leaning out from the base and the shoulders
for i in range(9):
    a = i / 9 * math.tau + random.uniform(-0.2, 0.2)
    base_ring = i % 3 != 0
    r = 0.5 if base_ring else 0.42
    z = 0.05 if base_ring else 1.55
    h = random.uniform(0.55, 0.9) if base_ring else random.uniform(0.4, 0.65)
    bpy.ops.mesh.primitive_cone_add(vertices=5, radius1=random.uniform(0.1, 0.16), radius2=0.0, depth=h, location=(math.cos(a) * r, math.sin(a) * r, z + h / 2))
    c = bpy.context.active_object
    tilt = random.uniform(0.35, 0.6)
    c.rotation_euler = (math.sin(a) * tilt, -math.cos(a) * tilt, 0)
    finish(c)

# join and export (Blender is Z up, glTF Y up: the exporter converts)
bpy.ops.object.select_all(action='DESELECT')
for p in parts:
    p.select_set(True)
bpy.context.view_layer.objects.active = parts[0]
bpy.ops.object.join()
ice = bpy.context.active_object
ice.name = 'ice_shell'
tris = sum(len(p.vertices) - 2 for p in ice.data.polygons)
print('ice_shell tris', tris)
bpy.ops.export_scene.gltf(filepath='/Users/lasse/Desktop/Games/oneshot/assets/models/ice_shell.glb', export_format='GLB', use_selection=True, export_yup=True,
                          export_apply=True, export_cameras=False, export_lights=False)
print('exported')
