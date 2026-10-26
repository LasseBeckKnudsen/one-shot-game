/**
 * OneShot: a first-person slingshot duel, solo against bots or online against other players.
 * One stone, one chance: hit someone and score, miss and you pay (lose a point, 3 s respawn).
 * Everything here is sim and reads only `PlayerInputs` (see input.ts): solo, online with rollback and a replay run the same code.
 * Every seat (0..3) is a Player entity; the camera, HUD and first-person rig of this device are presentation (net.ts).
 */
import { setAnimParam, triggerAnim, Animator, defineSystem, query, read, write, math, multiplayer, playerInput, PlayerInputs, KeyEvent, ActionState, LocalTransform, MouseDown, MouseUp, PlayMusic, PlaySound, PointerDown, PointerHover, PointerMove, PointerUp } from '@gameengine/runtime';
import { AirReady } from './schema.gen.ts';
import { Blocker, Ladder, Jumped, SuperJumped, VmRig, Settings, SetSensitivity, Flow, GameReady, QuitToMenu, ResumeGame, SeatChanged, StartSolo } from './schema.gen.ts';
import { Announce, Critter, CritterHit, PlayerHit, Match, Platform, Player, PlayerRespawned, SeatBody, ShotFired, Solid, SoloLook, SpawnPoint, Stone, StoneMissed, Temp } from './schema.gen.ts';
import { BTN_BOARD, BTN_CROUCH, BTN_FIRE, BTN_JUMP, BTN_LOOK, down, isSeatOwner, MAX_SEATS, ownerOfSeat, packLook, PITCH_LIMIT, seatOfOwner, unpackLook } from './input.ts';

export const EYE = 1.65;
const WALK = 5.6;
const JUMP = 9.2;
const GRAVITY = 21;
/** The double-jump launch: Space twice within DOUBLE_TAP seconds fires the player high up; SUPER_COOLDOWN seconds to recharge. */
const SUPER_JUMP = 22.6; // a third less than the original 27 m/s: about 12 m up instead of 17
const DOUBLE_TAP = 0.32;
const SUPER_COOLDOWN = 40;
const CLIMB_SPEED = 3.4;
const EYE_CROUCH = 1.05;
const CROUCH_SPEED = 0.42;
/** Feet to the top of the head. */
const HEAD = 1.85;
/** The invisible wall: the playable disc (the fence, bushes and rocks sit just outside it). */
const ARENA = 40;
const PLAYER_R = 0.4;
/** How wide a player is to a stone (a bit more than the body pushes others away: a clean shot at a person should land). */
const PLAYER_HIT_R = 0.65;
const SENS = 0.0022;
const EDGE_TURN = 1.9;
const STONE_SPEED = 900; // m/s: across the whole 60 m range in four steps, close to instant
const STONE_RANGE = 60;
const CRITTER_R = 0.55;
const CRITTER_TOP = 1.75;
const ROUND_SECONDS = 360;
const RESPAWN = 3;
/** Seconds a missed shot freezes its shooter: no moving, jumping or firing, still hittable, nothing lost. */
const FREEZE = 3;
/** Seconds nobody can hit a player who just respawned (firing ends it early). */
const RESPAWN_PROTECT = 8;

type Circle = { x: number; z: number; r: number; h: number; walk: boolean };

/** Quaternion for yaw about Y then pitch about X (camera looks down -Z at rest). */
export function yawPitchQuat(yaw: number, pitch: number): [number, number, number, number] {
  const sy = math.sin(yaw * 0.5);
  const cy = math.cos(yaw * 0.5);
  const sx = math.sin(pitch * 0.5);
  const cx = math.cos(pitch * 0.5);
  return [cy * sx, sy * cx, -sy * sx, cy * cx];
}

function pushOut(p: { x: number; z: number }, solids: Circle[], radius: number, height: number): void {
  for (const s of solids) {
    if (s.walk && s.h < height) continue; // a crate or rock lower than the feet's reach is stepped or jumped onto, not pushed against
    const dx = p.x - s.x;
    const dz = p.z - s.z;
    const min = s.r + radius;
    const d2 = dx * dx + dz * dz;
    if (d2 < min * min) {
      const d = math.sqrt(d2);
      if (d < 1e-4) {
        p.x = s.x + min;
      } else {
        p.x = s.x + (dx / d) * min;
        p.z = s.z + (dz / d) * min;
      }
    }
  }
}

/**
 * Solo only: turns this device's mouse, keys and buttons into the packed input of seat 0 (online, presentation does the
 * same through `multiplayer.setInput` and the engine fills PlayerInputs). The mouse look is integrated here, then packed.
 */
export const SoloInput = defineSystem({
  name: 'SoloInput',
  runIf: { resource: Flow, field: 'screen', value: 'Playing' },
  queries: { actions: query(read(ActionState)) },
  resources: [write(PlayerInputs), write(SoloLook), read(Settings)],
  events: [PointerHover, PointerMove, PointerDown, PointerUp, MouseDown, MouseUp],
  run(ctx, { actions }) {
    if (multiplayer.match()) return;
    const act: Record<string, number> = {};
    for (const c of actions.chunks()) {
      for (let i = 0; i < c.length; i++) {
        const a = c.get(ActionState, i);
        act[a.name] = a.value;
      }
    }
    const look = ctx.get(SoloLook);
    let { yaw, pitch, lookX, lookY, hasLook, aiming, fireHeld } = look;
    const sens = (aiming ? SENS * 0.55 : SENS) * ctx.get(Settings).sensitivity;
    const move = (x: number, y: number) => {
      if (hasLook) {
        yaw -= (x - lookX) * sens;
        pitch -= (y - lookY) * sens;
      }
      lookX = x;
      lookY = y;
      hasLook = true;
    };
    for (const e of ctx.events.read(PointerHover)) move(e.screen[0], e.screen[1]);
    for (const e of ctx.events.read(PointerMove)) move(e.screen[0], e.screen[1]);
    for (const e of ctx.events.read(MouseDown)) if (e.button === 2) aiming = true;
    for (const e of ctx.events.read(MouseUp)) if (e.button === 2) aiming = false;
    if (ctx.events.count(PointerDown) > 0) fireHeld = true;
    const clicking = fireHeld;
    if (ctx.events.count(PointerUp) > 0) fireHeld = false;
    yaw -= (act['turnX'] ?? 0) * EDGE_TURN * ctx.dt;
    pitch = math.clamp(pitch, -PITCH_LIMIT, PITCH_LIMIT);
    ctx.set(SoloLook, { yaw, pitch, lookX, lookY, hasLook, aiming, fireHeld });
    let buttons = packLook(yaw, pitch);
    if ((act['jump'] ?? 0) > 0.5) buttons |= BTN_JUMP;
    if ((act['crouch'] ?? 0) > 0.5) buttons |= BTN_CROUCH;
    if (clicking || (act['fire'] ?? 0) > 0.5) buttons |= BTN_FIRE;
    if ((act['board'] ?? 0) > 0.5) buttons |= BTN_BOARD;
    ctx.set(PlayerInputs, { players: 1, buttons0: buttons >>> 0, stick0: [act['moveX'] ?? 0, act['moveY'] ?? 0] });
  },
});

