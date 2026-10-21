exec(open('/Users/lasse/Desktop/Games/oneshot/art-src/blender/lib.py').read())
reset()
bm = card_mat('beam', 'beam.png')
qs = [quad('b1', (0, 0, 0.5), (0, -1, 0), 1.0, 1.0, 0.0, bm, '#ffffff', up=(0, 0, 1)),
      quad('b2', (0, 0, 0.5), (1, 0, 0), 1.0, 1.0, 0.0, bm, '#ffffff', up=(0, 0, 1))]
o = join(qs, 'beam')
print('beam', export('beam', [o]))
set_cutout('beam', ['beam'])
