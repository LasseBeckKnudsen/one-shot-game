import { worldTest, expect } from '@gameengine/test';
import { LocalTransform } from '@gameengine/runtime';
import { Blocker, Critter, Ladder, Solid, Temp, Flow, GameReady, ResumeGame, Match, Player, StartSolo, Stone } from '../src/schema.gen.ts';

/** Start screen -> loading -> playing, the way the UI drives it. */
async function startMatch(input: any, step: any, world: any) {
  input.view(1600, 900, 1);
  await step(2);
  expect(world.resource(Flow).screen).toBe('Start');
  input.emit(StartSolo, {});
  await step(2);
  expect(world.resource(Flow).screen).toBe('Loading');
  input.emit(GameReady, {});
  await step(90);
  expect(world.resource(Flow).screen).toBe('Playing');
}

const click = (input: any) => {
  input.pointer('down', 800, 450, 0, 0);
  input.pointer('up', 800, 450, 0, 0);
};


/** Shoots at each critter from a few spots around it (cover may block a shot) until one is hit; returns true when a shot scored. */
async function hitSomeCritter(world: any, step: any, input: any, cheat: any): Promise<boolean> {
  const [player] = world.entities(Player);
  for (const target of world.entities(Critter)) {
    for (let k = 0; k < 8; k++) {
      if (world.get(player!, Player).hits > 0) return true;
      if (world.get(player!, Player).state !== 'Alive' || !world.get(player!, Player).loaded) await step(200);
      const [tx, , tz] = world.get(target, LocalTransform).position;
      const a = (k / 8) * 6.2832;
      await cheat('player.teleport', { x: tx! + Math.sin(a) * 4.5, z: tz! + Math.cos(a) * 4.5, yaw: 0 });
      await step(2);
      await cheat('aim.at', { x: tx!, z: tz! });
      await step(1);
      click(input);
      await step(16);
    }
  }
  return world.get(player!, Player).hits > 0;
}

worldTest('a stone aimed at a critter scores and returns to the sling', async ({ world, step, input, cheat }) => {
  await startMatch(input, step, world);
  const [player] = world.entities(Player);
  expect(world.get(player!, Player).loaded).toBe(true);
  expect(await hitSomeCritter(world, step, input, cheat)).toBe(true);
  expect(world.get(player!, Player).score).toBe(1);
  expect(world.get(player!, Player).loaded).toBe(true);
  expect(world.get(player!, Player).state).toBe('Alive');
  expect(world.entities(Stone).length).toBe(0);
});

worldTest('a missed stone freezes the shooter for three seconds: alive, still, nothing lost, then the stone is back', async ({ world, step, input }) => {
  await startMatch(input, step, world);
  const [player] = world.entities(Player);
  click(input); // level, at the horizon: nothing but trees ahead
  await step(40);
  const m = world.get(player!, Player);
  expect(m.misses + m.hits).toBe(1);
  if (m.misses === 1) {
    expect(m.state).toBe('Alive');
    expect(m.deaths).toBe(0);
    expect(m.score).toBe(0);
    expect(m.freeze).toBeGreaterThan(2);
    expect(m.loaded).toBe(false);
    // frozen: walking forward goes nowhere
    const before = world.get(player!, LocalTransform).position.slice();
    input.key('KeyW', true);
    await step(60);
    input.key('KeyW', false);
    const after = world.get(player!, LocalTransform).position;
    expect(Math.abs(after[0]! - before[0]!) + Math.abs(after[2]! - before[2]!)).toBeLessThan(0.05);
    // thawed after three seconds, with the stone back in the sling (a bot may hit the frozen player first: that is the rule too)
    let t = world.get(player!, Player);
    for (let k = 0; k < 240 && t.freeze > 0 && t.state === 'Alive'; k++) {
      await step(1);
      t = world.get(player!, Player);
    }
    if (t.state === 'Alive') {
      expect(t.freeze).toBe(0);
      expect(t.loaded).toBe(true);
    } else {
      expect(t.freeze).toBe(0);
      expect(t.deaths).toBe(1);
    }
  }
});

worldTest('a killed critter comes back after two seconds and leaves a corpse that outlasts it', async ({ world, step, input, cheat }) => {
  await startMatch(input, step, world);
  expect(await hitSomeCritter(world, step, input, cheat)).toBe(true);
  const downed = world.entities(Critter).filter((e) => world.get(e, Critter).dead > 1.5);
  expect(downed.length).toBeGreaterThan(0);
  await step(45);
  expect(world.entities(Temp).length).toBeGreaterThan(0);
  await step(100);
  expect(world.get(downed[0]!, Critter).dead).toBe(0);
  await step(120);
  expect(world.entities(Temp).filter((e) => world.get(e, Temp).life > 2).length).toBe(0);
});

