"""Boundary fence segment (3 m along X, front -Y)."""
exec(open('/Users/lasse/Desktop/Games/oneshot/art-src/blender/props_a.py').read().split("for fn, nm in")[0])
new('fence')
objs = []
for x in (-1.5, 1.5):
    objs.append(cyl('post', r=0.14, r2=0.12, h=1.35, loc=(x, 0, 0), seg=7, m=M['bark'], uv=1.5))
    objs.append(cyl('cap', r=0.17, h=0.08, loc=(x, 0, 1.35), seg=7, m=M['wood_dark'], uv=1.0))
    objs.append(torus('rope', R=0.145, r=0.03, loc=(x, 0, 1.0), m=M['rope'], seg=10, rseg=4))
for z in (0.55, 1.0):
    objs.append(box('rail', (3.0, 0.1, 0.13), loc=(0, 0, z), m=M['planks'], uv=1.5, bottom=False))
for x in (-0.75, 0.0, 0.75):
    objs.append(box('picket', (0.2, 0.06, 0.95), loc=(x, 0.04, 0.12), m=M['planks'], uv=1.0))
o = join(objs, 'fence')
print('fence', export('fence', [o]))