/** Every seat's facing and aim come from its packed input: the same on every peer. */
export const Look = defineSystem({
  name: 'Look',
  runIf: { resource: Flow, field: 'screen', value: 'Playing' },
  after: ['SoloInput'],
  queries: { player: query(write(Player)) },
  resources: [read(PlayerInputs)],
  run(ctx, { player }) {
    const inputs = ctx.get(PlayerInputs);
    for (const c of player.chunks()) {
      for (let i = 0; i < c.length; i++) {
        const p = c.get(Player, i);
        const inp = playerInput(inputs, p.index);
        if (down(inp.buttons, BTN_LOOK)) {
          const l = unpackLook(inp.buttons);
          c.set(Player, i, { yaw: l.yaw, pitch: l.pitch });
        }
      }
    }
  },
});

export const Move = defineSystem({
  name: 'Move',
  runIf: { resource: Flow, field: 'screen', value: 'Playing' },
  after: ['Look'],
  queries: {
    player: query(write(Player), write(LocalTransform)),
    solids: query(read(Solid), read(LocalTransform)),
    decks: query(read(Platform), read(LocalTransform)),
    ladders: query(read(Ladder), read(LocalTransform)),
    blockers: query(read(Blocker), read(LocalTransform)),
  },
  resources: [read(PlayerInputs)],
  run(ctx, { player, solids, decks, ladders, blockers }) {
    const inputs = ctx.get(PlayerInputs);
    const circles: Circle[] = [];
    for (const c of solids.chunks()) {
      for (let i = 0; i < c.length; i++) {
        const s = c.get(Solid, i);
        const t = c.get(LocalTransform, i);
        circles.push({ x: t.position[0], z: t.position[2], r: s.radius, h: s.height, walk: s.walk });
      }
    }
    const rects: { x: number; z: number; hx: number; hz: number; top: number }[] = [];
    for (const c of decks.chunks()) {
      for (let i = 0; i < c.length; i++) {
        const d = c.get(Platform, i);
        const t = c.get(LocalTransform, i);
        rects.push({ x: t.position[0], z: t.position[2], hx: d.halfX, hz: d.halfZ, top: d.top });
      }
    }
    const blocks: { x: number; z: number; r: number; hx: number; hz: number; c: number; s: number; y0: number; y1: number; walk: boolean }[] = [];
    for (const c of blockers.chunks()) {
      for (let i = 0; i < c.length; i++) {
        const b = c.get(Blocker, i);
        const t = c.get(LocalTransform, i);
        blocks.push({ x: t.position[0], z: t.position[2], r: b.radius, hx: b.halfX, hz: b.halfZ, c: math.cos(b.yaw), s: math.sin(b.yaw), y0: b.y0, y1: b.y1, walk: b.walk });
      }
    }
    const inside = (b: (typeof blocks)[number], x: number, z: number): boolean => {
      const dx = x - b.x;
      const dz = z - b.z;
      if (b.r > 0) return dx * dx + dz * dz < b.r * b.r;
      const lx = dx * b.c - dz * b.s;
      const lz = dx * b.s + dz * b.c;
      return math.abs(lx) <= b.hx && math.abs(lz) <= b.hz;
    };
    const rungs: { x: number; z: number; nx: number; nz: number; top: number; reach: number }[] = [];
    for (const c of ladders.chunks()) {
      for (let i = 0; i < c.length; i++) {
        const l = c.get(Ladder, i);
        const t = c.get(LocalTransform, i);
        rungs.push({ x: t.position[0], z: t.position[2], nx: l.nx, nz: l.nz, top: l.top, reach: l.reach });
      }
    }
    for (const c of player.chunks()) {
      for (let i = 0; i < c.length; i++) {
        const p = c.get(Player, i);
        const t = c.get(LocalTransform, i);
        if (p.state === 'Dead' || !p.active) continue;
        const raw = playerInput(inputs, p.index);
        // frozen (a missed shot): no walking, jumping or crouching, but the look goes on
        const inp = p.freeze > 0 ? { buttons: raw.buttons & ~(BTN_JUMP | BTN_CROUCH), stick: [0, 0] as [number, number] } : raw;
        const act = { moveX: inp.stick[0], moveY: inp.stick[1] };
        const jumpHeld = down(inp.buttons, BTN_JUMP);
        const jumpPressed = jumpHeld && !p.jumpHeld;
        // On a ladder: W/S climb, Space lets go (a hop away from it), the top steps onto the platform, the bottom ends the climb.
        if (p.climbing) {
          const climb = act.moveY * CLIMB_SPEED * ctx.dt;
          let feet = t.position[1] - p.eye + climb;
          const lx = p.ladderX;
          const lz = p.ladderZ;
          const nx = p.ladderNx;
          const nz = p.ladderNz;
          if (jumpPressed) {
            c.set(Player, i, { climbing: false, vy: JUMP * 0.85, ladderCool: 0.45, jumpHeld, sinceJump: 9 });
            c.set(LocalTransform, i, { position: [lx + nx * 1.15, feet + p.eye, lz + nz * 1.15] });
            ctx.events.emit(Jumped, { seat: p.index });
          } else if (climb > 0 && feet >= p.ladderTop) {
            c.set(Player, i, { climbing: false, vy: 0, ladderCool: 0.5, jumpHeld });
            c.set(LocalTransform, i, { position: [lx - nx * 0.95, p.ladderTop + p.eye, lz - nz * 0.95] });
          } else if (climb < 0 && feet <= 0.02) {
            c.set(Player, i, { climbing: false, vy: 0, ladderCool: 0.5, jumpHeld });
            c.set(LocalTransform, i, { position: [lx + nx * 0.95, p.eye, lz + nz * 0.95] });
          } else {
            c.set(Player, i, { vy: 0, speed: 0, jumpHeld });
            c.set(LocalTransform, i, { position: [lx + nx * 0.45, feet + p.eye, lz + nz * 0.45] });
          }
          continue;
        }
        const mx = act.moveX;
        const my = act.moveY;
        const fx = -math.sin(p.yaw);
        const fz = -math.cos(p.yaw);
        const rx = math.cos(p.yaw);
        const rz = -math.sin(p.yaw);
        let vx = fx * my + rx * mx;
        let vz = fz * my + rz * mx;
        const len = math.sqrt(vx * vx + vz * vz);
        if (len > 1) {
          vx /= len;
          vz /= len;
        }
        const crouching = down(inp.buttons, BTN_CROUCH);
        const eye = p.eye + math.clamp((crouching ? EYE_CROUCH : EYE) - p.eye, -9 * ctx.dt, 9 * ctx.dt);
        const speed = WALK * (crouching ? CROUCH_SPEED : 1);
        const pos = { x: t.position[0] + vx * speed * ctx.dt, z: t.position[2] + vz * speed * ctx.dt };
        pushOut(pos, circles, PLAYER_R, t.position[1] - p.eye + 0.6);
        const rr = math.sqrt(pos.x * pos.x + pos.z * pos.z);
        if (rr > ARENA) {
          pos.x *= ARENA / rr;
          pos.z *= ARENA / rr;
        }
        // Vertical: stand on the highest deck under the feet, else the ground.
        let floor = 0;
        let feet = t.position[1] - p.eye;
        for (const d of rects) {
          // Only decks within a step of the feet count: a player under a treehouse is not lifted onto it.
          if (math.abs(pos.x - d.x) <= d.hx && math.abs(pos.z - d.z) <= d.hz && d.top > floor && d.top <= feet + 0.6) floor = d.top;
        }
        for (const b of blocks) if (b.walk && b.y1 > floor && b.y1 <= feet + 0.6 && inside(b, pos.x, pos.z)) floor = b.y1;
        for (const o of circles) if (o.walk && o.h > floor && o.h <= feet + 0.6 && (pos.x - o.x) ** 2 + (pos.z - o.z) ** 2 < o.r * o.r) floor = o.h;
        let vy = p.vy;
        const grounded = feet <= floor + 0.02;
        const jumpDown = jumpHeld;
        const pressed = jumpPressed;
        // Jumping (or falling) next to a ladder grabs it.
        const ladderCool = math.max(0, p.ladderCool - ctx.dt);
        if (ladderCool === 0) {
          for (const l of rungs) {
            const d = math.sqrt((pos.x - l.x) ** 2 + (pos.z - l.z) ** 2);
            // grabbed by jumping or falling past it, or just by walking into it (W, facing it from its outer side)
            const walkedInto = my > 0.3 && d < 1.3 && fx * -l.nx + fz * -l.nz > 0.5;
            if (d < l.reach && feet >= -0.1 && feet <= l.top + 0.1 && (pressed || !grounded || walkedInto)) {
              c.set(Player, i, { climbing: true, ladderX: l.x, ladderZ: l.z, ladderNx: l.nx, ladderNz: l.nz, ladderTop: l.top, vy: 0, jumpHeld: jumpDown, sinceJump: 9, ladderCool: 0 });
              c.set(LocalTransform, i, { position: [l.x + l.nx * 0.45, feet + p.eye, l.z + l.nz * 0.45] });
              break;
            }
          }
          if (p.climbing || c.get(Player, i).climbing) continue;
        }
        let sinceJump = p.sinceJump + ctx.dt;
        let superCd = math.max(0, p.superCd - ctx.dt);
        if (p.superCd > 0 && superCd === 0) ctx.events.emit(AirReady, { seat: p.index });
        if (pressed && sinceJump <= DOUBLE_TAP && superCd === 0) {
          vy = SUPER_JUMP; // second tap of a double tap: the launch
          ctx.events.emit(SuperJumped, { seat: p.index });
          superCd = SUPER_COOLDOWN;
          sinceJump = 9;
        } else if (grounded && pressed) {
          vy = JUMP;
          sinceJump = 0;
          ctx.events.emit(Jumped, { seat: p.index });
        } else if (pressed) {
          sinceJump = 0; // an air tap still opens the double-tap window
        } else if (grounded) vy = 0;
        vy -= GRAVITY * ctx.dt;
        const oldHead = feet + eye + 0.2;
        feet += vy * ctx.dt;
        // A rising head that reaches the underside of a canopy, deck or bridge stops there and starts to fall.
        if (vy > 0) {
          for (const b of blocks) {
            if (oldHead <= b.y0 + 0.05 && feet + eye + 0.2 > b.y0 && inside(b, pos.x, pos.z)) {
              feet = b.y0 - eye - 0.21;
              vy = -1;
              break;
            }
          }
        }
        if (feet <= floor) {
          feet = floor;
          vy = 0;
        }
        c.set(Player, i, { vy, speed: math.sqrt(vx * vx + vz * vz) * speed, jumpHeld: jumpDown, sinceJump, superCd, ladderCool, eye, crouch: crouching });
        c.set(LocalTransform, i, { position: [pos.x, feet + eye, pos.z] });
      }
    }
  },
});

