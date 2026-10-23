/** The in-match HUD: score, risk, clock, my placement and the leaderboard toggle, dot reticle, stone state, double-jump launch ring, banners, the announcement toasts and the controls hint. */
import { Widget, defineView } from '@gameengine/ui';

export interface HudRow {
  rank: number;
  name: string;
  score: number;
  me: boolean;
}

/** One announcement toast at the top centre; `gone` fades it out before it is dropped. */
export interface HudToast {
  id: number;
  head: string;
  taunt: string;
  mine: boolean;
  gone: boolean;
}

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
  /** A missed shot froze me: the ice frame is on the screen edge. */
  frozen: boolean;
  bannerPop: number;
  hint: boolean;
  /** My place among everyone, e.g. "2nd / 6". */
  placeText: string;
  first: boolean;
  /** The leaderboard under the clock is open. */
  board: boolean;
  /** Leaderboard rows, best first (at most 8). */
  rows: HudRow[];
  /** Announcement toasts, oldest first (at most 3). */
  toasts: HudToast[];
}

const base: HudModel = {
  score: 3, penalty: 2, timeText: '02:34', urgent: false, stone: 'loaded', cd: 0, ring: 1, ready: true, readyPulse: 0,
  banner: '', bannerSub: '', tone: 'hit', frozen: false, bannerPop: 0, hint: false, placeText: '3rd / 9', first: false, board: false, rows: [], toasts: [],
};

const eight: HudRow[] = [
  { rank: 1, name: 'Bot 3', score: 9, me: false },
  { rank: 2, name: 'Player 2', score: 7, me: false },
  { rank: 3, name: 'You', score: 6, me: true },
  { rank: 4, name: 'Bot 1', score: 4, me: false },
  { rank: 5, name: 'Bot 6', score: 3, me: false },
  { rank: 6, name: 'Player 3', score: 2, me: false },
  { rank: 6, name: 'Bot 2', score: 2, me: false },
  { rank: 8, name: 'Bot 4', score: 0, me: false },
];

export const HudView = defineView<HudModel>({
  name: 'Hud',
  description: 'Score, risk, clock, my placement with the leaderboard toggle and board, reticle dot, stone state, launch cooldown ring, the centre banner and up to 3 announcement toasts at the top centre. Intents: toggleBoard.',
  samples: {
    play: { ...base, hint: true },
    cooling: { ...base, score: 7, penalty: 4, timeText: '01:12', stone: 'flying', cd: 23, ring: 0.42, ready: false },
    hit: { ...base, score: 8, penalty: 4, timeText: '01:10', cd: 23, ring: 0.42, ready: false, banner: '+1 PLONK!', bannerSub: 'Nice shot', tone: 'hit' },
    miss: { ...base, score: 4, penalty: 2, timeText: '00:42', urgent: true, stone: 'flying', cd: 5, ring: 0.9, ready: false, banner: 'FROZEN!', bannerSub: 'thawing in 3', tone: 'miss', frozen: true },
    hurt: { ...base, score: 3, penalty: 2, timeText: '00:30', urgent: true, stone: 'gone', banner: 'You got plonked!', bannerSub: 'Hit by a bot! Respawning in 3', tone: 'hurt' },
    boardHidden: { ...base, score: 6, rows: eight },
    boardShown: { ...base, score: 6, board: true, rows: eight },
    soloFirst: {
      ...base, score: 9, placeText: '1st / 9', first: true, board: true,
      rows: ['You', 'Bot 3', 'Bot 1', 'Bot 6', 'Bot 2', 'Bot 8', 'Bot 4', 'Bot 5'].map((name, i) => ({ rank: i + 1, name, score: 9 - i, me: i === 0 })),
    },
    feedEmpty: { ...base, toasts: [] },
    feedOne: { ...base, toasts: [{ id: 1, head: 'Bot 3 plonked Player 2!', taunt: 'Right on the acorn.', mine: false, gone: false }] },
    feedThree: {
      ...base, score: 6, cd: 23, ring: 0.42, ready: false, banner: '+1 PLONK!', bannerSub: 'Nice shot', tone: 'hit', rows: eight,
      toasts: [
        { id: 1, head: 'Player 2 sniped Player 4 out of the trees!', taunt: 'Nice branch you had there.', mine: false, gone: false },
        { id: 2, head: 'You plonked Bot 3!', taunt: 'Close. If the target was in another zip code.', mine: true, gone: false },
        { id: 3, head: 'You missed!', taunt: 'Hope you enjoyed that stone, it was your only one.', mine: true, gone: false },
      ],
    },
    over: { ...base, score: 9, penalty: 5, timeText: '00:00', urgent: true, stone: 'gone', banner: "TIME'S UP!", bannerSub: 'You scored 9', tone: 'over' },
  },
  render: (model, { intent }) => (
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
        frozen: () => model().frozen,
        bannerPop: () => model().bannerPop,
        hint: () => model().hint,
        placeText: () => model().placeText,
        first: () => model().first,
        board: () => model().board,
        rows: () => model().rows.map((r, i) => ({ key: `r${i}`, rank: String(r.rank), name: r.name, score: r.score, me: r.me })),
        toasts: () => model().toasts.map((t) => ({ key: `t${t.id}`, head: t.head, taunt: t.taunt, mine: t.mine, gone: t.gone })),
      }}
      onIntent={(_, e) => {
        if (e.path.at(-1) === 'leaderboard') intent('toggleBoard');
      }}
    />
  ),
});
