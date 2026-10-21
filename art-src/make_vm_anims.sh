#!/bin/zsh
# First-person viewmodel clips (assets/anim3d/vm_*.anim3d.json) on the Meshy slingshot rig. Metres along the model's axes:
# mz > 0 = toward the player, my > 0 = up, mx > 0 = right.
cd "$(dirname "$0")/.."
R=assets/anim3d/viewmodel.rig3d.json; A=assets/anim3d
g(){ gameengine anim3d "$@" 2>&1 | grep -v "older than" | grep -iE "^gameengine anim3d|refused|error" && { echo "FAILED: $*"; exit 1; }; return 0; }
mk(){ F=$A/$1.anim3d.json; rm -f $F; g new $F --rig $R --length $2 --fps 30 ${3:-}; }

mk vm_idle 90
g pose $F --frame 0  --set Root.my=0,Root.mx=0,Root.rz=0,Hand.R.rz=0
g pose $F --frame 45 --set Root.my=0.006,Root.mx=0.003,Root.rz=0.4,Hand.R.rz=1.5 --ease inOutSine
g pose $F --frame 90 --set Root.my=0,Root.mx=0,Root.rz=0,Hand.R.rz=0 --ease inOutSine

mk vm_walk 32
g pose $F --frame 0  --set Root.my=0,Root.mx=-0.012,Root.rz=-1.2,Root.mz=0
g pose $F --frame 8  --set Root.my=0.016,Root.mx=0,Root.rz=0,Root.mz=0.004 --ease outSine
g pose $F --frame 16 --set Root.my=0,Root.mx=0.012,Root.rz=1.2,Root.mz=0 --ease inSine
g pose $F --frame 24 --set Root.my=0.016,Root.mx=0,Root.rz=0,Root.mz=0.004 --ease outSine
g pose $F --frame 32 --set Root.my=0,Root.mx=-0.012,Root.rz=-1.2,Root.mz=0 --ease inSine

mk vm_fire 18 --no-loop
g pose $F --frame 0 --set Pouch.mz=0.0,Hand.R.mz=0,Sling.rx=0,Root.mz=0,Root.my=0
g pose $F --frame 1 --set Pouch.mz=0.075,Hand.R.mz=0.075,Hand.R.my=-0.01 --ease outQuad
g pose $F --frame 3 --set Pouch.mz=-0.05,Hand.R.mz=-0.03,Hand.R.my=0,Sling.rx=-7,Root.mz=0.03,Root.my=0.015 --ease outBack
g pose $F --frame 8 --set Pouch.mz=0.0,Hand.R.mz=0,Sling.rx=2,Root.mz=0.008,Root.my=0.004 --ease outQuad
g pose $F --frame 18 --set Pouch.mz=0.0,Hand.R.mz=0,Sling.rx=0,Root.mz=0,Root.my=0 --ease inOutSine

mk vm_reload 26 --no-loop
g pose $F --frame 0  --set Hand.R.my=0,Hand.R.mx=0,Hand.R.mz=0,Pouch.mz=0,Root.my=0
g pose $F --frame 8  --set Hand.R.my=-0.05,Hand.R.mx=0.03,Hand.R.mz=0.02,Root.my=-0.01 --ease outQuad
g pose $F --frame 16 --set Hand.R.my=0.01,Hand.R.mx=0,Hand.R.mz=0.04,Pouch.mz=0.03,Root.my=0.006 --ease outBack
g pose $F --frame 26 --set Hand.R.my=0,Hand.R.mx=0,Hand.R.mz=0,Pouch.mz=0,Root.my=0 --ease inOutSine

mk vm_jump 24 --no-loop
g pose $F --frame 0  --set Root.my=0,Root.mz=0,Root.rx=0
g pose $F --frame 4  --set Root.my=-0.03,Root.mz=0.01,Root.rx=3 --ease outQuad
g pose $F --frame 10 --set Root.my=0.035,Root.mz=-0.01,Root.rx=-3 --ease outBack
g pose $F --frame 24 --set Root.my=0,Root.mz=0,Root.rx=0 --ease inOutSine

mk vm_super 36 --no-loop
g pose $F --frame 0  --set Root.my=0,Root.mz=0,Root.rx=0
g pose $F --frame 5  --set Root.my=-0.07,Root.mz=0.03,Root.rx=7 --ease outQuad
g pose $F --frame 12 --set Root.my=0.09,Root.mz=-0.03,Root.rx=-8 --ease outBack
g pose $F --frame 36 --set Root.my=0,Root.mz=0,Root.rx=0 --ease inOutSine

mk vm_dead 20 --no-loop
g pose $F --frame 0  --set Root.my=0,Root.rx=0
g pose $F --frame 20 --set Root.my=-0.4,Root.rx=25 --ease inQuad
echo "viewmodel clips ok"