export const CameraRig = defineSystem({
  name: 'CameraRig',
  after: ['Move', 'Respawn'],
  query: query(read(Player), write(LocalTransform)),
  run(ctx, q) {
    for (const c of q.chunks()) {
      for (let i = 0; i < c.length; i++) {
        const p = c.get(Player, i);
        const dead = p.state === 'Dead';
        c.set(LocalTransform, i, { rotation: yawPitchQuat(p.yaw, dead ? math.max(-0.5, p.pitch - 0.35) : p.pitch) });
      }
    }
  },
});

export const Fire = defineSystem({
  name: 'Fire',
  runIf: { resource: Flow, field: 'screen', value: 'Playing' },
  after: ['Move'],
  queries: { player: query(write(Player), read(LocalTransform)) },
  resources: [read(Match), read(PlayerInputs)],
  run(ctx, { player }) {
    const inputs = ctx.get(PlayerInputs);
    const playing = ctx.get(Match).phase === 'Playing';
    for (const c of player.chunks()) {
      for (let i = 0; i < c.length; i++) {
        const p = c.get(Player, i);
        const fire = down(playerInput(inputs, p.index).buttons, BTN_FIRE);
        if (fire !== p.fireHeld) c.set(Player, i, { fireHeld: fire });
        if (!fire || p.fireHeld || !playing) continue; // a press, not a hold
        if (p.state !== 'Alive' || !p.loaded || !p.active) continue;
        const t = c.get(LocalTransform, i);
        const cp = math.cos(p.pitch);
        const dir: [number, number, number] = [-math.sin(p.yaw) * cp, math.sin(p.pitch), -math.cos(p.yaw) * cp];
        const rx = math.cos(p.yaw);
        const rz = -math.sin(p.yaw);
        const origin: [number, number, number] = [
          t.position[0] + dir[0] * 0.6 + rx * 0.05,
          t.position[1] + dir[1] * 0.6 - 0.06,
          t.position[2] + dir[2] * 0.6 + rz * 0.05,
        ];
        ctx.commands.spawn({
          LocalTransform: { position: origin, rotation: yawPitchQuat(p.yaw, p.pitch), scale: [0.09, 0.09, 3.4] },
          Stone: { velocity: [dir[0] * STONE_SPEED, dir[1] * STONE_SPEED, dir[2] * STONE_SPEED], owner: ownerOfSeat(p.index) },
          MeshRenderer: { mesh: 'models/stone.glb', castShadows: false, receiveShadows: false },
        });
        ctx.commands.spawn({ LocalTransform: { position: origin }, ParticleSystem: { effect: 'fx/sling_snap.vfx.json' }, Temp: { life: 1 } });
        c.set(Player, i, { loaded: false, protect: 0 });
        ctx.events.emit(ShotFired, { position: origin, direction: dir, seat: p.index });
        ctx.events.emit(PlaySound, { sound: 'audio/fire', volume: 0.9, pitchRandom: 0.05, spatial: true, position: origin });
        ctx.events.emit(PlaySound, { sound: 'audio/whistle', volume: 0.5, pitchRandom: 0.1, spatial: true, position: origin });
      }
    }
  },
});

/** Points a victim loses when hit: half the score, rounded up, at least 1 (never below 0 in total). */
/** Models the bots and corpses wear, and their tints (the scene gives each bot one of them; a corpse copies it). */
const BOT_MODEL = 'models/guy_rig.glb';
const BOT_TINTS = ['#ffffff', '#9cc4ff', '#ffb07a', '#a8f08a', '#d79cff', '#ffe27a', '#ff8f8f', '#7af0d8'];
/** What a player's body wears (the scene tints each seat's body the same). */
const SEAT_TINTS = ['#ff7a6e', '#6eb4ff', '#ffd95c', '#7ae89a'];

