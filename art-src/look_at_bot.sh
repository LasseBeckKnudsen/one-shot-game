#!/bin/zsh
# usage: art-src/look_at_bot.sh <entity id> <out.png> [dist] [side]  -> teleports the player in front of the bot and takes a shot
E=$1; OUT=$2; D=${3:-5}; SIDE=${4:-1.2}
read X Z <<< $(gameengine world get $E LocalTransform --json | python3 -c "import sys,json; v=json.load(sys.stdin)['entity']['components']['LocalTransform']['position']; print(v[0],v[2])")
read PX PZ YAW <<< $(python3 -c "
import math
x,z=$X,$Z
px,pz=x-$SIDE,z+$D
print(px,pz,math.atan2(-(x-px),-(z-pz)))")
gameengine cheat run player.teleport x=$PX z=$PZ yaw=$YAW >/dev/null
gameengine step 3 >/dev/null
gameengine screenshot $OUT --camera PlayerCam --width 1280 --height 720 | tail -1
