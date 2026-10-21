/**
 * Presentation side of play, solo or online (all LateUpdate: it reads the sim and never changes a hash):
 * which seat this device plays, its input in an online match, the camera and first-person rig of that seat, and its HUD data.
 */
import { defineSystem, query, read, write, math, multiplayer, Camera, PlayerInputs, playerInput, VisualOffset, VirtualCamera } from '@gameengine/runtime';
import { BTN_AIM, BTN_BOARD, BTN_FIRE, BTN_MENU, PITCH_LIMIT, packLook, down } from './input.ts';
import { Critter, Flow, LocalHud, Match, NetLook, Player, SeatCam, VmRig } from './schema.gen.ts';
import { boardOpen, onlinePaused, onlineSens, setBoardOpen, setOnlinePaused } from './netstate.ts';

const SENS = 0.0022;

/** The seat this device plays: its seat in an online match, else seat 0. */
export function localSeat(): number {
  return multiplayer.status().player ?? 0;
}

/** Whether an online match is running on this device. */
export function inOnlineMatch(): boolean {
  return multiplayer.status().phase === 'running';
}

/**
 * Online: this device's mouse look, fire and aim become the local input of its seat (`multiplayer.setInput`, OR-ed with the
 * keys the project's `multiplayer` map covers). The look is sent as absolute angles; see input.ts. In a match the engine
 * gives the sim and `ctx.events` no mouse at all, so the mouse comes from `multiplayer.pointer()`.
 */
export const NetInput = defineSystem({
  name: 'NetInput',
  stage: 'LateUpdate',
  queries: { seats: query(read(Player)) },
  resources: [write(NetLook), read(PlayerInputs), read(Flow)],
  run(ctx, { seats }) {
    const st = multiplayer.status();
    // the host left or the link dropped during a match: leave, and the engine puts a fresh start screen back
    if (st.phase === 'closed' && ctx.get(Flow).mode === 'Online') multiplayer.leave();
    if (st.phase !== 'running') return;
    const me = localSeat();
    const look = ctx.get(NetLook);
    let { yaw, pitch, aiming, seeded, menuHeld } = look;
    if (!seeded) {
      // start looking where the seat spawned
      for (const c of seats.chunks()) {
        for (let i = 0; i < c.length; i++) {
          const p = c.get(Player, i);
          if (p.index === me) {
            yaw = p.yaw;
            pitch = p.pitch;
            seeded = true;
          }
        }
      }
    }
    // Escape comes through the key map as the menu bit of this seat's own input: a press toggles the local pause menu
    const menu = down(playerInput(ctx.get(PlayerInputs), me).buttons, BTN_MENU);
    if (menu && !menuHeld) setOnlinePaused(!onlinePaused());
    menuHeld = menu;
    const paused = onlinePaused();
    const mouse = multiplayer.pointer();
    aiming = (mouse.buttons & 4) !== 0;
    const fire = (mouse.buttons & 1) !== 0;
    if (!paused) {
      const sens = (aiming ? SENS * 0.55 : SENS) * onlineSens();
      yaw -= mouse.dx * sens;
      pitch = math.clamp(pitch - mouse.dy * sens, -PITCH_LIMIT, PITCH_LIMIT);
    }
    ctx.set(NetLook, { yaw, pitch, aiming, menuHeld, seeded });
    // paused: keep sending the facing but no buttons, so the character stands still
    const buttons = packLook(yaw, pitch) | (paused ? 0 : (fire ? BTN_FIRE : 0) | (aiming ? BTN_AIM : 0));
    multiplayer.setInput(buttons >>> 0, [0, 0]);
  },
});

/** Tab shows or hides the leaderboard, solo or online: it is a button of this seat's own input (the mouse is captured while playing, so the chevron cannot be clicked then). */
export const BoardToggle = defineSystem({
  name: 'BoardToggle',
  stage: 'LateUpdate',
  resources: [write(NetLook), read(PlayerInputs)],
  run(ctx) {
    const held = down(playerInput(ctx.get(PlayerInputs), localSeat()).buttons, BTN_BOARD);
    if (held !== ctx.get(NetLook).boardHeld) {
      ctx.setField(NetLook, 'boardHeld', held);
      if (held) setBoardOpen(!boardOpen());
    }
  },
});

