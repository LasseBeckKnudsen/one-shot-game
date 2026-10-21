/**
 * Effects that follow the player or the world rather than a sim event: footstep and jump dust, the double-jump
 * burst and trail, the air-ready sparkle and the ambience. The sim only spawns the effect hosts (`FxHosts`, once);
 * everything else is LateUpdate: it reads the sim, writes only `FxState` (presentation) and plays bursts with
 * `burstAt`, so no hash ever sees it. Hit, miss, shot, respawn and critter effects are spawned by their sim sites.
 */
import { defineSystem, query, read, write, math, burstAt, drawnTransform, LocalTransform, ParticleSystem } from '@gameengine/runtime';
import { localSeat } from './net.ts';
import { AirReady, CritterHit, FxHost, FxState, Player, Stone, StoneMissed } from './schema.gen.ts';

const EYE = 1.65; // keep in step with sim.ts
const STRIDE = 2.8; // metres per footstep puff: about one per weapon bob at full speed
const DOUBLE_JUMP_KICK = 3; // a sudden rise in vy while airborne is the double jump (whatever sets it)
const TRAIL_EVERY = 2; // steps between trail instances

/** kind -> effect, and whether it plays on its own (the rest only host bursts). */
const HOSTS: [kind: string, effect: string, emitting: boolean][] = [
  ['step', 'fx/footstep_dust.vfx.json', false],
  ['jump', 'fx/jump_dust.vfx.json', false],
  ['land', 'fx/land_dust.vfx.json', false],
  ['superjump', 'fx/superjump.vfx.json', false],
  ['trail', 'fx/superjump_trail.vfx.json', false],
  ['tracer', 'fx/stone_trail.vfx.json', false],
  ['tracerfar', 'fx/stone_trail_far.vfx.json', false],
  ['tracerstars', 'fx/stone_sparkle.vfx.json', false],
  ['tracerstarsfar', 'fx/stone_sparkle_far.vfx.json', false],
  ['airready', 'fx/air_ready.vfx.json', false],
  ['ambient', 'fx/ambient_motes.vfx.json', true],
];

/** Spawns the effect hosts once, at step 1. */
export const FxHosts = defineSystem({
  name: 'FxHosts',
  query: query(read(FxHost)),
  run(ctx, q) {
    if (ctx.step < 1 || q.count > 0) return;
    for (const [kind, effect, emitting] of HOSTS) {
      const y = kind === 'ambient' ? 3 : 0;
      ctx.commands.spawn({ LocalTransform: { position: [0, y, 0] }, FxHost: { kind }, ParticleSystem: { effect, emitting } });
    }
  },
});

export const FxMovement = defineSystem({
  name: 'FxMovement',
  stage: 'LateUpdate',
  queries: { player: query(read(Player)), hosts: query(read(FxHost)) },
  resources: [write(FxState)],
  events: [AirReady],
  run(ctx, { player, hosts }) {
    const st = ctx.get(FxState);
    if (ctx.step === st.step) return; // one look per sim step
    const me = localSeat();
    let airReady = false;
    for (const e of ctx.events.read(AirReady)) if (e.seat === me) airReady = true;
    const steps = math.min(4, math.max(1, ctx.step - st.step));

    const host: Record<string, any> = {};
    for (const c of hosts.chunks()) for (let i = 0; i < c.length; i++) host[c.get(FxHost, i).kind] = c.entity(i);

    for (const c of player.chunks()) {
      for (let row = 0; row < c.length; row++) {
      const p = c.get(Player, row);
      if (p.index !== me) continue;
      const d = drawnTransform(c.entity(row));
      if (!d) continue;
      const [x, y, z] = d.position;
      const feet = y - p.eye;
      const dead = p.state === 'Dead';
      const vy = p.vy;
      const grounded = !dead && math.abs(vy) < 1e-6;
      const rx = math.cos(p.yaw);
      const rz = -math.sin(p.yaw);
      if (airReady && host['airready']) {
        // Just ahead of the eye and a little low: where the sling hangs in the first-person view.
        const cp = math.cos(p.pitch);
        burstAt(host['airready'], [[x - math.sin(p.yaw) * cp * 0.7, y + math.sin(p.pitch) * 0.7 - 0.2, z - math.cos(p.yaw) * cp * 0.7]]);
      }
      let { minVy, stride, foot, trailUntil } = st;
      let wasGrounded = st.grounded;
      if (dead) {
        wasGrounded = true;
        minVy = 0;
        trailUntil = 0;
      } else {
        // Takeoff and double jump: vy jumps up, from the ground or from the air.
        if (vy > 2 && vy > st.prevVy + DOUBLE_JUMP_KICK) {
          if (wasGrounded) {
            if (host['jump']) burstAt(host['jump'], [[x, feet + 0.03, z]]);
          } else {
            if (host['superjump']) burstAt(host['superjump'], [[x, feet + 0.05, z]]);
            trailUntil = ctx.step + 150;
          }
          minVy = 0;
        }
        if (!grounded) minVy = math.min(minVy, vy);
        // Landing: back on the ground after a real fall.
        if (grounded && !wasGrounded) {
          if (minVy < -3 && host['land']) burstAt(host['land'], [[x, feet + 0.03, z]]);
          minVy = 0;
          trailUntil = 0;
        }
        // Footsteps while running on the ground.
        if (grounded && p.speed > 1) {
          stride += p.speed * ctx.dt * steps;
          if (stride >= STRIDE) {
            stride -= STRIDE;
            foot = !foot;
            // Kicked up ahead of the foot and to the side, where a first-person camera can see it.
            const side = foot ? 0.5 : -0.5;
            const ahead = 1.5;
            if (host['step']) burstAt(host['step'], [[x + rx * side - math.sin(p.yaw) * ahead, feet + 0.05, z + rz * side - math.cos(p.yaw) * ahead]]);
          }
        } else if (grounded) stride = STRIDE * 0.5;
        // Double-jump trail along the climb, a sparkle string below and around the camera.
        if (!grounded && ctx.step < trailUntil && ctx.step % TRAIL_EVERY === 0 && host['trail']) {
          burstAt(host['trail'], [[x, y - 0.7, z]]);
        }
      }
      ctx.set(FxState, { step: ctx.step, prevVy: vy, minVy, grounded: grounded || dead, stride, foot, trailUntil });
      }
    }
  },
});

