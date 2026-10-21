/** The pause menu: Resume, mouse sensitivity and volume sliders, Quit to menu. Intents: resume, quit, set {key, value}. */
import { host } from '@gameengine/runtime/internal';
import { View, Widget, defineView, type UINode, type UIPointerEvent } from '@gameengine/ui';

/** Where an element is, in the same view px as pointer events. */
const viewRect = (id: string) => host<{ x: number; y: number; width: number; height: number } | null>('ui.rect', id);

export type SliderKey = 'sens' | 'master' | 'music' | 'sfx';

export interface PauseModel {
  /** Mouse sensitivity multiplier, 0.2..3 (what SetSensitivity takes). */
  sens: number;
  /** Bus volumes 0..1. */
  master: number;
  music: number;
  sfx: number;
  /** Opened from the start screen: shows OPTIONS and Back instead of Resume and Quit. */
  fromStart: boolean;
}

export const SENS_MIN = 0.2;
export const SENS_MAX = 3;

/** Slider position 0..1 to the value it stands for, and back. */
export const sliderValue = (key: SliderKey, t: number) =>
  key === 'sens' ? Math.round((SENS_MIN + t * (SENS_MAX - SENS_MIN)) * 20) / 20 : Math.round(t * 100) / 100;
const sliderT = (key: SliderKey, v: number) => (key === 'sens' ? (v - SENS_MIN) / (SENS_MAX - SENS_MIN) : v);
const sliderText = (key: SliderKey, v: number) => (key === 'sens' ? `${v.toFixed(2).replace(/0$/, '')}x` : `${Math.round(v * 100)}%`);

export const PauseView = defineView<PauseModel>({
  name: 'Pause',
  description: 'Pause dialog: Resume, Quit to menu (Back when opened from the start screen) and four sliders. Intents: resume, quit, back, set {key, value}.',
  samples: {
    default: { sens: 1, master: 0.8, music: 0.5, sfx: 1, fromStart: false },
    options: { sens: 1, master: 0.8, music: 0.5, sfx: 1, fromStart: true },
    extremes: { sens: 3, master: 0, music: 1, sfx: 0.07, fromStart: false },
  },
  dims: true,
  blockInput: true,
  render: (model, { intent }) => {
    /** The invisible drag surface over a slider track: press or drag anywhere on it to set the value. */
    const hit = (key: SliderKey): UINode => {
      const set = (e: UIPointerEvent) => {
        const r = viewRect(`slider-${key}`);
        if (!r || r.width <= 0) return;
        const t = Math.min(1, Math.max(0, (e.x - r.x) / r.width));
        intent('set', { key, value: sliderValue(key, t) });
      };
      return View({ id: `slider-${key}`, class: 'pause-hit', onPressIn: set, onDrag: set });
    };
    const slider = (key: SliderKey) => ({ amount: () => sliderT(key, model()[key]), text: () => sliderText(key, model()[key]) });
    const [sens, master, music, sfx] = (['sens', 'master', 'music', 'sfx'] as const).map(slider);
    return (
      <Widget
        doc="pause-menu"
        props={{
          sensAmount: sens!.amount, sensText: sens!.text,
          masterAmount: master!.amount, masterText: master!.text,
          musicAmount: music!.amount, musicText: music!.text,
          sfxAmount: sfx!.amount, sfxText: sfx!.text,
          fromStart: () => model().fromStart,
        }}
        codeAreas={{
          'sens.hit': hit('sens'),
          'master.hit': hit('master'),
          'music.hit': hit('music'),
          'sfx.hit': hit('sfx'),
        }}
        onIntent={(_, e) => {
          const k = e.path.at(-1)!;
          if (k === 'resume' || k === 'quit' || k === 'back') intent(k);
        }}
      />
    );
  },
});