/** Everything below shows the seat this device plays. */

/** The camera shows this device's seat: its camera pose gets the top priority. */
export const SeatCamera = defineSystem({
  name: 'SeatCamera',
  stage: 'LateUpdate',
  query: query(read(SeatCam), write(VirtualCamera)),
  run(ctx, q) {
    const me = localSeat();
    for (const c of q.chunks()) {
      for (let i = 0; i < c.length; i++) {
        const priority = c.get(SeatCam, i).seat === me ? 100 : 0;
        if (c.get(VirtualCamera, i).priority !== priority) c.set(VirtualCamera, i, { priority });
      }
    }
  },
});

/** Only this seat's first-person rig is shown, and its own body is left out of its own camera (the bodies sit on render layers 2 << seat). */
export const SeatVisibility = defineSystem({
  name: 'SeatVisibility',
  stage: 'LateUpdate',
  queries: { rigs: query(read(VmRig), write(VisualOffset)), cams: query(write(Camera)) },
  run(ctx, { rigs, cams }) {
    const me = localSeat();
    for (const c of rigs.chunks()) {
      for (let i = 0; i < c.length; i++) {
        const k = c.get(VmRig, i).index === me ? 1 : 0;
        if (c.get(VisualOffset, i).scale[0] !== k) c.set(VisualOffset, i, { scale: [k, k, k] });
      }
    }
    const mask = (0xffffffff & ~(2 << me)) >>> 0;
    for (const c of cams.chunks()) for (let i = 0; i < c.length; i++) if (c.get(Camera, i).layerMask !== mask) c.set(Camera, i, { layerMask: mask });
  },
});

/** What the HUD shows: this seat's numbers, its place among everyone (players and bots) and the best of the leaderboard. */
export const HudMirror = defineSystem({
  name: 'HudMirror',
  stage: 'LateUpdate',
  queries: { player: query(read(Player)), bots: query(read(Critter)) },
  resources: [write(LocalHud), read(Flow)],
  run(ctx, { player, bots }) {
    if (ctx.get(Flow).screen === 'Start') return;
    const me = localSeat();
    const entries: { kind: number; id: number; score: number }[] = [];
    let mine: ReturnType<typeof readPlayer> | null = null;
    for (const c of player.chunks()) {
      for (let i = 0; i < c.length; i++) {
        const p = c.get(Player, i);
        entries.push({ kind: 0, id: p.index, score: p.score });
        if (p.index === me) mine = readPlayer(p);
      }
    }
    if (!mine) return;
    for (const c of bots.chunks()) for (let i = 0; i < c.length; i++) entries.push({ kind: 1, id: c.get(Critter, i).id, score: c.get(Critter, i).score });
    entries.sort((a, b) => b.score - a.score || a.kind - b.kind || a.id - b.id);
    const next: Record<string, number | boolean> = {
      seat: me,
      score: mine.score,
      hits: mine.hits,
      playerDead: mine.dead,
      respawnIn: mine.dead ? math.ceil(mine.respawn) : 0,
      stoneLoaded: mine.loaded,
      superCd: math.ceil(mine.superCd),
      deathBy: mine.deathBy,
      rank: 1 + entries.filter((e) => e.score > mine!.score).length,
      players: entries.length,
      rows: math.min(8, entries.length),
    };
    for (let i = 0; i < 8; i++) {
      const e = entries[i];
      next[`row${i}`] = e ? (e.kind * 100 + e.id) * 1000 + math.min(999, e.score) : 0;
    }
    const cur = ctx.get(LocalHud) as unknown as Record<string, unknown>;
    if (Object.entries(next).some(([k, v]) => cur[k] !== v)) ctx.set(LocalHud, next);
  },
});

function readPlayer(p: { score: number; hits: number; state: unknown; respawn: number; loaded: boolean; superCd: number; deathBy: number }) {
  return { score: p.score, hits: p.hits, dead: p.state === 'Dead', respawn: p.respawn, loaded: p.loaded, superCd: p.superCd, deathBy: p.deathBy };
}
