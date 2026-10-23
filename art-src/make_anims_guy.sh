#!/bin/zsh
# Authors the guy's keyed clips (assets/anim3d/*.anim3d.json) with `gameengine anim3d`. Rerunnable: it recreates each clip.
# idle, run, fall and land are the reference humanoid's base clips (skill animation-3d-agent, references/humanoid.md) ported to this
# rig: the profile is the guy's, the metres are scaled by K = his leg (0.626 m, hip joint to ankle) / the reference's 0.84 m.
# aim, fire and death are the game's own, keyed on the same standing stance so the cross-fades stay put.
cd "$(dirname "$0")/.."
R=assets/anim3d/guy.rig3d.json; A=assets/anim3d
REF=.claude/skills/animation-3d-agent/references/humanoid
K=0.745
g(){ gameengine anim3d "$@" >/dev/null || { echo "FAILED: $*"; exit 1; } }

# port <name> <reference clip> <channels to scale by K, space separated>
port(){
  local F=$A/guy_$1.anim3d.json; rm -f $F $F.gmeta
  python3 - "$REF/$2.anim3d.json" "$F" "$K" <<'PY'
import json, sys
src, dst, k = sys.argv[1], sys.argv[2], float(sys.argv[3])
d = json.load(open(src))
d['rig'] = 'guy.rig3d.json'
if 'speed' in d:
    d['speed'] = round(d['speed'] * k, 4)
json.dump(d, open(dst, 'w'), indent=1)
PY
  g info $F
  for c in ${=3}; do g scale $F --channel $c --by $K; done
}
port idle idle "hips.my hips.mx"
port run run "hips.my"
# the guy's toes are longer than the reference's: a faster ground speed and a shorter toe plant keep the planted toe from sliding
python3 - $A/guy_run.anim3d.json <<'PY'
import json, sys
p = sys.argv[1]
d = json.load(open(p))
d['speed'] = 2.5
d['planted']['toe.L'] = [[2, 6]]
d['planted']['toe.R'] = [[14, 18]]
json.dump(d, open(p, 'w'), indent=1)
PY
g info $A/guy_run.anim3d.json
port fall fall "hips.my"
port land land "hips.my"
rm -f $A/guy_jump.anim3d.json $A/guy_jump.anim3d.json.gmeta

# ---- aim: both arms forward holding the sling out in front (loops gently)
F=$A/guy_aim.anim3d.json; rm -f $F; g new $F --rig $R --length 40 --fps 30
g pose $F --frame 0  --set spine.pitch=-2,head.pitch=-4,upperArm.L.pitch=82,lowerArm.L.bend=8,upperArm.R.pitch=72,upperArm.R.yaw=-12,lowerArm.R.bend=62,hips.my=0
g pose $F --frame 20 --set spine.pitch=-1,head.pitch=-3,upperArm.L.pitch=84,lowerArm.L.bend=10,upperArm.R.pitch=74,upperArm.R.yaw=-12,lowerArm.R.bend=66,hips.my=-0.008 --ease inOutSine
g pose $F --frame 40 --set spine.pitch=-2,head.pitch=-4,upperArm.L.pitch=82,lowerArm.L.bend=8,upperArm.R.pitch=72,upperArm.R.yaw=-12,lowerArm.R.bend=62,hips.my=0 --ease inOutSine

# ---- fire: release snap and recoil (no loop)
F=$A/guy_fire.anim3d.json; rm -f $F; g new $F --rig $R --length 18 --fps 30 --no-loop
g pose $F --frame 0  --set spine.pitch=-2,head.pitch=-4,upperArm.L.pitch=82,lowerArm.L.bend=8,upperArm.R.pitch=72,upperArm.R.yaw=-12,lowerArm.R.bend=62
g pose $F --frame 3  --set spine.pitch=8,head.pitch=6,upperArm.L.pitch=70,lowerArm.L.bend=4,upperArm.R.pitch=60,upperArm.R.yaw=-14,lowerArm.R.bend=30,hips.my=-0.03 --ease outBack
g pose $F --frame 18 --set spine.pitch=-2,head.pitch=-4,upperArm.L.pitch=82,lowerArm.L.bend=8,upperArm.R.pitch=72,upperArm.R.yaw=-12,lowerArm.R.bend=62,hips.my=0 --ease outQuad

# ---- death: comic spin-and-flop (no loop)
F=$A/guy_death.anim3d.json; rm -f $F; g new $F --rig $R --length 40 --fps 30 --no-loop
g pose $F --frame 0  --set hips.my=0,hips.yaw=0,spine.pitch=0,upperArm.L.roll=8
g pose $F --frame 8  --set hips.my=0.15,hips.yaw=140,spine.pitch=-18,upperArm.L.roll=100,lowerArm.L.bend=10,head.pitch=-25 --ease outQuad
g pose $F --frame 22 --set hips.my=-0.35,hips.yaw=320,spine.pitch=55,upperArm.L.roll=70,lowerArm.L.bend=40,upperLeg.L.pitch=60,lowerLeg.L.bend=40,head.pitch=25 --ease inQuad
g pose $F --frame 40 --set hips.my=-0.38,hips.yaw=360,spine.pitch=70,upperArm.L.roll=60,upperLeg.L.pitch=75,lowerLeg.L.bend=60,head.pitch=30 --ease outBounce
g mirror $F --from L

# ---- the standing stance under aim and fire (the reference idle's knees and feet), with both feet planted
STANCE=hips.my=-0.009,upperLeg.L.pitch=9.7,lowerLeg.L.bend=19.4,foot.L.pitch=9.7,upperLeg.R.pitch=9.7,lowerLeg.R.bend=19.4,foot.R.pitch=9.7,chest.pitch=5,neck.pitch=-4
typeset -A LEN; LEN=(aim 40 fire 18)
for c in aim fire; do
  F=$A/guy_$c.anim3d.json
  g pose $F --frame 0 --set $STANCE
  g pose $F --frame $LEN[$c] --set $STANCE
  python3 - $F <<'PY'
import json, sys
p = sys.argv[1]
d = json.load(open(p))
d['footLock'] = True
d['planted'] = {'foot.L': [[0, d['length']]], 'foot.R': [[0, d['length']]]}
json.dump(d, open(p, 'w'), indent=1)
PY
  g info $F
done
# death: the body spins and flops, so nothing is planted
F=$A/guy_death.anim3d.json
python3 - $F <<'PY'
import json, sys
p = sys.argv[1]
d = json.load(open(p))
d['planted'] = {c: [] for c in ('foot.L', 'foot.R', 'toe.L', 'toe.R')}
json.dump(d, open(p, 'w'), indent=1)
PY
g info $F
echo "clips ok"; for c in guy_idle guy_run guy_fall guy_land guy_aim guy_fire guy_death; do gameengine anim3d lint $A/$c.anim3d.json 2>&1 | tail -4; done
