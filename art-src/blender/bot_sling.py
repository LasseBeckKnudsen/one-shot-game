"""A small Y slingshot (handle along +Z in Blender = +Y in the engine, fork up, bands toward -Y... pouch side = -Y) for the bots' hands."""
exec(open('/Users/lasse/Desktop/Games/oneshot/art-src/blender/lib.py').read())
reset()
wood = mat('bs_wood', color='#8f5424', rough=0.6)
wood_d = mat('bs_wood_d', color='#5e3416', rough=0.6)
band = mat('bs_band', color='#c79a5e', rough=0.6)
leather = mat('bs_leather', color='#74401f', rough=0.7)
stone = mat('bs_stone', color='#ffcf8a', emit='#ff9a30', emit_strength=0.8, rough=0.3)
H = [(0, 0, -0.07), (0, 0, 0.02), (0, 0, 0.1)]
Lp = [(0, 0, 0.1), (-0.035, 0, 0.16), (-0.06, 0, 0.22)]
Rp = [(0, 0, 0.1), (0.035, 0, 0.16), (0.06, 0, 0.22)]
objs = [tube('handle', H, 0.018, 0.02, m=wood, seg=8, uv=0),
        tube('pl', Lp, 0.02, 0.016, m=wood, seg=8, uv=0), tube('pr', Rp, 0.02, 0.016, m=wood, seg=8, uv=0),
        ball('kl', r=0.02, loc=Lp[-1], m=wood_d, sub=1, flat=False, uv=0), ball('kr', r=0.02, loc=Rp[-1], m=wood_d, sub=1, flat=False, uv=0),
        tube('bl', [Lp[-1], (-0.01, 0.12, 0.2)], 0.006, 0.006, m=band, seg=5, uv=0),
        tube('br', [Rp[-1], (0.01, 0.12, 0.2)], 0.006, 0.006, m=band, seg=5, uv=0),
        ball('pouch', r=0.03, loc=(0, 0.13, 0.2), m=leather, sub=1, scale=(1.2, 0.6, 0.8), flat=False, uv=0),
        ball('st', r=0.025, loc=(0, 0.145, 0.2), m=stone, sub=2, flat=False, uv=0)]
o = join(objs, 'bot_sling')
print('bot_sling', export('bot_sling', [o]))