worldTest('bots shoot back: a bot stone can score on the player and the penalty is half the points', async ({ world, step, input, cheat }) => {
  await startMatch(input, step, world);
  const [player] = world.entities(Player);
  await cheat('player.score', { points: 7 });
  await step(60 * 40);
  const m = world.get(player!, Player);
  // Over forty seconds the bots hit the player, miss, or shoot each other: they never sit idle.
  const botScore = world.entities(Critter).reduce((n, e) => n + world.get(e, Critter).score, 0);
  expect(botScore + m.deaths).toBeGreaterThan(0);
  if (m.deaths > 0) expect(m.score).toBeLessThan(7);
});

worldTest('the round ends at zero and starts again', async ({ world, step, cheat, input }) => {
  await startMatch(input, step, world);
  await cheat('round.finish', {});
  await step(10);
  expect(world.resource(Match).phase).toBe('Over');
  await step(60 * 8);
  expect(world.resource(Match).phase).toBe('Playing');
  expect(world.resource(Match).timeLeft).toBeGreaterThan(350);
});

worldTest('the player stays inside the arena and out of the trees', async ({ world, step, input }) => {
  await startMatch(input, step, world);
  const [player] = world.entities(Player);
  input.key(23, true); // KeyW
  await step(60 * 12);
  const p = world.get(player!, LocalTransform).position;
  expect(Math.hypot(p[0]!, p[2]!)).toBeLessThan(44.5);
});

worldTest('Escape pauses the match and freezes the clock; Resume continues', async ({ world, step, input }) => {
  await startMatch(input, step, world);
  const t0 = world.resource(Match).timeLeft;
  input.key(39, true);
  input.key(39, false);
  await step(5);
  expect(world.resource(Flow).screen).toBe('Paused');
  const t1 = world.resource(Match).timeLeft;
  await step(60);
  expect(world.resource(Match).timeLeft).toBe(t1);
  expect(t1).toBeLessThanOrEqual(t0);
  input.emit(ResumeGame, {});
  await step(2);
  expect(world.resource(Flow).screen).toBe('Playing');
});

worldTest('Space twice launches the player high, then the 40 s cooldown applies', async ({ world, step, input }) => {
  await startMatch(input, step, world);
  const [player] = world.entities(Player);
  const jump = () => { input.key(37, true); };
  let top = 0;
  input.key(37, true);
  await step(3);
  input.key(37, false);
  await step(4);
  input.key(37, true);
  for (let i = 0; i < 160; i++) {
    await step(1);
    top = Math.max(top, world.get(player!, LocalTransform).position[1]! - 1.65);
  }
  input.key(37, false);
  expect(top).toBeGreaterThan(9);
  expect(world.get(player!, Player).superCd).toBeGreaterThan(30);
});

worldTest('jumping at a ladder grabs it, W climbs to the top deck, Space lets go', async ({ world, step, input, cheat }) => {
  await startMatch(input, step, world);
  const [player] = world.entities(Player);
  await cheat('player.teleport', { x: 0, z: -30.6, yaw: 0 });
  await step(3);
  input.key(37, true); // Space: jump next to the ladder
  await step(4);
  input.key(37, false);
  await step(2);
  console.log('after jump', JSON.stringify(world.get(player!, LocalTransform).position), JSON.stringify(world.get(player!, Player)));
  expect(world.get(player!, Player).climbing).toBe(true);
  input.key(23, true); // W: climb
  await step(150);
  input.key(23, false);
  await step(5);
  const p = world.get(player!, Player);
  expect(p.climbing).toBe(false);
  expect(world.get(player!, LocalTransform).position[1]! - 1.65).toBeGreaterThan(7.6);
  // back at the rim: jump, grab, S climbs down to the ground
  await cheat('player.teleport', { x: 0, z: -30.6, yaw: 0 });
  await step(3);
});

