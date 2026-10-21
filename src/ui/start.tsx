/** Start screen controller: shows the start screen while Flow.screen is Start; its buttons raise StartSolo, open the lobby (JOIN GAME) or the options. */
import { createEffect, defineUI, emit, useResource, views, type ViewHandle } from '@gameengine/ui';
import { Flow, StartSolo } from '../schema.gen.ts';
import { setLobbyOpen } from '../netstate.ts';
import { setOptionsOpen } from './options.ts';
import { StartView } from '../views/start.view.tsx';

export const start = defineUI({
  name: 'Start',
  root: () => {
    const flow = useResource(Flow);
    let handle: ViewHandle<Record<string, never>> | null = null;
    createEffect(() => {
      const on = flow().screen === 'Start';
      if (on && !handle) {
        handle = views.push(StartView, {}, {
          onIntent: (name) => {
            if (name === 'solo') emit(StartSolo, {});
            else if (name === 'join') setLobbyOpen(true);
            else if (name === 'options') setOptionsOpen(true);
          },
        });
      } else if (!on && handle) {
        handle.close();
        handle = null;
        setOptionsOpen(false);
      }
    });
    return null;
  },
});
