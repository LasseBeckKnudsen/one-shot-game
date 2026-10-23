/**
 * Presentation side of play, solo or online (all LateUpdate: it reads the sim and never changes a hash):
 * which seat this device plays, its input in an online match, the camera and first-person rig of that seat, and its HUD data.
 */
import { defineSystem, query, read, write, math, multiplayer, services, Camera, KeyEvent, Keys, LocalTransform, PlayerInputs, playerInput, TextInput, VisualOffset, VirtualCamera } from '@gameengine/runtime';
import { BTN_BOARD, BTN_FIRE, BTN_MENU, PITCH_LIMIT, packLook, down, predictInput } from './input.ts';
import { Announce, Critter, Flow, LocalHud, Match, NetLook, Player, SeatBody, SeatCam, VmRig } from './schema.gen.ts';
import { yawPitchQuat } from './sim.ts';
import { announcement } from './announce.ts';
import { boardOpen, cleanName, feed, nameEditing, netLook, onlinePaused, onlineSens, playerName, seatNames, setBoardOpen, setFeed, setNameEditing, setOnlinePaused, setPlayerName, setSeatNames } from './netstate.ts';

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
 * gives the sim and `ctx.events` no mouse at all, so the mouse comes from `multiplayer.pointer()`. The engine calls this right before
 * every match step (`multiplayer.onSample`), so the mouse reaches the sim in the same frame instead of two frames later.
 */
function sampleLook(): void {
  if (!netLook.seeded || !inOnlineMatch()) return;
  const paused = onlinePaused();
  const mouse = multiplayer.pointer();
  const aiming = (mouse.buttons & 4) !== 0;
  const fire = (mouse.buttons & 1) !== 0;
  if (!paused) {
    const sens = (aiming ? SENS * 0.55 : SENS) * onlineSens();
    netLook.yaw -= mouse.dx * sens;
    netLook.pitch = math.clamp(netLook.pitch - mouse.dy * sens, -PITCH_LIMIT, PITCH_LIMIT);
  }
  netLook.aiming = aiming;
  // zoom (right button) stays on this device: it is the camera's field of view and the look's sensitivity, never part of what the server or the others see
  // paused: keep sending the facing but no buttons, so the character stands still
  const buttons = packLook(netLook.yaw, netLook.pitch) | (paused ? 0 : fire ? BTN_FIRE : 0);
  multiplayer.setInput(buttons >>> 0, [0, 0]);
}
multiplayer.onSample(sampleLook);
/** A remote seat's input until its real one arrives: its look carried on, not repeated (a rollback fixes whatever it got wrong). */
multiplayer.onPredict(({ frame, history }) => predictInput(history, frame));

/** Online, once per frame: starts the look where the seat spawned, handles the pause key and leaves a match that closed under us. */
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
    if (!netLook.seeded) {
      for (const c of seats.chunks()) {
        for (let i = 0; i < c.length; i++) {
          const p = c.get(Player, i);
          if (p.index === me) {
            netLook.yaw = p.yaw;
            netLook.pitch = p.pitch;
            netLook.seeded = true;
          }
        }
      }
    }
    // Escape comes through the key map as the menu bit of this seat's own input: a press toggles the local pause menu
    const menu = down(playerInput(ctx.get(PlayerInputs), me).buttons, BTN_MENU);
    if (menu && !ctx.get(NetLook).menuHeld) setOnlinePaused(!onlinePaused());
    if (menu !== ctx.get(NetLook).menuHeld) ctx.setField(NetLook, 'menuHeld', menu);
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

let feedId = 0;

