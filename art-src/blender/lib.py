"""Shared helpers for the OneShot Blender asset scripts (run inside Blender through the MCP).

Every asset script does `exec(open(LIB).read())`, builds objects with the helpers below,
then calls export(name). Units are metres, Y up on export (the glTF exporter converts).
"""
import bpy, bmesh, math, random, os
from mathutils import Vector, Euler, Matrix

ROOT = '/Users/lasse/Desktop/Games/oneshot'
TEX = ROOT + '/assets/textures/'
OUT = ROOT + '/assets/models/'
os.makedirs(OUT, exist_ok=True)

_mats = {}


def reset():
    """Empty the scene without touching preferences (read_factory_settings would drop the MCP addon)."""
    if bpy.context.object and bpy.context.object.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.images, bpy.data.curves, bpy.data.armatures):
        for d in list(coll):
            coll.remove(d)
    _mats.clear()
    bpy.context.scene.unit_settings.system = 'METRIC'


def srgb(h):
    """'#rrggbb' -> linear rgba tuple."""
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [(x / 12.92) if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return (lin[0], lin[1], lin[2], 1)


def mat(name, color='#ffffff', tex=None, rough=0.75, emit=None, emit_strength=2.0, tint=None):
    """A Principled material. tex = file name in assets/textures (embedded in the GLB)."""
    if name in _mats:
        return _mats[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
    bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Base Color'].default_value = srgb(color)
    if tex:
        img = bpy.data.images.load(TEX + tex, check_existing=True)
        img.file_format = 'JPEG'  # opaque tiles ship as JPEG inside the GLB
        t = nt.nodes.new('ShaderNodeTexImage')
        t.image = img
        if tint:
            mix = nt.nodes.new('ShaderNodeMix')
            mix.data_type = 'RGBA'
            mix.blend_type = 'MULTIPLY'
            mix.inputs['Factor'].default_value = 1.0
            mix.inputs['B'].default_value = srgb(tint)
            nt.links.new(t.outputs['Color'], mix.inputs['A'])
            nt.links.new(mix.outputs['Result'], bsdf.inputs['Base Color'])
        else:
            nt.links.new(t.outputs['Color'], bsdf.inputs['Base Color'])
    if emit:
        bsdf.inputs['Emission Color'].default_value = srgb(emit)
        bsdf.inputs['Emission Strength'].default_value = emit_strength
    _mats[name] = m
    return m


def _finish(o, m, name, uv, flat):
    o.name = name
    if m is not None:
        o.data.materials.clear()
        o.data.materials.append(m)
    bpy.context.view_layer.objects.active = o
    for ob in bpy.context.selected_objects:
        ob.select_set(False)
    o.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    if flat:
        bpy.ops.object.shade_flat()
    else:
        bpy.ops.object.shade_smooth()
    if uv:
        box_uv(o, uv)
    return o


def box_uv(o, size=2.0):
    """Cube-project UVs so a tile covers `size` metres (consistent texel density)."""
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.cube_project(cube_size=size, correct_aspect=True, scale_to_bounds=False)
    bpy.ops.object.mode_set(mode='OBJECT')


def cyl(name, r=0.5, h=1.0, loc=(0, 0, 0), rot=(0, 0, 0), m=None, seg=12, r2=None, uv=2.0, flat=False, cap=True):
    """Cylinder/cone frustum standing on z=0 going up (Blender Z up). r2 = top radius."""
    bpy.ops.mesh.primitive_cone_add(vertices=seg, radius1=r, radius2=r if r2 is None else r2, depth=h,
                                    end_fill_type='NGON' if cap else 'NOTHING', location=(0, 0, 0))
    o = bpy.context.active_object
    o.data.transform(Matrix.Translation((0, 0, h / 2)))
    o.location = loc
    o.rotation_euler = rot
    return _finish(o, m, name, uv, flat)


def box(name, size=(1, 1, 1), loc=(0, 0, 0), rot=(0, 0, 0), m=None, uv=2.0, bottom=True):
    """Box with its base centre at loc (z up)."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0))
    o = bpy.context.active_object
    o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    o.data.transform(Matrix.Translation((0, 0, size[2] / 2 if bottom else 0)))
    o.location = loc
    o.rotation_euler = rot
    return _finish(o, m, name, uv, True)


def ball(name, r=1.0, loc=(0, 0, 0), m=None, sub=2, scale=(1, 1, 1), uv=2.0, flat=True, jitter=0.0, seed=1, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub, radius=r, location=loc)
    o = bpy.context.active_object
    o.scale = scale
    o.rotation_euler = rot
    if jitter:
        rnd = random.Random(seed)
        for v in o.data.vertices:
            v.co += Vector((rnd.uniform(-1, 1), rnd.uniform(-1, 1), rnd.uniform(-1, 1))) * jitter * r
    return _finish(o, m, name, uv, flat)


def torus(name, R=1.0, r=0.1, loc=(0, 0, 0), rot=(0, 0, 0), m=None, seg=16, rseg=6):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=seg, minor_segments=rseg, location=loc,
                                     rotation=rot)
    o = bpy.context.active_object
    return _finish(o, m, name, 1.0, False)


def mesh_from(name, verts, faces, m=None, uv=2.0, flat=True, loc=(0, 0, 0)):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    o.location = loc
    return _finish(o, m, name, uv, flat)


def bevel(o, w=0.03, seg=1):
    bpy.context.view_layer.objects.active = o
    md = o.modifiers.new('bev', 'BEVEL')
    md.width = w
    md.segments = seg
    md.limit_method = 'ANGLE'
    bpy.ops.object.modifier_apply(modifier=md.name)


def displace_noise(o, strength=0.1, scale=1.0, seed=0):
    rnd = random.Random(seed)
    off = Vector((rnd.uniform(0, 99), rnd.uniform(0, 99), rnd.uniform(0, 99)))
    from mathutils import noise
    for v in o.data.vertices:
        n = noise.noise(v.co * scale + off)
        v.co += v.normal * n * strength


def parent_to(children, parent):
    for c in children:
        c.parent = parent


def join(objs, name):
    """Join objects that share one material (and keep several materials if they differ)."""
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    o = bpy.context.active_object
    o.name = name
    return o


def vcol(o, color):
    """Constant vertex colour (multiplies the material in the engine)."""
    me = o.data
    attr = me.color_attributes.new('Col', 'BYTE_COLOR', 'CORNER')
    c = srgb(color)
    for d in attr.data:
        d.color = c


def tri_count(objs=None):
    n = 0
    dg = bpy.context.evaluated_depsgraph_get()
    for o in (objs or [x for x in bpy.context.scene.objects if x.type == 'MESH']):
        e = o.evaluated_get(dg)
        me = e.to_mesh()
        n += sum(len(p.vertices) - 2 for p in me.polygons)
        e.to_mesh_clear()
    return n


def export(name, objs=None):
    """Export meshes (all by default) to assets/models/<name>.glb; returns the triangle count."""
    bpy.ops.object.select_all(action='DESELECT')
    for o in (objs or [x for x in bpy.context.scene.objects if x.type == 'MESH']):
        o.select_set(True)
    path = OUT + name + '.glb'
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_yup=True,
                              export_apply=True, export_image_format='AUTO', export_jpeg_quality=85, export_materials='EXPORT',
                              export_cameras=False, export_lights=False, export_extras=False,
                              export_vertex_color='ACTIVE', export_all_vertex_colors=False)
    return tri_count()


def tube(name, pts, r0, r1=None, m=None, seg=8, uv=1.0, flat=False, cap=True):
    """A tapered tube along a polyline (list of (x, y, z)); radius r0 at the start, r1 at the end."""
    r1 = r0 if r1 is None else r1
    P = [Vector(p) for p in pts]
    verts, faces = [], []
    ref = Vector((0, 0, 1))
    for i, p in enumerate(P):
        t = (P[min(i + 1, len(P) - 1)] - P[max(i - 1, 0)]).normalized()
        up = ref if abs(t.dot(ref)) < 0.95 else Vector((1, 0, 0))
        n = t.cross(up).normalized()
        b = t.cross(n).normalized()
        r = r0 + (r1 - r0) * i / max(1, len(P) - 1)
        for s in range(seg):
            a = s / seg * math.tau
            verts.append(p + (n * math.cos(a) + b * math.sin(a)) * r)
    for i in range(len(P) - 1):
        for s in range(seg):
            a, c = i * seg + s, i * seg + (s + 1) % seg
            faces.append((a, c, c + seg, a + seg))
    if cap:
        faces.append(tuple(range(seg))[::-1])
        faces.append(tuple(range((len(P) - 1) * seg, len(P) * seg)))
    return mesh_from(name, [tuple(v) for v in verts], faces, m=m, uv=uv, flat=flat)


def card_mat(name, tex, rough=0.8):
    """Alpha-cutout material: the engine reads alpha_mode/double_sided from the model's .gmeta (see set_cutout)."""
    if name in _mats:
        return _mats[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
    bsdf.inputs['Roughness'].default_value = rough
    t = nt.nodes.new('ShaderNodeTexImage')
    t.image = bpy.data.images.load(TEX + tex, check_existing=True)
    nt.links.new(t.outputs['Color'], bsdf.inputs['Base Color'])
    nt.links.new(t.outputs['Alpha'], bsdf.inputs['Alpha'])
    _mats[name] = m
    return m


def quad(name, center, normal, w, h, roll=0.0, m=None, color='#ffffff', up=(0, 0, 1)):
    """A w x h card at `center` facing `normal`, rolled about its normal; UVs fill 0..1; vertex colour `color`."""
    n = Vector(normal).normalized()
    u = Vector(up)
    if abs(n.dot(u)) > 0.95:
        u = Vector((1, 0, 0))
    r = n.cross(u).normalized()
    t = r.cross(n).normalized()
    c, s = math.cos(roll), math.sin(roll)
    r, t = r * c + t * s, t * c - r * s
    ctr = Vector(center)
    vs = [ctr - r * w / 2 - t * h / 2, ctr + r * w / 2 - t * h / 2, ctr + r * w / 2 + t * h / 2, ctr - r * w / 2 + t * h / 2]
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in vs], [], [(0, 1, 2, 3)])
    uv = me.uv_layers.new(name='UVMap')
    for i, p in enumerate([(0, 0), (1, 0), (1, 1), (0, 1)]):
        uv.data[i].uv = p
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    me.materials.append(m)
    vcol(o, color)
    return o


def set_cutout(glb_name, names):
    """Mark materials of OUT/<glb_name>.glb as alpha-masked and double sided in its .gmeta."""
    p = OUT + glb_name + '.glb.gmeta'
    s = open(p).read() if os.path.exists(p) else ''
    if 'guid' not in s:  # the engine writes the sidecar on its own a moment later; never leave one without an id
        import uuid
        s = f'guid = "{uuid.uuid4()}"\nimporter = "mesh"\n' + s
    for n in names:
        if f'[settings.materials.{n}]' not in s:
            if '[settings]' not in s:
                s = s.rstrip('\n') + '\n\n[settings]\n'
            s = s.rstrip('\n') + f'\n\n[settings.materials.{n}]\nalpha_mode = "mask"\nalpha_cutoff = 0.45\ndouble_sided = true\n'
    open(p, 'w').write(s)