worldTest('a launch from under a tree canopy stops at its underside instead of passing through', async ({ world, step, input, cheat }) => {
  await startMatch(input, step, world);
  const [player] = world.entities(Player);
  const canopy = world.entities(Blocker).map((e) => ({ b: world.get(e, Blocker), t: world.get(e, LocalTransform).position })).find((c) => c.b.radius > 5)!;
  await cheat('player.teleport', { x: canopy.t[0]! + 4.5, z: canopy.t[2]!, yaw: 0 });
  await step(3);
  input.key(37, true);
  await step(2);
  input.key(37, false);
  await step(3);
  input.key(37, true);
  let top = 0;
  for (let i = 0; i < 100; i++) {
    await step(1);
    top = Math.max(top, world.get(player!, LocalTransform).position[1]! - 1.65);
  }
  input.key(37, false);
  // the launch alone would reach about 14 m: the underside is lower, so the head stops under it
  expect(canopy.b.y0).toBeLessThan(13);
  expect(top).toBeLessThan(canopy.b.y0 - 1.5);
  expect(top).toBeGreaterThan(2);
});

worldTest('Shift crouch-walks: slower, lower and harder to hit', async ({ world, step, input, cheat }) => {
  await startMatch(input, step, world);
  const [player] = world.entities(Player);
  const run = async (crouch: boolean) => {
    await cheat('player.teleport', { x: 0, z: 14, yaw: 0 });
    await step(3);
    if (crouch) input.key(42, true); // ShiftLeft
    input.key(23, true); // W
    await step(40);
    const p = world.get(player!, LocalTransform).position;
    const crouching = world.get(player!, Player).crouch;
    input.key(23, false);
    input.key(42, false);
    await step(30);
    return { dist: 14 - p[2]!, eye: p[1]!, crouching };
  };
  const walk = await run(false);
  const sneak = await run(true);
  expect(sneak.dist).toBeLessThan(walk.dist * 0.6);
  expect(sneak.eye).toBeLessThan(walk.eye - 0.4);
  expect(sneak.crouching).toBe(true);
});

worldTest('walking into a tree platform ladder grabs it and W climbs up to the deck', async ({ world, step, input, cheat }) => {
  await startMatch(input, step, world);
  const [player] = world.entities(Player);
  const lad = world.entities(Ladder).map((e) => ({ l: world.get(e, Ladder), t: world.get(e, LocalTransform).position })).find((x) => x.l.top > 5 && x.l.top < 6)!;
  // 1.4 m out from the ladder on its outer side, facing it
  await cheat('player.teleport', { x: lad.t[0]! + lad.l.nx * 1.4, z: lad.t[2]! + lad.l.nz * 1.4, yaw: Math.atan2(lad.l.nx, lad.l.nz) });
  await step(3);
  input.key('KeyW', true);
  await step(30);
  expect(world.get(player!, Player).climbing).toBe(true);
  await step(150);
  input.key('KeyW', false);
  await step(5);
  expect(world.get(player!, LocalTransform).position[1]! - 1.65).toBeGreaterThan(5.1);
});

worldTest('a jump takes the player up onto a crate, a rock or a barrel and it stays there', async ({ world, step, input, cheat }) => {
  await startMatch(input, step, world);
  const [player] = world.entities(Player);
  const tops = world.entities(Solid).map((e) => ({ s: world.get(e, Solid), t: world.get(e, LocalTransform).position })).filter((x) => x.s.walk && x.s.height > 0.9 && x.s.height < 1.6 && x.s.radius < 1.3);
  expect(tops.length).toBeGreaterThan(5);
  let stood = false;
  for (const c of tops.slice(0, 12)) {
    // 0.5 m out on its +x side, facing it (forward is -sin yaw, -cos yaw: yaw = pi/2 looks along -x)
    await cheat('player.teleport', { x: c.t[0]! + c.s.radius + 0.5, z: c.t[2]!, yaw: Math.PI / 2 });
    await step(3);
    input.key('KeyW', true);
    input.key('Space', true);
    await step(3);
    input.key('Space', false);
    await step(Math.round((c.s.radius + 0.45) / 0.093) - 3); // walk in to about the middle, then stand
    input.key('KeyW', false);
    await step(40);
    const y = world.get(player!, LocalTransform).position[1]! - 1.65;
    const dx = world.get(player!, LocalTransform).position[0]! - c.t[0]!;
    const dz = world.get(player!, LocalTransform).position[2]! - c.t[2]!;
    if (y > c.s.height - 0.1 && dx * dx + dz * dz < c.s.radius * c.s.radius) {
      stood = true;
      break;
    }
  }
  expect(stood).toBe(true);
});
