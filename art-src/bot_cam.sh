#!/bin/zsh
# NOTE: the session must run in real time (no `step`: a stepped session pauses and the camera rigs hold still)
# usage: art-src/bot_cam.sh <entity id> <out.png> [dist] [height] [side] [fov]  -> a throwaway camera looks at the entity
ge(){ gameengine "$@" ${SESS:+--session $SESS}; }  # SESS=<pid> pins the session
E=$1; OUT=$2; D=${3:-3}; H=${4:-1.3}; SIDE=${5:-1.2}; FOV=${6:-0.7}
read X Z <<< $(ge world get $E LocalTransform --json | python3 -c "import sys,json; v=json.load(sys.stdin)['entity']['components']['LocalTransform']['position']; print(v[0],v[2])")
JSON=$(python3 -c "
import math,json
x,z=$X,$Z
cx,cz=x+$SIDE,z+$D
yaw=math.atan2(-(x-cx),-(z-cz)); dist=math.hypot(x-cx,z-cz); pitch=-math.atan2($H-1.0,dist)
sy,cy,sx,cx_=math.sin(yaw/2),math.cos(yaw/2),math.sin(pitch/2),math.cos(pitch/2)
q=[cy*sx,sy*cx_,-sy*sx,cy*cx_]
print(json.dumps({'Camera':{'projection':'Perspective','fovY':$FOV,'near':0.05,'far':300,'order':9,'clearColor':'#a8d4ffff'},'LocalTransform':{'position':[cx,$H,cz],'rotation':q}}))")
CAM=$(ge world spawn "$JSON" --json | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('entity') or d.get('id'))")
sleep 0.3
ge screenshot $OUT --camera $CAM --width 900 --height 700 | tail -1
ge world despawn $CAM >/dev/null 2>&1
