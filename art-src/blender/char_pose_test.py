"""Poses CritterRig (already built in the open scene) and renders front/side contact sheets to the scratchpad."""
import bpy, math
SP='/private/tmp/claude-501/-Users-lasse-Desktop-Games-oneshot/bcc0e7c7-6a1b-434c-a862-cacad6dfa2ca/scratchpad/'
arm = bpy.data.objects['CritterRig']
sc = bpy.context.scene
sc.render.engine = 'BLENDER_WORKBENCH'
sc.display.shading.light = 'FLAT'; sc.display.shading.color_type = 'TEXTURE'
sc.render.resolution_x = 500; sc.render.resolution_y = 500
for o in list(bpy.data.objects):
    if o.type == 'CAMERA': bpy.data.objects.remove(o, do_unlink=True)
cd = bpy.data.cameras.new('c'); cd.type = 'ORTHO'; cd.ortho_scale = 2.4
cam = bpy.data.objects.new('c', cd); bpy.context.collection.objects.link(cam); sc.camera = cam
def pose(d):
    for pb in arm.pose.bones:
        pb.rotation_mode = 'XYZ'; pb.rotation_euler = (0, 0, 0); pb.location = (0, 0, 0)
    for n, e in d.items():
        arm.pose.bones[n].rotation_euler = tuple(math.radians(a) for a in e)
    bpy.context.view_layer.update()
def shot(name, view):
    cam.location, cam.rotation_euler = {'front': ((0, -6, 0.9), (math.pi/2, 0, 0)), 'side': ((6, 0, 0.9), (math.pi/2, 0, math.pi/2))}[view]
    sc.render.filepath = SP + f'rig_{name}_{view}.png'
    bpy.ops.render.render(write_still=True)
poses = {
 'rest': {},
 'walkA': {'UpperLeg.L': (35,0,0), 'LowerLeg.L': (-25,0,0), 'UpperLeg.R': (-35,0,0), 'UpperArm.L': (-30,0,0), 'UpperArm.R': (30,0,0), 'Tail_02': (0,0,15), 'Head': (0,15,0)},
 'aim': {'UpperArm.L': (-80,0,-20), 'LowerArm.L': (-30,0,0), 'UpperArm.R': (-70,0,20), 'Head': (-10,0,0), 'Spine': (0,0,10), 'Tail_01': (20,0,0)},
}
for n, d in poses.items():
    pose(d); shot(n, 'front'); shot(n, 'side')
pose({})
