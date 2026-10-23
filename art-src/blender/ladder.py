"""A rope-and-wood ladder for the tree platforms (assets/models/ladder_5m3.glb): two rails and a rung every 0.33 m, 0.8 m wide, 5.3 m tall (the deck height),
standing on y = 0 with its front facing +Z (flat in the XY plane of glTF). About 230 triangles, one flat wood material.
usage: blender -b --python art-src/blender/ladder.py"""
import bpy, bmesh

H, W = 5.4, 0.8
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
mat = bpy.data.materials.new('LadderWood')
mat.use_nodes = True
bsdf = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
bsdf.inputs['Base Color'].default_value = (0.42, 0.25, 0.11, 1.0)
bsdf.inputs['Roughness'].default_value = 0.85
parts = []


def box(cx, cy, cz, sx, sy, sz):
    # Blender Z is up: x across, y depth, z height
    bpy.ops.mesh.primitive_cube_add(size=1, location=(cx, cy, cz))
    b = bpy.context.active_object
    b.scale = (sx, sy, sz)
    b.data.materials.append(mat)
    parts.append(b)


for sx in (-W / 2, W / 2):
    box(sx, 0, H / 2, 0.08, 0.08, H)
n = int(H / 0.33)
for i in range(n):
    box(0, 0, 0.3 + i * 0.33, W, 0.06, 0.05)
bpy.ops.object.select_all(action='DESELECT')
for p in parts:
    p.select_set(True)
bpy.context.view_layer.objects.active = parts[0]
bpy.ops.object.join()
lad = bpy.context.active_object
lad.name = 'ladder'
for f in lad.data.polygons:
    f.use_smooth = False
print('ladder tris', sum(len(p.vertices) - 2 for p in lad.data.polygons))
bpy.ops.export_scene.gltf(filepath='/Users/lasse/Desktop/Games/oneshot/assets/models/ladder_5m3.glb', export_format='GLB', use_selection=True, export_yup=True, export_apply=True)
print('exported')