const TRACER_GLOWS = 5; // glow orbs laid along each step of the stone (it flies 5 m a step)
const TRACER_STARS = 2;
const TRACER_FROM = 5; // nearer than this to the eye a glow would fill the view
const TRACER_FAR = 25; // beyond this the 'far' (bigger) variants keep the tracer readable

/** Lays a continuous amber tracer along the stone's flight (it moves 5 m a step, too far apart for a particle emitter on it). */
export const FxTracer = defineSystem({
  name: 'FxTracer',
  stage: 'LateUpdate',
  queries: { stones: query(read(Stone), read(LocalTransform)), hosts: query(read(FxHost)), player: query(read(Player), read(LocalTransform)) },
  resources: [write(FxState)],
  events: [CritterHit, StoneMissed],
  run(ctx, { stones, hosts, player }) {
    const st = ctx.get(FxState);
    let ex = 0;
    let ey = 0;
    let ez = 0;
    const me = localSeat();
    for (const c of player.chunks()) for (let i = 0; i < c.length; i++) if (c.get(Player, i).index === me) [ex, ey, ez] = c.get(LocalTransform, i).position;
    const out: Record<string, number[][]> = { tracer: [], tracerfar: [], tracerstars: [], tracerstarsfar: [] };
    const put = (kind: string, x: number, y: number, z: number) => {
      const d = math.sqrt((x - ex) ** 2 + (y - ey) ** 2 + (z - ez) ** 2);
      if (d < TRACER_FROM) return;
      out[d > TRACER_FAR ? kind + 'far' : kind]!.push([x, y, z]);
    };
    const lay = (a: readonly number[], b: readonly number[]) => {
      for (let k = 1; k <= TRACER_GLOWS; k++) {
        const f = k / TRACER_GLOWS;
        put('tracer', a[0]! + (b[0]! - a[0]!) * f, a[1]! + (b[1]! - a[1]!) * f, a[2]! + (b[2]! - a[2]!) * f);
      }
      for (let k = 0; k < TRACER_STARS; k++) {
        const f = (k + 0.5) / TRACER_STARS;
        put('tracerstars', a[0]! + (b[0]! - a[0]!) * f, a[1]! + (b[1]! - a[1]!) * f, a[2]! + (b[2]! - a[2]!) * f);
      }
    };
    const newStep = ctx.step !== st.tracerStep;
    let last: [number, number, number] | null = null;
    for (const c of stones.chunks()) {
      for (let i = 0; i < c.length; i++) {
        const p1 = c.get(LocalTransform, i).position;
        last = [p1[0], p1[1], p1[2]];
        if (!newStep) continue;
        const v = c.get(Stone, i).velocity;
        lay([p1[0] - v[0] * ctx.dt, p1[1] - v[1] * ctx.dt, p1[2] - v[2] * ctx.dt], p1);
      }
    }
    // The step the stone is removed in: run the tracer on to where it ended.
    let end: readonly number[] | null = null;
    for (const e of ctx.events.read(CritterHit)) end = e.position;
    for (const e of ctx.events.read(StoneMissed)) end = e.position;
    if (end && st.hasStone) {
      lay(st.lastStone, end);
      ctx.set(FxState, { hasStone: false });
    }
    for (const c of hosts.chunks()) {
      for (let i = 0; i < c.length; i++) {
        const pts = out[c.get(FxHost, i).kind];
        if (pts && pts.length > 0) burstAt(c.entity(i), pts);
      }
    }
    if (last) ctx.set(FxState, { tracerStep: ctx.step, lastStone: last, hasStone: true });
  },
});