/** Announcements for the HUD: who hit or missed whom, with a random taunt (picked here, in presentation, so it never touches the sim). */
export const AnnounceFeed = defineSystem({
  name: 'AnnounceFeed',
  stage: 'LateUpdate',
  events: [Announce],
  run(ctx) {
    const me = localSeat();
    const fresh = [];
    for (const e of ctx.events.read(Announce)) {
      const { head, taunt } = announcement(e.kind, e.a, e.b, me, Math.random(), seatNames());
      fresh.push({ id: ++feedId, head, taunt, mine: e.a === me || (e.kind === 0 && e.b === me) });
    }
    if (fresh.length > 0) setFeed([...feed(), ...fresh].slice(-6));
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
      freezeIn: !mine.dead && mine.freeze > 0 ? math.ceil(mine.freeze) : 0,
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

function readPlayer(p: { score: number; hits: number; state: unknown; respawn: number; freeze: number; loaded: boolean; superCd: number; deathBy: number }) {
  return { score: p.score, hits: p.hits, dead: p.state === 'Dead', respawn: p.respawn, freeze: p.freeze, loaded: p.loaded, superCd: p.superCd, deathBy: p.deathBy };
}

/** The lobby's name box has the keyboard: typed text edits `playerName`, Enter or Escape end it. */
export const NameEntry = defineSystem({
  name: 'NameEntry',
  stage: 'LateUpdate',
  events: [TextInput, KeyEvent],
  run(ctx) {
    if (!nameEditing()) return;
    let name = playerName();
    let done = false;
    for (const e of ctx.events.read(TextInput)) name = cleanName(name + e.text);
    for (const e of ctx.events.read(KeyEvent)) {
      if (!e.down) continue;
      if (e.code === Keys.Backspace) name = name.slice(0, -1);
      else if (e.code === Keys.Enter || e.code === Keys.Escape) done = true;
    }
    if (name !== playerName()) setPlayerName(name);
    if (done) {
      setNameEditing(false);
      void services.keyboard.hide().catch(() => undefined);
    }
  },
});

/** Seconds between a seat repeating its name (a seat that joined late, or a notice lost, learns it within this). */
const NAME_EVERY = 3;

/**
 * Names travel as `multiplayer.say('name', { n })` notices (the match carries no names): this device says its own on joining and every few
 * seconds, and files the ones the other seats say under their seat for the announcements and the leaderboard.
 */
let nextSay = 0;

export const NameSync = defineSystem({
  name: 'NameSync',
  stage: 'LateUpdate',
  run(ctx) {
    if (!inOnlineMatch()) {
      nextSay = 0;
      if (Object.keys(seatNames()).length > 0) setSeatNames({});
      return;
    }
    const me = localSeat();
    const own = playerName().trim();
    let heard = false;
    let names = seatNames();
    for (const ev of multiplayer.events()) {
      if (ev.type === 'joined') heard = true;
      else if (ev.type === 'notice' && ev.topic === 'name' && ev.from !== null && ev.from !== me) {
        const n = cleanName(String((ev.data as { n?: unknown } | null)?.n ?? '')).trim();
        if (names[ev.from] !== n) names = { ...names, [ev.from]: n };
      }
    }
    if (names !== seatNames()) setSeatNames(names);
    if (own && (heard || ctx.step >= nextSay)) {
      nextSay = ctx.step + NAME_EVERY * 60;
      try {
        multiplayer.say('name', { n: own });
      } catch {
        // the server's rate limit or a closing match: the next repeat tells it
      }
    }
  },
});

type Quat = [number, number, number, number];
const quatConj = (q: Quat): Quat => [-q[0], -q[1], -q[2], q[3]];
const quatMul = (a: Quat, b: Quat): Quat => [
  a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
  a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
  a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
  a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
];

/** Most a body moves in one step without it being a correction (a sprint is 0.09 m, a launch is vertical): beyond it the excess is smoothed away. */
const STEP_MOVE = 0.12;
/** A jump this far in one step is a respawn or a teleport: shown at once. */
const SNAP_DIST = 3;
/** What is left of a smoothed correction each frame (about 90 ms to fade at 60 Hz). */
const FADE = 0.88;

interface Glide {
  x: number;
  z: number;
  ox: number;
  oz: number;
  step: number;
}
const glides = new Map<number, Glide>();

/**
 * How far to show a body from where the sim has it. A rollback that corrects a body moves it in one step; the shown position stays where it was
 * and glides over (the offset is the correction, fading out), while ordinary movement passes straight through.
 */
function glideOffset(key: number, x: number, z: number, step: number): [number, number] {
  let g = glides.get(key);
  if (!g) {
    g = { x, z, ox: 0, oz: 0, step };
    glides.set(key, g);
    return [0, 0];
  }
  if (step !== g.step) {
    const dx = x - g.x;
    const dz = z - g.z;
    const d = math.sqrt(dx * dx + dz * dz);
    const allowed = STEP_MOVE * math.max(1, math.abs(step - g.step));
    if (d > SNAP_DIST) {
      g.ox = 0;
      g.oz = 0;
    } else if (d > allowed) {
      const excess = (d - allowed) / d;
      g.ox -= dx * excess;
      g.oz -= dz * excess;
    }
    g.x = x;
    g.z = z;
    g.step = step;
  }
  g.ox *= FADE;
  g.oz *= FADE;
  if (math.abs(g.ox) < 1e-4) g.ox = 0;
  if (math.abs(g.oz) < 1e-4) g.oz = 0;
  return [g.ox, g.oz];
}

/**
 * Online, this device's own view does not wait for the network: the camera turns with the mouse in the same frame (the sim only learns the look a
 * few frames later, and a rollback re-derives it), and a correction of the seat's own position glides instead of snapping. Presentation only: the sim's
 * yaw and pitch still aim the stone, and the offset below is the difference between the two.
 */
export const LocalView = defineSystem({
  name: 'LocalView',
  stage: 'LateUpdate',
  queries: { players: query(read(Player), read(LocalTransform)), eyes: query(read(SeatCam), write(VisualOffset)) },
  run(ctx, { players, eyes }) {
    const online = inOnlineMatch();
    if (!online) glides.clear();
    const me = localSeat();
    const look = netLook;
    let rotation: Quat = [0, 0, 0, 1];
    let position: [number, number, number] = [0, 0, 0];
    if (online) {
      for (const c of players.chunks()) {
        for (let i = 0; i < c.length; i++) {
          const p = c.get(Player, i);
          if (p.index !== me) continue;
          const t = c.get(LocalTransform, i).position;
          const [ox, oz] = glideOffset(-1 - p.index, t[0], t[2], ctx.step);
          position = [ox, 0, oz];
          if (look.seeded && p.state === 'Alive' && !onlinePaused()) rotation = quatMul(quatConj(yawPitchQuat(p.yaw, p.pitch)), yawPitchQuat(look.yaw, look.pitch));
        }
      }
    }
    for (const c of eyes.chunks()) {
      for (let i = 0; i < c.length; i++) {
        if (c.get(SeatCam, i).seat !== me) continue;
        const cur = c.get(VisualOffset, i);
        if (cur.rotation[0] !== rotation[0] || cur.rotation[1] !== rotation[1] || cur.rotation[2] !== rotation[2] || cur.rotation[3] !== rotation[3] || cur.position[0] !== position[0] || cur.position[2] !== position[2]) {
          c.set(VisualOffset, i, { rotation, position });
        }
      }
    }
  },
});

/** The other seats' bodies glide over rollback corrections instead of snapping (a remote player's input is a guess until it arrives). */
export const SmoothBodies = defineSystem({
  name: 'SmoothBodies',
  stage: 'LateUpdate',
  queries: { bodies: query(read(SeatBody), read(LocalTransform), write(VisualOffset)) },
  run(ctx, { bodies }) {
    const online = inOnlineMatch();
    const me = localSeat();
    for (const c of bodies.chunks()) {
      for (let i = 0; i < c.length; i++) {
        const seat = c.get(SeatBody, i).index;
        if (seat === me) continue;
        let ox = 0;
        let oz = 0;
        if (online) {
          const t = c.get(LocalTransform, i).position;
          [ox, oz] = glideOffset(seat, t[0], t[2], ctx.step);
        }
        const cur = c.get(VisualOffset, i).position;
        if (cur[0] !== ox || cur[2] !== oz) c.set(VisualOffset, i, { position: [ox, 0, oz] });
      }
    }
  },
});
