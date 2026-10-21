#!/bin/zsh
# NOTE: the session must run in real time (no `step`: a stepped session pauses and the camera rigs hold still)
# usage: art-src/shots2.sh <outdir> <tag> -> five in-game views for the judges: spawn, plaza, huts, treehouse bridges (climbed up), a bot close-up
ge(){ gameengine "$@" ${SESS:+--session $SESS}; }  # SESS=<pid> pins the session
out=$1; tag=$2; mkdir -p $out
shot(){ ge cheat run player.teleport x=$1 z=$2 yaw=$3 >/dev/null 2>&1; sleep 0.6; ge screenshot $out/${tag}_$4.png --camera PlayerCam --width 1600 --height 900 >/dev/null 2>&1; }
ge cheat run flow.play >/dev/null 2>&1; sleep 1.5
ge screenshot $out/${tag}_spawn.png --camera PlayerCam --width 1600 --height 900 >/dev/null 2>&1
shot 0 4 0.0 plaza
shot -9 -2 0.9 huts
PID=$(ge world query Player --limit 1 --json | python3 -c "import sys,json; print(json.load(sys.stdin)['entities'][0]['id'])")
ge cheat run player.teleport x=-24 z=-10.5 yaw=-1.1 >/dev/null 2>&1; ge world set $PID LocalTransform '{"position":[-24,7.0,-10.5]}' >/dev/null 2>&1; sleep 0.6
ge screenshot $out/${tag}_deck.png --camera PlayerCam --width 1600 --height 900 >/dev/null 2>&1
B=$(ge world query Critter --limit 1 --json | python3 -c "import sys,json; print(json.load(sys.stdin)['entities'][0]['id'])")
./art-src/bot_cam.sh $B $out/${tag}_bot.png 3.5 1.4 1.4 >/dev/null 2>&1
ls $out | grep $tag
