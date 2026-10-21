/** Mouse capture follows the app flow: captured (cursor hidden, raw motion) while a match runs, released in every menu. */
import { defineSystem, read, write, services } from '@gameengine/runtime';
import { Flow, MouseState } from './schema.gen.ts';
import { onlinePaused } from './netstate.ts';

export const MouseCapture = defineSystem({
  name: 'MouseCapture',
  stage: 'LateUpdate',
  resources: [read(Flow), write(MouseState)],
  run(ctx) {
    const want = ctx.get(Flow).screen === 'Playing' && !onlinePaused();
    if (want === ctx.get(MouseState).captured) return;
    ctx.setField(MouseState, 'captured', want);
    // The web, phones and headless runs answer captured:false or reject; the game plays the same without it.
    void services.system.setMouseCapture({ enabled: want }).catch(() => undefined);
  },
});
