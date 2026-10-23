// Multiplayer logic: the sim reads only the packed per-seat input, so several seats can be driven from one world.
import { worldTest, expect } from '@gameengine/test';
import { LocalTransform, PlayerInputs } from '@gameengine/runtime';
import { BTN_FIRE, packLook, unpackLook, BTN_LOOK, predictInput } from '../src/input.ts';
import { Player } from '../src/schema.gen.ts';

const seatRows = (world: any) => world.entities(Player).map((e: any) => ({ e, p: world.get(e, Player), t: world.get(e, LocalTransform).position }));

worldTest('the packed look keeps the angle to a fraction of a degree and a zero word leaves the facing alone', async () => {
  for (const yaw of [0, 0.5, 3.1, 5.9, -1.2]) {
    for (const pitch of [-1.3, 0, 0.7, 1.349]) {
      const l = unpackLook(packLook(yaw, pitch));
      const twoPi = 2 * Math.PI;
      const dy = Math.abs((((l.yaw - yaw) % twoPi) + 3 * Math.PI) % twoPi - Math.PI);
      expect(dy).toBeLessThan(0.0016);
      expect(Math.abs(l.pitch - pitch)).toBeLessThan(0.0007);
    }
  }
  expect(packLook(1, 0) & BTN_LOOK).toBe(BTN_LOOK);
});

worldTest('every seat is driven by its own input: one walks, one stays', async ({ world, step, cheat }) => {
  await cheat('flow.play', { seats: 4 });
  await step(3);
  expect(seatRows(world).length).toBe(4);
  const before = seatRows(world).map((r: any) => r.t.slice());
  // seat 2 looks along -x and walks forward for a second
  world.setResource(PlayerInputs, { players: 4, buttons2: packLook(Math.PI / 2, 0), stick2: [0, 1] });
  await step(60);
  const after = seatRows(world);
  const moved = (i: number) => Math.hypot(after[i].t[0] - before[i][0], after[i].t[2] - before[i][2]);
  expect(moved(2)).toBeGreaterThan(4);
  expect(after[2].p.yaw).toBeGreaterThan(1.5);
  expect(after[2].p.yaw).toBeLessThan(1.65);
  for (const i of [0, 1, 3]) expect(moved(i)).toBeLessThan(0.5); // the others had no input: they only settle onto the ground
});

worldTest('a stone from one seat scores for that seat and ends the other seat\'s life', async ({ world, step, cheat }) => {
  await cheat('flow.play', { seats: 4 });
  await step(260); // spawn protection (3 s) is over
  let done = false;
  for (let k = 0; k < 8 && !done; k++) {
    const a = (k / 8) * 2 * Math.PI;
    // seat 0 stands still; seat 1 steps around it at 6 m, facing it, and fires (cover in the way just makes it miss)
    await cheat('player.teleport', { seat: 0, x: 0, z: 15.7, yaw: 0 });
    const sx = Math.sin(a) * 6;
    const sz = 15.7 + Math.cos(a) * 6;
    await cheat('player.teleport', { seat: 1, x: sx, z: sz, yaw: 0 });
    await step(2);
    const yaw = Math.atan2(sx - 0, sz - 15.7); // forward = (-sin yaw, -cos yaw) points at seat 0
    world.setResource(PlayerInputs, { players: 4, buttons1: (packLook(yaw, 0) | BTN_FIRE) >>> 0 });
    await step(4);
    world.setResource(PlayerInputs, { players: 4, buttons1: packLook(yaw, 0) });
    await step(20);
    const rows = seatRows(world);
    if (rows[1]!.p.hits > 0) {
      done = true;
      expect(rows[1]!.p.score).toBe(1);
      expect(rows[0]!.p.state).toBe('Dead');
      expect(rows[0]!.p.deaths).toBe(1);
      expect(rows[0]!.p.deathBy).toBe(1001);
      expect(rows[1]!.p.loaded).toBe(true);
    } else {
      await step(200); // a miss: wait out the respawn and try the next spot
    }
  }
  expect(done).toBe(true);
});

worldTest('a remote look is carried along its last turn, never past a few frames, and keeps its buttons', async () => {
  const at = (frame: number, yaw: number, pitch: number, buttons = 0) => ({ frame, buttons: (packLook(yaw, pitch) | buttons) >>> 0, stick: [0, 1] as [number, number] });
  // turning 0.02 rad a frame: three frames on it has moved on by about 0.045 (a quarter is not kept)
  const g = predictInput([at(10, 1.0, 0), at(11, 1.02, 0.01, BTN_FIRE)], 14)!;
  const l = unpackLook(g.buttons);
  expect(l.yaw).toBeGreaterThan(1.02 + 0.04);
  expect(l.yaw).toBeLessThan(1.02 + 0.05);
  expect(l.pitch).toBeGreaterThan(0.01);
  expect(g.buttons & BTN_FIRE).toBe(BTN_FIRE);
  expect(g.stick).toEqual([0, 1]);
  // a long gap runs ahead by at most 6 frames
  const far = unpackLook(predictInput([at(10, 1.0, 0), at(11, 1.02, 0), ], 60)!.buttons);
  expect(far.yaw).toBeLessThan(1.02 + 6 * 0.02);
  // across the wrap it takes the short way
  const wrap = unpackLook(predictInput([at(10, 6.27, 0), at(11, 0.02, 0)], 12)!.buttons);
  expect(wrap.yaw).toBeLessThan(0.1);
  // nothing to go on: no history, one input, no look, a frame that is not after the newest
  expect(predictInput([], 5)).toBe(null);
  expect(predictInput([at(10, 1, 0)], 12)).toBe(null);
  expect(predictInput([{ frame: 9, buttons: 0, stick: [0, 0] }, { frame: 10, buttons: 0, stick: [0, 0] }], 12)).toBe(null);
  expect(predictInput([at(10, 1, 0), at(11, 1.1, 0)], 11)).toBe(null);
  expect(predictInput([at(11, 1, 0), at(10, 1.1, 0)], 14)).toBe(null);
});
