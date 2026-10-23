import { math, query, read, write, LocalTransform } from '@gameengine/runtime';
import { defineCheat } from '@gameengine/runtime/cheats';
import { Flow, Match, Player, SoloLook } from './schema.gen.ts';
import { cleanName, setPlayerName } from './netstate.ts';

export const AimAt = defineCheat({
  id: 'aim.at',
  group: 'Slingshot',
  title: 'Aim at a point',
  description: 'Turns the player to face a ground position (x, z), chest high.',
  params: { x: { type: 'number', default: 0 }, z: { type: 'number', default: 0 } },
  query: query(write(Player), read(LocalTransform)),
  resources: [write(SoloLook)],
  run(ctx, { x, z }, q) {
    for (const c of q.chunks()) {
      for (let i = 0; i < c.length; i++) {
        const [px, py, pz] = c.get(LocalTransform, i).position;
        const dx = x - px;
        const dz = z - pz;
        const yaw = math.atan2(-dx, -dz);
        const pitch = math.atan2(0.9 - py, math.sqrt(dx * dx + dz * dz));
        c.set(Player, i, { yaw, pitch });
        ctx.set(SoloLook, { yaw, pitch }); // the solo input keeps looking where the cheat turned
      }
    }
  },
});

export const FinishRound = defineCheat({
  id: 'round.finish',
  group: 'Match',
  title: 'Finish the round',
  description: 'Leaves a tenth of a second on the clock.',
  resources: [write(Match)],
  run(ctx) {
    ctx.setField(Match, 'timeLeft', 0.1);
  },
});

export const Teleport = defineCheat({
  id: 'player.teleport',
  group: 'Slingshot',
  title: 'Teleport the player',
  description: 'Moves a player (seat 0 by default) to (x, z) on the ground, looking along yaw (radians, 0 = toward -Z).',
  params: { x: { type: 'number', default: 0 }, z: { type: 'number', default: 0 }, yaw: { type: 'number', default: 0 }, seat: { type: 'number', default: 0 } },
  query: query(write(Player), write(LocalTransform)),
  resources: [write(SoloLook)],
  run(ctx, { x, z, yaw, seat }, q) {
    for (const c of q.chunks()) {
      for (let i = 0; i < c.length; i++) {
        if (c.get(Player, i).index !== seat) continue;
        c.set(LocalTransform, i, { position: [x, 1.65, z] });
        c.set(Player, i, { yaw, pitch: 0, vy: 0 });
        if (seat === 0) ctx.set(SoloLook, { yaw, pitch: 0 });
      }
    }
  },
});

export const SkipToPlay = defineCheat({
  id: 'flow.play',
  group: 'Match',
  title: 'Skip the menus',
  description: 'Jumps from the start screen straight into a running match (seats > 1 keeps that many seats, for tests that drive several players).',
  params: { seats: { type: 'number', default: 1 } },
  resources: [write(Flow)],
  run(ctx, { seats }) {
    ctx.set(Flow, { screen: 'Playing', trimmed: seats > 1 });
  },
});

export const SetLaunchCooldown = defineCheat({
  id: 'launch.cooldown',
  group: 'Slingshot',
  title: 'Set the launch cooldown',
  description: 'Sets the seconds left on the double-jump launch (0 = ready).',
  params: { seconds: { type: 'number', default: 30, min: 0, max: 40 } },
  query: query(write(Player)),
  run(_ctx, { seconds }, q) {
    for (const c of q.chunks()) for (let i = 0; i < c.length; i++) c.set(Player, i, { superCd: seconds });
  },
});

export const SetScore = defineCheat({
  id: 'player.score',
  group: 'Match',
  title: 'Set the score',
  description: 'Sets every player\'s points (the half-loss on a hit rounds from it).',
  params: { points: { type: 'number', default: 10, min: 0, max: 999 } },
  query: query(write(Player)),
  run(_ctx, { points }, q) {
    for (const c of q.chunks()) for (let i = 0; i < c.length; i++) c.set(Player, i, { score: points });
  },
});

export const SetName = defineCheat({
  id: 'net.name',
  group: 'Match',
  title: 'Set the online name',
  description: 'Sets the name this player tells the others in an online match (what the lobby name box types).',
  params: { name: { type: 'string', default: 'Tester' } },
  presentation: true,
  run({ name }) {
    setPlayerName(cleanName(name));
  },
});
