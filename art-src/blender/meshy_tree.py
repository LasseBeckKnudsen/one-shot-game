"""Imports a Meshy tree GLB, drops it to the ground, scales it to `height` metres, decimates to `max_tris`,
and exports assets/models/<name>.glb. Set SRC, NAME, HEIGHT, MAX_TRIS before exec'ing."""
exec(open('/Users/lasse/Desktop/Games/oneshot/art-src/blender/lib.py').read())
reset()
bpy.ops.import_scene.gltf(filepath=SRC)
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
for o in bpy.context.scene.objects:
    o.parent = None if o.type == 'MESH' else o.parent
bpy.ops.object.select_all(action='DESELECT')
for o in meshes:
    o.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
if len(meshes) > 1:
    bpy.ops.object.join()
o = bpy.context.active_object
o.matrix_world = Matrix.Identity(4)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
co = [v.co.copy() for v in o.data.vertices]
mn = Vector((min(c.x for c in co), min(c.y for c in co), min(c.z for c in co)))
mx = Vector((max(c.x for c in co), max(c.y for c in co), max(c.z for c in co)))
print('bbox', tuple(round(x, 2) for x in mn), tuple(round(x, 2) for x in mx), 'tris', tri_count([o]))
h0 = mx.z - mn.z
s = HEIGHT / h0
o.scale = (s, s, s)
bpy.ops.object.transform_apply(scale=True)
co = [v.co.copy() for v in o.data.vertices]
zmin = min(c.z for c in co)
base = [c for c in co if c.z < zmin + 0.06 * HEIGHT]
cx = sum(c.x for c in base) / len(base)
cy = sum(c.y for c in base) / len(base)
rad = max(math.hypot(c.x - cx, c.y - cy) for c in base)
if globals().get('CENTER'):
    cx, cy = (min(c.x for c in co) + max(c.x for c in co)) / 2, (min(c.y for c in co) + max(c.y for c in co)) / 2
o.data.transform(Matrix.Translation((-cx, -cy, -zmin)))
for img in bpy.data.images:
    img.file_format = 'JPEG'
if tri_count([o]) > MAX_TRIS:
    md = o.modifiers.new('dec', 'DECIMATE')
    md.ratio = MAX_TRIS / tri_count([o])
    bpy.ops.object.modifier_apply(modifier=md.name)
o.name = NAME
bpy.ops.object.shade_smooth()
co = [v.co for v in o.data.vertices]
print(NAME, 'tris', export(NAME, [o]), 'base radius', round(rad, 2), 'height', HEIGHT, 'x', round(min(c.x for c in co), 2), round(max(c.x for c in co), 2), 'y', round(min(c.y for c in co), 2), round(max(c.y for c in co), 2))
