#!/bin/zsh
# usage: art-src/shots.sh <outdir> <tag>  -> three representative in-game views for the judges
out=$1; tag=$2; mkdir -p $out
shot(){ gameengine cheat run player.teleport x=$1 z=$2 yaw=$3 >/dev/null 2>&1; gameengine step 4 >/dev/null 2>&1; gameengine screenshot $out/${tag}_$4.png --width 1600 --height 900 >/dev/null 2>&1; }
gameengine cheat run flow.play >/dev/null 2>&1; gameengine step 3 >/dev/null 2>&1
gameengine screenshot $out/${tag}_spawn.png --width 1600 --height 900 >/dev/null 2>&1
shot 0 4 0.0 plaza
shot -9 -2 0.9 huts
ls $out | grep $tag
