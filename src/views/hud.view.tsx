/** The in-match HUD: score, risk, clock, dot reticle, stone state, double-jump launch ring, banners and the controls hint. */
import { Widget, defineView } from '@gameengine/ui';

export interface HudModel {
  score: number;
  penalty: number;
  timeText: string;
  urgent: boolean;
  stone: 'loaded' | 'flying' | 'gone';
  /** Whole seconds until the launch is ready (0 = ready). */
  cd: number;
  /** 0..1 recharge progress of the launch ring. */
  ring: number;
  ready: boolean;
  readyPulse: number;
  banner: string;
  bannerSub: string;
  tone: 'hit' | 'miss' | 'hurt' | 'over';
  bannerPop: number;
  hint: boolean;
}

const base: HudModel = {
  score: 3, penalty: 2, timeText: '02:34', urgent: false, stone: 'loaded', cd: 0, ring: 1, ready: true, readyPulse: 0,
  banner: '', bannerSub: '', tone: 'hit', bannerPop: 0, hint: false,
};

export const HudView = defineView<HudModel>({
  name: 'Hud',
  description: 'Score, risk, clock, reticle dot, stone state, launch cooldown ring and the centre banner. No intents.',
  samples: {
    play: { ...base, hint: true },
    cooling: { ...base, score: 7, penalty: 4, timeText: '01:12', stone: 'flying', cd: 23, ring: 0.42, ready: false },
    hit: { ...base, score: 8, penalty: 4, timeText: '01:10', cd: 23, ring: 0.42, ready: false, banner: '+1 PLONK!', bannerSub: 'Nice shot', tone: 'hit' },
    miss: { ...base, score: 4, penalty: 2, timeText: '00:42', urgent: true, stone: 'gone', cd: 5, ring: 0.9, ready: false, banner: 'MISSED!', bannerSub: 'respawning in 2', tone: 'miss' },
    hurt: { ...base, score: 3, penalty: 2, timeText: '00:30', urgent: true, stone: 'gone', banner: 'You got plonked!', bannerSub: 'Hit by a bot! Respawning in 3', tone: 'hurt' },
    over: { ...base, score: 9, penalty: 5, timeText: '00:00', urgent: true, stone: 'gone', banner: "TIME'S UP!", bannerSub: 'You scored 9', tone: 'over' },
  },
  render: (model) => (
    <Widget
      doc="hud"
      props={{
        score: () => model().score,
        penalty: () => model().penalty,
        timeText: () => model().timeText,
        urgent: () => model().urgent,
        stone: () => model().stone,
        cd: () => model().cd,
        ring: () => model().ring,
        ready: () => model().ready,
        readyPulse: () => model().readyPulse,
        banner: () => model().banner,
        bannerSub: () => model().bannerSub,
        tone: () => model().tone,
        bannerPop: () => model().bannerPop,
        hint: () => model().hint,
      }}
    />
  ),
});
