#!/bin/zsh
# Authors the guy's keyed clips (assets/anim3d/*.anim3d.json) with `gameengine anim3d`. Rerunnable: it recreates each clip.
cd "$(dirname "$0")/.."
R=assets/anim3d/guy.rig3d.json; A=assets/anim3d
g(){ gameengine anim3d "$@" >/dev/null || { echo "FAILED: $*"; exit 1; } }

# ---- idle: breathing, tail sway, a glance (60f loop)
F=$A/guy_idle.anim3d.json; rm -f $F; g new $F --rig $R --length 60 --fps 30
g pose $F --frame 0  --set hips.my=0,spine.pitch=0,chest.pitch=0,head.yaw=0,head.pitch=0,upperArm.L.roll=8,upperArm.R.roll=8
g pose $F --frame 30 --set hips.my=-0.015,spine.pitch=2,chest.pitch=3,head.yaw=10,head.pitch=-3,upperArm.L.roll=10,upperArm.R.roll=10 --ease inOutSine
g pose $F --frame 60 --set hips.my=0,spine.pitch=0,chest.pitch=0,head.yaw=0,head.pitch=0,upperArm.L.roll=8,upperArm.R.roll=8 --ease inOutSine

# ---- run: 24f loop, bouncy, tail streams behind (right side = left side shifted half a cycle)
F=$A/guy_run.anim3d.json; rm -f $F; g new $F --rig $R --length 24 --fps 30
g pose $F --frame 0  --set hips.my=-0.05,spine.pitch=0,chest.pitch=0,head.pitch=0,upperLeg.L.pitch=55,lowerLeg.L.bend=25,foot.L.pitch=-10,upperArm.L.pitch=-40,lowerArm.L.bend=50
g pose $F --frame 6  --set hips.my=0.03,upperLeg.L.pitch=0,lowerLeg.L.bend=70,foot.L.pitch=20,upperArm.L.pitch=0,lowerArm.L.bend=40 --ease outSine
g pose $F --frame 12 --set hips.my=-0.05,upperLeg.L.pitch=-55,lowerLeg.L.bend=12,foot.L.pitch=15,upperArm.L.pitch=40,lowerArm.L.bend=25 --ease inOutSine
g pose $F --frame 18 --set hips.my=0.03,upperLeg.L.pitch=-5,lowerLeg.L.bend=90,foot.L.pitch=-15,upperArm.L.pitch=0,lowerArm.L.bend=40 --ease inOutSine
g pose $F --frame 24 --set hips.my=-0.05,upperLeg.L.pitch=55,lowerLeg.L.bend=25,foot.L.pitch=-10,upperArm.L.pitch=-40,lowerArm.L.bend=50 --ease inOutSine
g mirror $F --from L --offset 12
g loop-seam $F

# ---- jump: crouch, launch, hang with limbs spread (not looping)
F=$A/guy_jump.anim3d.json; rm -f $F; g new $F --rig $R --length 36 --fps 30 --no-loop
g pose $F --frame 0  --set hips.my=0,upperLeg.L.pitch=0,lowerLeg.L.bend=0,upperArm.L.pitch=0,spine.pitch=0
g pose $F --frame 6  --set hips.my=-0.14,spine.pitch=0,upperLeg.L.pitch=40,lowerLeg.L.bend=75,upperArm.L.pitch=30 --ease outQuad
g pose $F --frame 14 --set hips.my=0.12,spine.pitch=0,upperLeg.L.pitch=-20,lowerLeg.L.bend=10,upperArm.L.pitch=-140,lowerArm.L.bend=10 --ease outBack
g pose $F --frame 26 --set hips.my=0.1,upperLeg.L.pitch=20,lowerLeg.L.bend=50,upperArm.L.pitch=-100 --ease inOutSine
g pose $F --frame 36 --set hips.my=-0.08,spine.pitch=0,upperLeg.L.pitch=30,lowerLeg.L.bend=60,upperArm.L.pitch=-20 --ease inQuad
g mirror $F --from L

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
echo "clips ok"; for c in guy_idle guy_run guy_jump guy_aim guy_fire guy_death; do gameengine anim3d lint $A/$c.anim3d.json 2>&1 | tail -4; done
