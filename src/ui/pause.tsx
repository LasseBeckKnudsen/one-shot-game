/**
 * Pause menu controller: shows the pause dialog while a solo match is paused (Escape is handled by the sim) or while this device's
 * pause menu is open over an online match (the match goes on for the others: that state is netstate.ts).
 * Opened from the start screen's controls and settings button too (fromStart: Back closes it). Resume -> ResumeGame (online: closes the menu), Quit -> QuitToMenu (online: leaves the match), the sensitivity slider -> SetSensitivity, the volume sliders -> SetBusVolume.
 */
import { SetBusVolume, multiplayer } from '@gameengine/runtime';
import { createEffect, createSignal, defineUI, emit, untrack, useResource, views, type ViewHandle } from '@gameengine/ui';
import { Flow, QuitToMenu, ResumeGame, SetSensitivity, Settings } from '../schema.gen.ts';
import { onlinePaused, onlineSens, setOnlinePaused, setOnlineSens } from '../netstate.ts';
import { optionsOpen, setOptionsOpen } from './options.ts';
import { PauseView, type PauseModel, type SliderKey } from '../views/pause.view.tsx';

const BUS: Record<Exclude<SliderKey, 'sens'>, string> = { master: 'Master', music: 'Music', sfx: 'SFX' };

export const pause = defineUI({
  name: 'Pause',
  root: () => {
    const flow = useResource(Flow);
    const settings = useResource(Settings);
    // bus volumes are presentation preferences: they live here and reach the mixer through SetBusVolume
    const [volumes, setVolumes] = createSignal({ master: 1, music: 1, sfx: 1 });
    const model = (): PauseModel => ({ sens: flow().mode === 'Online' ? onlineSens() : settings().sensitivity, ...volumes(), fromStart: flow().screen === 'Start' });
    let handle: ViewHandle<PauseModel> | null = null;

    createEffect(() => {
      const on = flow().screen === 'Paused' || (flow().mode === 'Online' && flow().screen === 'Playing' && onlinePaused()) || (flow().screen === 'Start' && optionsOpen());
      if (on && !handle) {
        handle = views.push(PauseView, untrack(model), {
          onIntent: (name, payload) => {
            if (name === 'resume') {
              if (flow().mode === 'Online') setOnlinePaused(false);
              else emit(ResumeGame, {});
            } else if (name === 'quit') {
              if (flow().mode === 'Online') {
                // the match goes on for the others; this device leaves it and the engine puts the start screen back
                setOnlinePaused(false);
                multiplayer.leave();
              } else emit(QuitToMenu, {});
            } else if (name === 'back') setOptionsOpen(false);
            else if (name === 'set') {
              const { key, value } = payload as { key: SliderKey; value: number };
              if (key === 'sens') {
                if (flow().mode === 'Online') setOnlineSens(value);
                else emit(SetSensitivity, { value });
              } else {
                setVolumes((v) => ({ ...v, [key]: value }));
                emit(SetBusVolume, { bus: BUS[key], volume: value, lowpass: 0, highpass: 0 });
              }
            }
          },
        });
      } else if (!on && handle) {
        handle.close();
        handle = null;
      }
    });
    createEffect(() => {
      if (handle) handle.update(model());
    });
    return null;
  },
});
