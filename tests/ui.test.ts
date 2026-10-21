// The app flow as the UI drives it: start screen -> loading (its controller decides when the game is ready) -> HUD,
// Escape -> pause menu (resume, sliders, quit). Nothing here emits GameReady: the loading controller does.
import { expect, renderTest } from '@gameengine/test';
import { Flow, Match, Player, Settings } from '../src/schema.gen.ts';

const ESCAPE = 39;

/** Presses and releases Escape. */
async function escape(input: any, step: any) {
  input.key(ESCAPE, true);
  await step(1);
  input.key(ESCAPE, false);
  await step(2);
}

/** Waits (in frames) until the UI shows an element with this id, or fails. */
async function untilShown(ui: any, step: any, id: string, frames = 60) {
  for (let i = 0; i < frames; i++) {
    if (ui.interactables().some((e: any) => e.id === id)) return;
    await step(1);
  }
  throw new Error(`'${id}' never took presses`);
}

async function toMatch(input: any, step: any, ui: any, world: any, button = 'solo', size: [number, number] = [1920, 1080]) {
  input.view(size[0], size[1], 1);
  await step(3);
  await untilShown(ui, step, button);
  await ui.press(button);
  await step(5);
  expect(world.resource(Flow).screen).toBe('Loading');
  for (let i = 0; i < 400 && world.resource(Flow).screen === 'Loading'; i++) await step(1);
}

renderTest('the start screen shows first, with both ways in', async ({ world, step, input, ui }) => {
  input.view(1920, 1080, 1);
  await step(3);
  expect(world.resource(Flow).screen).toBe('Start');
  await untilShown(ui, step, 'solo');
  await untilShown(ui, step, 'join');
});

renderTest('CONTROLS & SETTINGS opens the options dialog over the start screen and Back closes it', async ({ world, step, input, ui }) => {
  input.view(1920, 1080, 1);
  await step(3);
  await untilShown(ui, step, 'options');
  await ui.press('options');
  await step(5);
  await untilShown(ui, step, 'back');
  expect(world.resource(Flow).screen).toBe('Start');
  expect(ui.interactables().some((e: any) => e.id === 'resume')).toBe(false);
  expect(ui.rect('slider-sens')).toBeTruthy();
  await ui.press('back');
  await step(5);
  expect(ui.interactables().some((e: any) => e.id === 'back')).toBe(false);
  await untilShown(ui, step, 'solo');
});

renderTest('JOIN GAME opens the lobby and Back closes it', async ({ world, step, input, ui }) => {
  input.view(1920, 1080, 1);
  await step(3);
  await untilShown(ui, step, 'join');
  await ui.press('join');
  await step(5);
  await untilShown(ui, step, 'back');
  expect(world.resource(Flow).screen).toBe('Start');
  expect(ui.interactables().some((e: any) => e.id === 'host')).toBe(true);
  await ui.press('back');
  await step(5);
  expect(ui.interactables().some((e: any) => e.id === 'back')).toBe(false);
  await untilShown(ui, step, 'solo');
});

renderTest('PLAY SOLO leads to Loading, the loading controller ends it and the HUD appears', async ({ world, step, input, ui }) => {
  input.view(1920, 1080, 1);
  await step(3);
  await untilShown(ui, step, 'solo');
  await ui.press('solo');
  await step(5);
  expect(world.resource(Flow).screen).toBe('Loading');
  expect(world.resource(Flow).mode).toBe('Solo');
  expect(world.resource(Flow).ready).toBe(false);
  // the controller reports GameReady by itself once the renderer has settled; the sim still keeps its 1.2 s minimum
  let sawReady = false;
  for (let i = 0; i < 400 && world.resource(Flow).screen === 'Loading'; i++) {
    await step(1);
    sawReady ||= world.resource(Flow).ready;
  }
  expect(sawReady).toBe(true);
  expect(world.resource(Flow).screen).toBe('Playing');
  expect(world.resource(Flow).loadTime).toBeGreaterThan(1.1);
  await step(30);
  // the start screen is gone: its buttons no longer take presses
  expect(ui.interactables().some((e: any) => e.id === 'solo')).toBe(false);
});

renderTest('Escape pauses with the pause menu, Resume continues', async ({ world, step, input, ui }) => {
  await toMatch(input, step, ui, world);
  await step(10);
  await escape(input, step);
  expect(world.resource(Flow).screen).toBe('Paused');
  await untilShown(ui, step, 'resume');
  const left = world.resource(Match).timeLeft;
  await step(20);
  expect(world.resource(Match).timeLeft).toBe(left); // the match is frozen while paused
  await ui.press('resume');
  await step(3);
  expect(world.resource(Flow).screen).toBe('Playing');
  await step(20);
  expect(world.resource(Match).timeLeft).toBeLessThan(left);
  await escape(input, step); // Escape toggles it again
  expect(world.resource(Flow).screen).toBe('Paused');
});

for (const size of [[1920, 1080], [3440, 1440], [1920, 1200]] as [number, number][]) {
renderTest(`the sensitivity slider writes Settings and Quit returns to the start screen at ${size[0]}x${size[1]}`, async ({ world, step, input, ui }) => {
  await toMatch(input, step, ui, world, 'solo', size);
  await escape(input, step);
  await untilShown(ui, step, 'resume');
  expect(world.resource(Settings).sensitivity).toBe(1);
  const r = ui.rect('slider-sens')!;
  expect(r).toBeTruthy();
  // press at 3/4 of the track: 0.2 + 0.75 * 2.8 = 2.3
  input.pointer('down', r.x + r.width * 0.75, r.y + r.height / 2);
  await step(2);
  input.pointer('up', r.x + r.width * 0.75, r.y + r.height / 2);
  await step(3);
  expect(world.resource(Settings).sensitivity).toBeGreaterThan(2.2);
  expect(world.resource(Settings).sensitivity).toBeLessThan(2.4);
  // dragging to the far left end clamps to the minimum
  input.pointer('down', r.x + r.width * 0.5, r.y + r.height / 2);
  await step(1);
  input.pointer('move', r.x - 50, r.y + r.height / 2);
  await step(2);
  input.pointer('up', r.x - 50, r.y + r.height / 2);
  await step(3);
  expect(world.resource(Settings).sensitivity).toBe(0.2);
  await ui.press('quit');
  await step(3);
  expect(world.resource(Flow).screen).toBe('Start');
  await untilShown(ui, step, 'solo');
});
}

renderTest('the launch cooldown shows in the HUD and the ready state comes back', async ({ world, step, input, ui, cheat, render }) => {
  await toMatch(input, step, ui, world);
  await step(20);
  const ready = render.probe({ regions: [[60, 960, 160, 60]], width: 1920, height: 1080 });
  await cheat('launch.cooldown', { seconds: 30 });
  await step(30);
  const cooling = render.probe({ regions: [[60, 960, 160, 60]], width: 1920, height: 1080 });
  expect(world.get(world.entities(Player)[0]!, Player).superCd).toBeGreaterThan(20);
  // the ring area looks different while recharging (the gold READY ring is replaced by a dark disc with a partial ring)
  expect(JSON.stringify(cooling.regions[0]!.mean)).not.toBe(JSON.stringify(ready.regions[0]!.mean));
});
