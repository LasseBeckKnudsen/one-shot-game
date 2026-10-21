import bpy, math
SP='/private/tmp/claude-501/-Users-lasse-Desktop-Games-oneshot/bcc0e7c7-6a1b-434c-a862-cacad6dfa2ca/scratchpad/'
arm = bpy.data.objects['GuyRig']
sc = bpy.context.scene
sc.render.engine = 'BLENDER_WORKBENCH'
sc.display.shading.light = 'FLAT'; sc.display.shading.color_type = 'TEXTURE'
sc.render.resolution_x = 500; sc.render.resolution_y = 600
for o in list(bpy.data.objects):
    if o.type == 'CAMERA': bpy.data.objects.remove(o, do_unlink=True)
cd = bpy.data.cameras.new('c'); cd.type = 'ORTHO'; cd.ortho_scale = 2.2
cam = bpy.data.objects.new('c', cd); bpy.context.collection.objects.link(cam); sc.camera = cam
def pose(d):
    for pb in arm.pose.bones:
        pb.rotation_mode = 'XYZ'; pb.rotation_euler = (0, 0, 0); pb.location = (0, 0, 0)
    for n, e in d.items():
        arm.pose.bones[n].rotation_euler = tuple(math.radians(a) for a in e)
    bpy.context.view_layer.update()
def shot(name, view):
    cam.location, cam.rotation_euler = {'front': ((0, -6, 0.85), (math.pi/2, 0, 0)), 'side': ((6, 0, 0.85), (math.pi/2, 0, math.pi/2))}[view]
    sc.render.filepath = SP + f'guyrig_{name}_{view}.png'
    bpy.ops.render.render(write_still=True)
poses = {
 'rest': {},
 'walk': {'UpperLeg.L': (40,0,0), 'LowerLeg.L': (-30,0,0), 'UpperLeg.R': (-35,0,0), 'UpperArm.L': (0,0,-20), 'UpperArm.R': (0,0,20), 'Head': (0,0,10)},
 'aim': {'UpperArm.L': (0,-70,0), 'LowerArm.L': (0,-30,0), 'UpperArm.R': (0,70,0), 'LowerArm.R': (0,30,0), 'Spine': (0,0,10)},
}
for n, d in poses.items():
    pose(d); shot(n, 'front'); shot(n, 'side')
pose({})
