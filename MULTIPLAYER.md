# OneShot multiplayer

Up to 4 players on one network, no server: one player hosts from inside the game (a relay in that game), the others find it.
Every device runs the whole sim and predicts; the host's relay only forwards inputs (about 350 B/s per player) and compares state hashes.

Everyone must run the game on the patched engine (mouse in a match, world reset after leaving: see the end of this file), or the mouse does not work online.

## Play
1. Everyone starts the game on a PC (same build; the lobby only lists hosts with the same build).
2. One player: **JOIN GAME → HOST A MATCH**, picks 2, 3 or 4 players, clicks HOST. The other players: **JOIN GAME**, wait a second for the host to appear in "FIND A MATCH", click JOIN.
3. The match starts by itself when all seats are taken. Online matches have no bots.
4. Your name: in the lobby click the name box, type (letters, digits, space, `_`, `-`; up to 12), Enter. The others see it in announcements and the leaderboard (sent with `multiplayer.say`, so it needs no engine change); without a name you are "Player N". It is remembered for next time.
5. **Esc** opens the pause menu (the match goes on for everyone else). **Quit to menu** leaves; if the host quits, the match ends for everyone.

Without the lobby: `gameengine run --host` on one PC and `gameengine run --join lan` (or `--join ws://<ip>:7600`) on the others.

Firewall: the host needs TCP 7600 (the match) and UDP 7601 (so others can find it) open on the local network; `gameengine doctor` checks them. Other subnets or VPNs: use `--join ws://<host-ip>:7600` from the command line (the lobby has no address field, the UI has no text input yet).

## How it is built
- The sim reads only `PlayerInputs` (src/input.ts): stick = move, buttons = jump, crouch, fire, aim, menu, plus the look direction as two absolute angles (12 bits each). Solo play fills the same resource from the mouse (`SoloInput`), so solo, online, rollback and replays run the same code.
- Seats are `Player` entities 0..3 with a body each (`SeatBody`). The camera shows this device's seat through the `VirtualCamera` under that seat's player; the first-person rig, HUD data and mouse (online: `multiplayer.pointer()`, an engine addition) are presentation (src/net.ts).
- Tests: `tests/net.test.ts` (seat logic), `gameengine net test --players 4 --latency 6 --jitter 4 --synctest 4 --frames 3000`, `gameengine mp test --players 3 --authority relay`.
- Engine changes this needed (mouse in a match, world reset after leaving): see `Engine-issues-mouse-and-multiplayer.md` (on the Desktop) and `Multiplayer-engine-patch.diff`.