/** The body a hit leaves behind: it plays its death clip where the victim fell and stays about 2.6 s, so it overlaps the respawn. */
function spawnCorpse(ctx: any, x: number, y: number, z: number, heading: number, tint: string): void {
  ctx.commands.spawn({
    LocalTransform: { position: [x, y, z], rotation: yawPitchQuat(heading, 0) },
    MeshRenderer: { mesh: BOT_MODEL, color: tint, castShadows: true },
    Animator: { controller: 'anim/guy.animctrl.json', params: [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    Temp: { life: 2.6 },
  });
}

export const hitPenalty = (score: number) => math.max(1, math.ceil(score / 2));

type Victim = { kind: 'player' | 'bot'; id: number; x: number; z: number; y: number; h?: number; chunk: any; row: number };

export const StoneFlight = defineSystem({
  name: 'StoneFlight',
  runIf: { resource: Flow, field: 'screen', value: 'Playing' },
  after: ['Fire', 'CritterAI'],
  queries: {
    stones: query(write(Stone), write(LocalTransform)),
    solids: query(read(Solid), read(LocalTransform)),
    critters: query(write(Critter), read(LocalTransform)),
    player: query(write(Player), read(LocalTransform)),
  },
  run(ctx, { stones, solids, critters, player }) {
    if (stones.count === 0) return;
    const circles: Circle[] = [];
    for (const c of solids.chunks()) {
      for (let i = 0; i < c.length; i++) {
        const s = c.get(Solid, i);
        const t = c.get(LocalTransform, i);
        circles.push({ x: t.position[0], z: t.position[2], r: s.radius, h: s.height, walk: s.walk });
      }
    }
    const targets: Victim[] = [];
    const bots = new Map<number, { chunk: any; row: number }>();
    for (const c of critters.chunks()) {
      for (let i = 0; i < c.length; i++) {
        const g = c.get(Critter, i);
        bots.set(g.id, { chunk: c, row: i });
        if (g.dead > 0) continue;
        const t = c.get(LocalTransform, i);
        targets.push({ kind: 'bot', id: g.id, x: t.position[0], z: t.position[2], y: 0, chunk: c, row: i });
      }
    }
    const seats = new Map<number, { chunk: any; row: number }>();
    for (const c of player.chunks()) {
      for (let i = 0; i < c.length; i++) {
        const p = c.get(Player, i);
        seats.set(p.index, { chunk: c, row: i });
        if (p.state === 'Alive' && p.protect <= 0 && p.active) {
          const t = c.get(LocalTransform, i);
          targets.push({ kind: 'player', id: p.index, x: t.position[0], z: t.position[2], y: t.position[1] - p.eye, h: p.crouch ? 1.2 : 1.75, chunk: c, row: i });
        }
      }
    }
    for (const sc of stones.chunks()) {
      for (let i = 0; i < sc.length; i++) {
        const s = sc.get(Stone, i);
        const t = sc.get(LocalTransform, i);
        let [x, y, z] = t.position;
        const vel: [number, number, number] = [s.velocity[0], s.velocity[1], s.velocity[2]] // no drop: a shot is a straight line;
        const step: [number, number, number] = [vel[0] * ctx.dt, vel[1] * ctx.dt, vel[2] * ctx.dt];
        const dist = math.sqrt(step[0] * step[0] + step[1] * step[1] + step[2] * step[2]);
        const n = math.max(1, math.ceil(dist / 0.2));
        const fromSeat = isSeatOwner(s.owner);
        const shooterSeat = fromSeat ? seatOfOwner(s.owner) : -1;
        let outcome: 'fly' | 'hit' | 'miss' = 'fly';
        let victim: Victim | null = null;
        let travelled = s.travelled;
        for (let k = 0; k < n && outcome === 'fly'; k++) {
          x += step[0] / n;
          y += step[1] / n;
          z += step[2] / n;
          travelled += dist / n;
          for (const g of targets) {
            if ((g.kind === 'player' && g.id === shooterSeat) || (g.kind === 'bot' && g.id === s.owner)) continue;
            const dx = x - g.x;
            const dz = z - g.z;
            const r = g.kind === 'player' ? PLAYER_HIT_R : CRITTER_R;
            const top = g.y + (g.kind === 'player' ? (g.h ?? 1.75) + 0.1 : CRITTER_TOP);
            if (dx * dx + dz * dz < r * r && y > g.y + 0.05 && y < top) {
              outcome = 'hit';
              victim = g;
              break;
            }
          }
          if (outcome !== 'fly') break;
          if (y <= 0) outcome = 'miss';
          else if (travelled >= STONE_RANGE) outcome = 'miss';
          else {
            for (const o of circles) {
              const dx = x - o.x;
              const dz = z - o.z;
              if (dx * dx + dz * dz < o.r * o.r && y < o.h) {
                outcome = 'miss';
                break;
              }
            }
          }
        }
        const stoneEntity = sc.entity(i);
        if (outcome === 'fly') {
          sc.set(Stone, i, { velocity: vel, life: s.life + ctx.dt, travelled });
          sc.set(LocalTransform, i, { position: [x, y, z] });
          continue;
        }
        ctx.commands.despawn(stoneEntity);
        const shooterCode = fromSeat ? shooterSeat : 100 + s.owner;
        const shooterPlayer = fromSeat ? seats.get(shooterSeat) ?? null : null;
        const shooterBot = fromSeat ? null : bots.get(s.owner) ?? null;
        if (outcome === 'hit' && victim) {
          const v = victim;
          targets.splice(targets.indexOf(v), 1);
          ctx.events.emit(Announce, { kind: 0, a: shooterCode, b: v.kind === 'bot' ? 100 + v.id : v.id });
          // The shooter scores and its stone comes straight back.
          if (shooterPlayer) {
            const sp = shooterPlayer.chunk.get(Player, shooterPlayer.row);
            shooterPlayer.chunk.set(Player, shooterPlayer.row, { score: sp.score + 1, hits: sp.hits + 1, loaded: true });
          } else if (shooterBot) {
            shooterBot.chunk.set(Critter, shooterBot.row, { score: shooterBot.chunk.get(Critter, shooterBot.row).score + 1, loaded: true });
          }
          // The victim loses half its points and is out for a moment.
          if (v.kind === 'bot') {
            const g = v.chunk.get(Critter, v.row);
            v.chunk.set(Critter, v.row, { dead: 2, freeze: 0, score: math.max(0, g.score - hitPenalty(g.score)) });
            spawnCorpse(ctx, v.x, 0, v.z, g.heading, BOT_TINTS[g.id % BOT_TINTS.length]!);
            ctx.events.emit(CritterHit, { position: [v.x, 0.8, v.z], seat: shooterSeat });
            ctx.events.emit(PlaySound, { sound: 'audio/hit', volume: 1, spatial: true, position: [v.x, 1, v.z] });
            ctx.commands.spawn({ LocalTransform: { position: [v.x, 0.9, v.z] }, ParticleSystem: { effect: 'fx/hit_burst.vfx.json' }, Temp: { life: 2.2 } });
            ctx.commands.spawn({ LocalTransform: { position: [v.x, 0.9, v.z] }, ParticleSystem: { effect: 'fx/critter_poof.vfx.json' }, Temp: { life: 1.5 } });
          } else {
            const vp = v.chunk.get(Player, v.row);
            v.chunk.set(Player, v.row, { state: 'Dead', respawn: RESPAWN, freeze: 0, vy: 0, climbing: false, score: math.max(0, vp.score - hitPenalty(vp.score)), deaths: vp.deaths + 1, deathBy: s.owner });
            spawnCorpse(ctx, v.x + math.sin(vp.yaw) * 0.9, v.y, v.z + math.cos(vp.yaw) * 0.9, vp.yaw + 3.14159, SEAT_TINTS[vp.index % MAX_SEATS]!);
            ctx.events.emit(PlayerHit, { by: s.owner, seat: vp.index });
            if (shooterSeat >= 0) ctx.events.emit(CritterHit, { position: [v.x, 1.0, v.z], seat: shooterSeat });
            ctx.events.emit(PlaySound, { sound: 'audio/miss', volume: 1, spatial: true, position: [v.x, 1.2, v.z] });
            // the burst goes where the body falls, behind the victim's eyes: on the camera it would fill the whole view
            ctx.commands.spawn({ LocalTransform: { position: [v.x + math.sin(vp.yaw) * 1.6, 1.0, v.z + math.cos(vp.yaw) * 1.6] }, ParticleSystem: { effect: 'fx/hit_burst.vfx.json' }, Temp: { life: 2.2 } });
          }
        } else {
          // A miss freezes the shooter: it cannot move or fire for a few seconds and can still be hit, but loses nothing.
          ctx.events.emit(StoneMissed, { position: [x, y, z], seat: shooterSeat < 0 ? 99 : shooterSeat });
          ctx.events.emit(Announce, { kind: 1, a: shooterCode, b: 0 });
          ctx.commands.spawn({ LocalTransform: { position: [x, math.max(0.05, y), z] }, ParticleSystem: { effect: 'fx/impact.vfx.json' }, Temp: { life: 1.5 } });
          if (shooterPlayer) {
            const pp = shooterPlayer.chunk.get(Player, shooterPlayer.row);
            const pt = shooterPlayer.chunk.get(LocalTransform, shooterPlayer.row).position;
            shooterPlayer.chunk.set(Player, shooterPlayer.row, { freeze: FREEZE, misses: pp.misses + 1 });
            ctx.commands.spawn({ LocalTransform: { position: [pt[0], pt[1] - pp.eye + 0.9, pt[2]] }, ParticleSystem: { effect: 'fx/freeze_burst.vfx.json' }, Temp: { life: 2 } });
            ctx.events.emit(PlaySound, { sound: 'audio/miss', volume: 1, spatial: true, position: [pt[0], pt[1], pt[2]] });
          } else if (shooterBot) {
            const bt = shooterBot.chunk.get(LocalTransform, shooterBot.row).position;
            shooterBot.chunk.set(Critter, shooterBot.row, { freeze: FREEZE });
            ctx.commands.spawn({ LocalTransform: { position: [bt[0], 0.9, bt[2]] }, ParticleSystem: { effect: 'fx/freeze_burst.vfx.json' }, Temp: { life: 2 } });
            ctx.events.emit(PlaySound, { sound: 'audio/miss', volume: 0.7, spatial: true, position: [x, y, z] });
          }
        }
      }
    }
  },
});

/** The spawn point farthest from every critter and every standing player but `self`. */
function farthestSpawn(spawns: any, critters: any, standing: readonly { index: number; x: number; z: number }[], self: number): [number, number] {
  let best: [number, number] = [0, 12];
  let bestD = -1;
  for (const sc of spawns.chunks()) {
    for (let s = 0; s < sc.length; s++) {
      const sp = sc.get(LocalTransform, s).position;
      let near = 1e9;
      for (const o of standing) {
        if (o.index === self) continue;
        const d = (o.x - sp[0]) ** 2 + (o.z - sp[2]) ** 2;
        if (d < near) near = d;
      }
      for (const cc of critters.chunks()) {
        for (let k = 0; k < cc.length; k++) {
          const ct = cc.get(LocalTransform, k).position;
          const d = (ct[0] - sp[0]) ** 2 + (ct[2] - sp[2]) ** 2;
          if (d < near) near = d;
        }
      }
      if (near > bestD) {
        bestD = near;
        best = [sp[0], sp[2]];
      }
    }
  }
  return best;
}

export const Respawn = defineSystem({
  name: 'Respawn',
  runIf: { resource: Flow, field: 'screen', value: 'Playing' },
  after: ['StoneFlight'],
  queries: {
    player: query(write(Player), write(LocalTransform)),
    spawns: query(read(SpawnPoint), read(LocalTransform)),
    critters: query(read(Critter), read(LocalTransform)),
  },
  run(ctx, { player, spawns, critters }) {
    // the players still standing, read before any of them is written (one query only: a second, read-only one over the same
    // entities would alias the writes below)
    const standing: { index: number; x: number; z: number }[] = [];
    for (const pc of player.chunks()) {
      for (let i = 0; i < pc.length; i++) {
        const p = pc.get(Player, i);
        if (p.state !== 'Dead' && p.active) {
          const t = pc.get(LocalTransform, i).position;
          standing.push({ index: p.index, x: t[0], z: t[2] });
        }
      }
    }
    for (const pc of player.chunks()) {
      for (let i = 0; i < pc.length; i++) {
        const p = pc.get(Player, i);
        if (!p.active) continue;
        if (p.protect > 0) pc.set(Player, i, { protect: math.max(0, p.protect - ctx.dt) });
        if (p.freeze > 0 && p.state !== 'Dead') {
          // thawing: the stone is back in the sling
          const left = math.max(0, p.freeze - ctx.dt);
          pc.set(Player, i, left > 0 ? { freeze: left } : { freeze: 0, loaded: true });
          if (left <= 0) {
            const pt = pc.get(LocalTransform, i).position;
            ctx.commands.spawn({ LocalTransform: { position: [pt[0], pt[1] - p.eye + 0.9, pt[2]] }, ParticleSystem: { effect: 'fx/thaw_burst.vfx.json' }, Temp: { life: 2 } });
            ctx.events.emit(PlayerRespawned, { seat: p.index });
            ctx.events.emit(PlaySound, { sound: 'audio/respawn', volume: 0.5, spatial: true, position: [pt[0], pt[1], pt[2]] });
          }
        }
        if (p.state !== 'Dead') continue;
        const left = p.respawn - ctx.dt;
        if (left > 0) {
          pc.set(Player, i, { respawn: left });
          continue;
        }
        // Back at the spawn point farthest from every critter and every other player.
        const best = farthestSpawn(spawns, critters, standing, p.index);
        pc.set(Player, i, { state: 'Alive', loaded: true, protect: RESPAWN_PROTECT, freeze: 0, vy: 0, climbing: false });
        pc.set(LocalTransform, i, { position: [best[0], EYE, best[1]] });
        pc.set(Player, i, { eye: EYE, crouch: false });
        ctx.commands.spawn({ LocalTransform: { position: [best[0], 0.05, best[1]] }, ParticleSystem: { effect: 'fx/respawn.vfx.json' }, Temp: { life: 2.2 } });
        ctx.events.emit(PlayerRespawned, { seat: p.index });
        ctx.events.emit(PlaySound, { sound: 'audio/respawn', volume: 0.7, spatial: true, position: [best[0], EYE, best[1]] });
      }
    }
  },
});

const BOT_RANGE = 26;
const SNEAK_RANGE = 11;
const BOT_AIM_TELL = 0.8;
const BOT_AIM_ERROR = 0.075;

/**
 * The bots: they wander the clearing, and when they hold a stone with someone in range they stop, raise the sling for
 * a moment (a tell the player can see) and shoot with some aim error. They follow the same rules as the player:
 * a hit scores and returns the stone, a miss costs a point and a short respawn, getting hit costs half the points.
 */
export const CritterAI = defineSystem({
  name: 'CritterAI',
  runIf: { resource: Flow, field: 'screen', value: 'Playing' },
  after: ['Move'],
  queries: {
    critters: query(write(Critter), write(LocalTransform), write(Animator)),
    solids: query(read(Solid), read(LocalTransform)),
    player: query(read(Player), read(LocalTransform)),
  },
  run(ctx, { critters, solids, player }) {
    if (critters.count === 0) return; // an online match has no bots: nothing to build, and a rollback re-runs this every step
    const circles: Circle[] = [];
    for (const c of solids.chunks()) {
      for (let i = 0; i < c.length; i++) {
        const s = c.get(Solid, i);
        const t = c.get(LocalTransform, i);
        circles.push({ x: t.position[0], z: t.position[2], r: s.radius, h: s.height, walk: s.walk });
      }
    }
    const humans: { seat: number; x: number; y: number; z: number; sneaking: boolean; alive: boolean }[] = [];
    for (const c of player.chunks()) {
      for (let i = 0; i < c.length; i++) {
        const p = c.get(Player, i);
        const t = c.get(LocalTransform, i).position;
        humans.push({ seat: p.index, x: t[0], y: t[1] - p.eye, z: t[2], sneaking: p.crouch, alive: p.state === 'Alive' && p.protect <= 0 && p.active });
      }
    }
    const others: { id: number; x: number; z: number }[] = [];
    for (const c of critters.chunks()) {
      for (let i = 0; i < c.length; i++) {
        const g = c.get(Critter, i);
        if (g.dead <= 0) {
          const t = c.get(LocalTransform, i);
          others.push({ id: g.id, x: t.position[0], z: t.position[2] });
        }
      }
    }
    for (const c of critters.chunks()) {
      for (let i = 0; i < c.length; i++) {
        const g = c.get(Critter, i);
        const t = c.get(LocalTransform, i);
        if (g.dead > 0) {
          const left = g.dead - ctx.dt;
          setAnimParam(c, i, 'dead', true);
          setAnimParam(c, i, 'walking', false);
          setAnimParam(c, i, 'aiming', false);
          if (left > 0) {
            c.set(Critter, i, { dead: left });
            c.set(LocalTransform, i, { scale: [0, 0, 0] });
            continue;
          }
          // Back in play somewhere out of the player's face.
          let a = ctx.rng.between(0, 6.2831853);
          let r = ctx.rng.between(10, 32);
          let x = math.sin(a) * r;
          let z = math.cos(a) * r;
          if (humans.some((h) => (x - h.x) ** 2 + (z - h.z) ** 2 < 100)) {
            a += 3.14159;
            x = math.sin(a) * r;
            z = math.cos(a) * r;
          }
          const p = { x, z };
          pushOut(p, circles, CRITTER_R + 0.3, 0);
          c.set(Critter, i, { dead: 0, turn: 0.5, loaded: true, aim: ctx.rng.between(4, 8) });
          c.set(LocalTransform, i, { position: [p.x, 0, p.z], scale: [1, 1, 1] });
          setAnimParam(c, i, 'dead', false);
          setAnimParam(c, i, 'frozen', false);
          ctx.commands.spawn({ LocalTransform: { position: [p.x, 0.05, p.z] }, ParticleSystem: { effect: 'fx/critter_spawn.vfx.json' }, Temp: { life: 1.5 } });
          continue;
        }
        if (g.freeze > 0) {
          // frozen by its own miss: it stands still (and can still be hit) until it thaws with its stone back
          const left = math.max(0, g.freeze - ctx.dt);
          setAnimParam(c, i, 'frozen', left > 0);
          setAnimParam(c, i, 'walking', false);
          setAnimParam(c, i, 'aiming', false);
          if (left > 0) {
            c.set(Critter, i, { freeze: left });
          } else {
            c.set(Critter, i, { freeze: 0, loaded: true, aim: ctx.rng.between(2, 5) });
            ctx.commands.spawn({ LocalTransform: { position: [t.position[0], 0.9, t.position[2]] }, ParticleSystem: { effect: 'fx/thaw_burst.vfx.json' }, Temp: { life: 2 } });
          }
          continue;
        }
        // Who could it shoot at: the player if close, else the nearest other bot.
        let tx = 0;
        let tz = 0;
        let ty = 1.0;
        let hasTarget = false;
        let best = BOT_RANGE * BOT_RANGE;
        // Each bot goes after a given player only in every third 5-second window, so nobody is focused by all of them.
        for (const h of humans) {
          if (!h.alive || (g.id + h.seat + math.floor(ctx.step / 300)) % 3 !== 0) continue;
          const d = (h.x - t.position[0]) ** 2 + (h.z - t.position[2]) ** 2;
          // a crouching player is only noticed from close by
          if (d < best && (!h.sneaking || d < SNEAK_RANGE * SNEAK_RANGE)) {
            best = d;
            tx = h.x;
            tz = h.z;
            ty = h.y + (h.sneaking ? 0.7 : 1.0);
            hasTarget = true;
          }
        }
        for (const o of others) {
          if (o.id === g.id) continue;
          const d = (o.x - t.position[0]) ** 2 + (o.z - t.position[2]) ** 2;
          if (d < best * 0.6) {
            best = d * 1.6;
            tx = o.x;
            tz = o.z;
            ty = 1.0;
            hasTarget = true;
          }
        }
        let aim = g.aim - ctx.dt;
        const aiming = g.loaded && hasTarget && aim < BOT_AIM_TELL;
        let heading = g.heading;
        let turn = g.turn - ctx.dt;
        let moving = false;
        if (aiming) {
          // Square up to the target, then shoot.
          const want = math.atan2(tx - t.position[0], tz - t.position[2]);
          let d = want - heading;
          while (d > 3.14159) d -= 6.28318;
          while (d < -3.14159) d += 6.28318;
          heading += math.clamp(d, -6 * ctx.dt, 6 * ctx.dt);
          if (aim <= 0 && math.abs(d) < 0.2) {
            const ox = t.position[0];
            const oz = t.position[2];
            const oy = 1.15;
            const dx = tx - ox;
            const dz = tz - oz;
            const dy = ty - oy;
            const yaw = math.atan2(-dx, -dz) + ctx.rng.between(-BOT_AIM_ERROR, BOT_AIM_ERROR);
            const hor = math.sqrt(dx * dx + dz * dz);
            const pitch = math.atan2(dy, hor) + ctx.rng.between(-BOT_AIM_ERROR, BOT_AIM_ERROR);
            const cp = math.cos(pitch);
            const dir: [number, number, number] = [-math.sin(yaw) * cp, math.sin(pitch), -math.cos(yaw) * cp];
            ctx.commands.spawn({
              LocalTransform: { position: [ox + dir[0] * 0.8, oy + dir[1] * 0.8, oz + dir[2] * 0.8], rotation: yawPitchQuat(yaw, pitch), scale: [0.09, 0.09, 3.4] },
              Stone: { velocity: [dir[0] * STONE_SPEED, dir[1] * STONE_SPEED, dir[2] * STONE_SPEED], owner: g.id },
              MeshRenderer: { mesh: 'models/stone.glb', castShadows: false, receiveShadows: false },
            });
            ctx.events.emit(PlaySound, { sound: 'audio/fire', volume: 0.8, pitchRandom: 0.08, spatial: true, position: [ox, oy, oz] });
            triggerAnim(c, i, 'fire');
            aim = ctx.rng.between(5, 10);
            c.set(Critter, i, { loaded: false });
          }
        } else {
          if (aim <= 0) aim = 0.2; // waiting for a target
          if (turn <= 0) {
            heading += ctx.rng.between(-1.8, 1.8);
            turn = ctx.rng.between(0.6, 2.2);
          }
          moving = true;
        }
        const p = { x: t.position[0], z: t.position[2] };
        if (moving) {
          p.x += math.sin(heading) * g.speed * ctx.dt;
          p.z += math.cos(heading) * g.speed * ctx.dt;
          const before = { x: p.x, z: p.z };
          pushOut(p, circles, CRITTER_R, 0);
          if (p.x !== before.x || p.z !== before.z) {
            heading += 2.2; // bumped something: veer off
            turn = 0.5;
          }
          const rr = math.sqrt(p.x * p.x + p.z * p.z);
          if (rr > ARENA - 4) {
            heading = math.atan2(-p.x, -p.z);
            turn = 1;
          }
        }
        c.set(Critter, i, { heading, turn, aim });
        c.set(LocalTransform, i, { position: [p.x, 0, p.z], rotation: yawPitchQuat(heading, 0) });
        setAnimParam(c, i, 'walking', moving);
        setAnimParam(c, i, 'aiming', aiming);
        setAnimParam(c, i, 'dead', false);
      }
    }
  },
});

export const MatchClock = defineSystem({
  name: 'MatchClock',
  runIf: { resource: Flow, field: 'screen', value: 'Playing' },
  queries: { player: query(write(Player)) },
  resources: [write(Match)],
  run(ctx, { player }) {
    const m = ctx.get(Match);
    if (m.phase === 'Playing') {
      const left = m.timeLeft - ctx.dt;
      if (left <= 0) ctx.set(Match, { timeLeft: 0, phase: 'Over', overTimer: 7 });
      else ctx.setField(Match, 'timeLeft', left);
    } else {
      const left = m.overTimer - ctx.dt;
      if (left <= 0) {
        ctx.set(Match, { timeLeft: ROUND_SECONDS, phase: 'Playing', overTimer: 0 });
        for (const c of player.chunks()) for (let i = 0; i < c.length; i++) c.set(Player, i, { score: 0, hits: 0, misses: 0, deaths: 0 });
      } else ctx.setField(Match, 'overTimer', left);
    }
  },
});

export const TempLife = defineSystem({
  name: 'TempLife',
  query: query(write(Temp)),
  run(ctx, q) {
    for (const c of q.chunks()) {
      for (let i = 0; i < c.length; i++) {
        const life = c.get(Temp, i).life - ctx.dt;
        if (life <= 0) ctx.commands.despawn(c.entity(i));
        else c.set(Temp, i, { life });
      }
    }
  },
});

export const StartMusic = defineSystem({
  name: 'StartMusic',
  runIf: { resource: Match },
  run(ctx) {
    if (ctx.step === 2) ctx.events.emit(PlayMusic, { track: 'audio/theme', volume: 0.45, crossfade: 0.5 });
  },
});

/**
 * The app flow: Start -> Loading -> Playing <-> Paused for a solo match (Escape pauses; the UI raises StartSolo, GameReady,
 * ResumeGame, QuitToMenu). An online match is started by the engine, which rebuilds the world with the match seed: this
 * system then finds a match running and goes straight to Playing. Either way the seats and bots the match does not use
 * are removed once it plays.
 */
export const FlowControl = defineSystem({
  name: 'FlowControl',
  resources: [write(Flow), write(Match)],
  queries: { seats: query(read(Player)), bodies: query(read(SeatBody)), rigs: query(read(VmRig)), bots: query(read(Critter)) },
  events: [StartSolo, GameReady, ResumeGame, QuitToMenu, KeyEvent],
  run(ctx, { seats, bodies, rigs, bots }) {
    const f = ctx.get(Flow);
    let screen = f.screen;
    let { mode, loadTime, ready, matchSeed, trimmed } = f;
    const online = multiplayer.match();
    const freshMatch = () => ctx.set(Match, { timeLeft: ROUND_SECONDS, phase: 'Playing', overTimer: 0 });
    if (online) {
      if (screen !== 'Playing' && screen !== 'Paused') {
        screen = 'Playing';
        mode = 'Online';
        ready = true;
        matchSeed += 1;
        trimmed = false;
        freshMatch();
      }
    } else {
      if (ctx.events.count(StartSolo) > 0 && screen === 'Start') {
        screen = 'Loading';
        mode = 'Solo';
        loadTime = 0;
        ready = false;
        matchSeed += 1;
        trimmed = false;
      }
      if (ctx.events.count(GameReady) > 0 && screen === 'Loading') ready = true;
      if (screen === 'Loading') {
        loadTime += ctx.dt;
        if (ready && loadTime >= 1.2) {
          screen = 'Playing';
          freshMatch();
        }
      }
      for (const e of ctx.events.read(KeyEvent)) {
        if (e.code === 39 && e.down) {
          if (screen === 'Playing') screen = 'Paused';
          else if (screen === 'Paused') screen = 'Playing';
        }
      }
      if (ctx.events.count(ResumeGame) > 0 && screen === 'Paused') screen = 'Playing';
      if (ctx.events.count(QuitToMenu) > 0 && (screen === 'Paused' || screen === 'Playing')) screen = 'Start';
    }
    // Once the match plays, only the seats and bots it uses stay.
    if (screen === 'Playing' && !trimmed) {
      trimmed = true;
      const keepSeats = online ? online.players : 1;
      const keepBots = online ? 0 : 8;
      for (const c of seats.chunks()) for (let i = 0; i < c.length; i++) if (c.get(Player, i).index >= keepSeats) ctx.commands.despawn(c.entity(i));
      for (const c of bodies.chunks()) for (let i = 0; i < c.length; i++) if (c.get(SeatBody, i).index >= keepSeats) ctx.commands.despawn(c.entity(i));
      for (const c of rigs.chunks()) for (let i = 0; i < c.length; i++) if (c.get(VmRig, i).index >= keepSeats) ctx.commands.despawn(c.entity(i));
      for (const c of bots.chunks()) for (let i = 0; i < c.length; i++) if (c.get(Critter, i).id > keepBots) ctx.commands.despawn(c.entity(i));
    }
    if (screen !== f.screen || loadTime !== f.loadTime || ready !== f.ready || trimmed !== f.trimmed || mode !== f.mode) ctx.set(Flow, { screen, mode, loadTime, ready, matchSeed, trimmed });
  },
});

/** Seconds an online match waits for the server's first word on who is in a seat before it treats every seat as taken (a fixed match, like a LAN host's, sends none). */
const PRESENCE_WAIT = 0.75;

/**
 * Who is in a seat. Online, every seat starts empty and the server's SeatChanged (open rooms) fills or frees it at the same frame on every
 * device: a new player spawns fresh at the safest spawn point with spawn protection, a player who leaves takes their body with them. A match
 * whose server sends no presence (a fixed match) gets its seats filled after a moment. Solo seats are always taken.
 */
export const SeatPresence = defineSystem({
  name: 'SeatPresence',
  runIf: { resource: Flow, field: 'screen', value: 'Playing' },
  after: ['FlowControl'],
  queries: {
    player: query(write(Player), write(LocalTransform)),
    spawns: query(read(SpawnPoint), read(LocalTransform)),
    critters: query(read(Critter), read(LocalTransform)),
  },
  resources: [write(Flow)],
  events: [SeatChanged],
  run(ctx, { player, spawns, critters }) {
    const online = multiplayer.match();
    const f = ctx.get(Flow);
    let { seated, presence, onlineFor } = f;
    const take = (c: any, i: number, fresh: boolean) => {
      const p = c.get(Player, i);
      const standing: { index: number; x: number; z: number }[] = [];
      for (const oc of player.chunks()) {
        for (let k = 0; k < oc.length; k++) {
          const o = oc.get(Player, k);
          if (o.active && o.state !== 'Dead' && o.index !== p.index) standing.push({ index: o.index, x: oc.get(LocalTransform, k).position[0], z: oc.get(LocalTransform, k).position[2] });
        }
      }
      const at = farthestSpawn(spawns, critters, standing, p.index);
      const reset = fresh ? { score: 0, hits: 0, misses: 0, deaths: 0, deathBy: 0, superCd: 0 } : {};
      c.set(Player, i, { ...reset, active: true, state: 'Alive', loaded: true, freeze: 0, protect: RESPAWN_PROTECT, vy: 0, climbing: false, crouch: false, eye: EYE });
      c.set(LocalTransform, i, { position: [at[0], EYE, at[1]] });
      ctx.commands.spawn({ LocalTransform: { position: [at[0], 0.05, at[1]] }, ParticleSystem: { effect: 'fx/respawn.vfx.json' }, Temp: { life: 2.2 } });
    };
    if (online && !seated) {
      // the match begins with every seat empty: the server says who is in
      for (const c of player.chunks()) for (let i = 0; i < c.length; i++) c.set(Player, i, { active: false });
      seated = true;
      presence = false;
      onlineFor = 0;
    }
    for (const e of ctx.events.read(SeatChanged)) {
      presence = true;
      for (const c of player.chunks()) {
        for (let i = 0; i < c.length; i++) {
          if (c.get(Player, i).index !== e.seat) continue;
          if (e.present) take(c, i, e.fresh); // fresh: a new player (reset the seat's score); else the one it was held for is back
          else c.set(Player, i, { active: false, freeze: 0, vy: 0, climbing: false });
        }
      }
    }
    if (online && !presence) {
      onlineFor += ctx.dt;
      if (onlineFor >= PRESENCE_WAIT) {
        for (const c of player.chunks()) for (let i = 0; i < c.length; i++) if (c.get(Player, i).index < online.players) take(c, i, false);
        presence = true;
      }
    }
    if (seated !== f.seated || presence !== f.presence || onlineFor !== f.onlineFor) ctx.set(Flow, { seated, presence, onlineFor });
  },
});

/** Poses every seat's body (what the other players see) from its Player and drives its Animator. */
export const SeatBodies = defineSystem({
  name: 'SeatBodies',
  after: ['Move', 'Respawn', 'CameraRig'],
  queries: { bodies: query(read(SeatBody), write(LocalTransform), write(Animator)), player: query(read(Player), read(LocalTransform)) },
  events: [ShotFired],
  run(ctx, { bodies, player }) {
    const seats = new Map<number, { yaw: number; x: number; y: number; z: number; walking: boolean; airborne: boolean; frozen: boolean; aiming: boolean; dead: boolean }>();
    for (const c of player.chunks()) {
      for (let i = 0; i < c.length; i++) {
        const p = c.get(Player, i);
        const t = c.get(LocalTransform, i).position;
        seats.set(p.index, { yaw: p.yaw, x: t[0], y: t[1] - p.eye, z: t[2], walking: p.speed > 0.6 && p.vy === 0 && !p.climbing, airborne: p.vy !== 0 && !p.climbing, frozen: p.freeze > 0, aiming: p.aiming, dead: p.state === 'Dead' || !p.active });
      }
    }
    const fired = new Set<number>();
    for (const e of ctx.events.read(ShotFired)) fired.add(e.seat);
    for (const c of bodies.chunks()) {
      for (let i = 0; i < c.length; i++) {
        const b = seats.get(c.get(SeatBody, i).index);
        if (!b) continue;
        // a dead player leaves a corpse behind; the body itself is hidden until the respawn (and an empty seat shows none)
        const k = b.dead ? 0 : 1;
        // the model faces +Z and a player's look faces -Z: turn the body round to face where its player looks
        c.set(LocalTransform, i, { position: [b.x, b.y, b.z], rotation: yawPitchQuat(b.yaw + 3.14159265, 0), scale: [k, k, k] });
        setAnimParam(c, i, 'walking', b.walking);
        setAnimParam(c, i, 'airborne', b.airborne);
        setAnimParam(c, i, 'frozen', b.frozen);
        setAnimParam(c, i, 'aiming', b.aiming);
        setAnimParam(c, i, 'dead', false);
        if (fired.has(c.get(SeatBody, i).index)) triggerAnim(c, i, 'fire');
      }
    }
  },
});

export const ApplySettings = defineSystem({
  name: 'ApplySettings',
  resources: [write(Settings)],
  runOn: [SetSensitivity],
  events: [SetSensitivity],
  run(ctx) {
    for (const e of ctx.events.read(SetSensitivity)) ctx.setField(Settings, 'sensitivity', math.clamp(e.value, 0.2, 3));
  },
});

/** Drives each seat's first-person rig Animator from what that seat did this step (idle / walk loop; fire, reload, jump, launch one-shots; dead). Only this device's seat is shown. */
export const ViewmodelAnim = defineSystem({
  name: 'ViewmodelAnim',
  after: ['Move', 'Fire', 'StoneFlight', 'Respawn'],
  queries: { rig: query(write(Animator), read(VmRig)), player: query(read(Player)) },
  events: [ShotFired, CritterHit, Jumped, SuperJumped, PlayerRespawned],
  run(ctx, { rig, player }) {
    const state = new Map<number, { walking: boolean; dead: boolean }>();
    for (const c of player.chunks()) {
      for (let i = 0; i < c.length; i++) {
        const p = c.get(Player, i);
        state.set(p.index, { walking: p.speed > 0.6 && p.vy === 0, dead: p.state === 'Dead' });
      }
    }
    const seatsOf = <E extends { seat: number }>(events: Iterable<E>): Set<number> => new Set(Array.from(events, (e) => e.seat));
    const fired = seatsOf(ctx.events.read(ShotFired));
    const hit = seatsOf(ctx.events.read(CritterHit));
    const respawned = seatsOf(ctx.events.read(PlayerRespawned));
    const jumped = seatsOf(ctx.events.read(Jumped));
    const launched = seatsOf(ctx.events.read(SuperJumped));
    for (const c of rig.chunks()) {
      for (let i = 0; i < c.length; i++) {
        const seat = c.get(VmRig, i).index;
        const st = state.get(seat);
        if (!st) continue;
        setAnimParam(c, i, 'walking', st.walking);
        setAnimParam(c, i, 'dead', st.dead);
        if (fired.has(seat)) triggerAnim(c, i, 'fire');
        if (hit.has(seat) || respawned.has(seat)) triggerAnim(c, i, 'reload');
        if (launched.has(seat)) triggerAnim(c, i, 'super');
        else if (jumped.has(seat)) triggerAnim(c, i, 'jump');
      }
    }
  },
});
