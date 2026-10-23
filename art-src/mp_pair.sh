#!/bin/zsh
# Starts two headless clients, hosts a match in the first and joins it from the second through the lobby (the browser's lobby path: no network server needed).
# Prints "<pidA> <pidB>"; stop them with `gameengine session stop <pid>`. Needs ~45 s.
cd "$(dirname "$0")/.."
for i in 1 2; do (nohup gameengine run --headless > /tmp/mp_c$i.log 2>&1 &); sleep 14; done
set -- $(gameengine session list | awk '{print $1}'); A=$1; B=$2
for P in $A $B; do gameengine call engine.resume --session $P >/dev/null 2>&1; done
gameengine cheat run net.name name=Ana --session $A >/dev/null; gameengine cheat run net.name name=Bo --session $B >/dev/null
for P in $A $B; do gameengine ui press join --session $P >/dev/null; done; sleep 2
gameengine ui press host --session $A >/dev/null; sleep 6
gameengine ui press h0.join --session $B >/dev/null; sleep 16
echo $A $B
