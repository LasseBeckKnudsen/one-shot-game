"""scenes/calib.scene.json: one static guy in the aim pose (Animator params forced) with the sling attached, for calibrating the grip.
usage: python3 art-src/gen_calib.py <pos x y z> <rot qx qy qz qw> <scale> [state: aim|idle|fire]"""
import json, math, sys
pos = [float(v) for v in sys.argv[1:4]]
rot = [float(v) for v in sys.argv[4:8]]
scale = float(sys.argv[8])
state = sys.argv[9] if len(sys.argv) > 9 else 'aim'
view = sys.argv[10] if len(sys.argv) > 10 else 'side'
CAMP, CAMY = {'side': ([4.0, 1.2, 0.2], math.pi / 2), 'front': ([0.0, 1.2, 4.0], 0.0), 'top': ([0.3, 4.0, 0.3], 0.0)}[view]
params = {'aim': [0, 1, 0, 0], 'idle': [0, 0, 0, 0], 'run': [1, 0, 0, 0]}[state] + [0] * 12
def q(yaw, pitch):
    sy, cy, sx, cx = math.sin(yaw / 2), math.cos(yaw / 2), math.sin(pitch / 2), math.cos(pitch / 2)
    return [round(v, 5) for v in (cy * sx, sy * cx, -sy * sx, cy * cx)]
ents = [
    {'name': 'Cam', 'id': 'cam', 'Camera': {'projection': 'Perspective', 'fovY': 0.55, 'near': 0.05, 'far': 100, 'clearColor': '#8fb7e6ff'}, 'LocalTransform': {'position': CAMP, 'rotation': q(CAMY, -0.05)}},
    {'name': 'Sun', 'id': 'sun', 'Light': {'color': '#fff0d0', 'intensity': 3, 'castShadows': False}, 'LocalTransform': {'rotation': q(0.8, -0.7)}},
    {'name': 'Env', 'id': 'env', 'Environment': {'ambient': '#9aa7b8', 'intensity': 1.0}, 'LocalTransform': {}},
    {'name': 'Guy', 'id': 'guy', 'LocalTransform': {'position': [0, 0, 0]}, 'MeshRenderer': {'mesh': 'models/guy_rig.glb'},
     'Animator': {'controller': 'anim/guy.animctrl.json', 'params': params},
     'children': [{'name': 'Sling', 'id': 'sling', 'BoneAttach': {'rig': '@guy', 'joint': 'Hand.L', 'space': 'Joint'},
                   'LocalTransform': {'position': pos, 'rotation': rot, 'scale': [scale] * 3}, 'MeshRenderer': {'mesh': 'models/bot_sling.glb'}}]},
]
json.dump({'$schemaVersion': 2, 'id': 'calib', 'entities': ents}, open('scenes/calib.scene.json', 'w'), indent=1)
