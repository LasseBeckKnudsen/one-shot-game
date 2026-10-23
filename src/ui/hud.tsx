/**
 * HUD controller: shows the HUD while Flow.screen is Playing (or Paused, dimmed by the pause menu's scrim) and fills it
 * from Match. UI only: it reads resources and never writes the world.
 */
import { createEffect, createMemo, createSignal, defineUI, onCleanup, onUiFrame, untrack, useResource, views, type ViewHandle } from '@gameengine/ui';
import { boardOpen, feed, seatNames, setBoardOpen } from '../netstate.ts';
import { Flow, LocalHud, Match, type LocalHudValue } from '../schema.gen.ts';
import { HudView, type HudModel, type HudRow, type HudToast } from '../views/hud.view.tsx';

/** Seconds of the double-jump launch cooldown (the sim's SUPER_COOLDOWN). */
const SUPER_COOLDOWN = 40;

const place = (n: number) => `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`;

/** The leaderboard rows of LocalHud, each packed as (kind * 100 + id) * 1000 + score (kind 0 a player seat, 1 a bot number). */
const boardRows = (m: LocalHudValue): HudRow[] => {
  const names = seatNames();
  const packed = [m.row0, m.row1, m.row2, m.row3, m.row4, m.row5, m.row6, m.row7].slice(0, m.rows);
  const rows = packed.map((v) => {
    const head = Math.floor(v / 1000);
    const kind = Math.floor(head / 100);
    const id = head % 100;
    const name = kind === 1 ? `Bot ${id}` : id === m.seat ? 'You' : names[id] || `Player ${id + 1}`;
    return { rank: 0, name, score: v % 1000, me: kind === 0 && id === m.seat };
  });
  // best first: a tie shares the place of the first with that score
  rows.forEach((r, i) => (r.rank = i > 0 && rows[i - 1]!.score === r.score ? rows[i - 1]!.rank : i + 1));
  return rows;
};

const clock = (s: number) => {
  const t = Math.max(0, Math.ceil(s));
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
};

/** Seconds the controls hint stays up after a match starts. */
const HINT_SECONDS = 20;
/** Seconds the "+1 PLONK!" banner stays up. */
const HIT_SECONDS = 1.1;
/** Seconds an announcement toast stays up, then how long it fades out before it is dropped. */
const TOAST_SECONDS = 4.5;
const TOAST_FADE = 0.4;
/** Announcement toasts shown at once; more wait their turn in a queue of at most TOAST_QUEUE, and what arrives beyond that is dropped. */
const TOAST_MAX = 2;
const TOAST_QUEUE = 3;

export const hud = defineUI({
  name: 'Hud',
  root: () => {
    const flow = useResource(Flow);
    const match = useResource(Match);
    const mine = useResource(LocalHud);
    const showing = () => flow().screen === 'Playing' || flow().screen === 'Paused';

    // presentation-only state: banner flash, hint timer, launch recharge ring, pop counters
    const [hitFlash, setHitFlash] = createSignal(false);
    const [hintOn, setHintOn] = createSignal(true);
    const [readyPulse, setReadyPulse] = createSignal(0);
    const [bannerPop, setBannerPop] = createSignal(0);
    let hintDeadline = -1; // stamped on the next UI frame
    let flashDeadline = 0;
    let flashStamp = false;
    let lastHits = untrack(() => mine().hits);
    let lastCd = untrack(() => mine().superCd);
    const [peakCd, setPeakCd] = createSignal(0);
    // announcement toasts, oldest first; each new line's expiry is stamped from the UI clock on the next frame
    const [toasts, setToasts] = createSignal<readonly HudToast[]>([]);
    const toastEnds = new Map<number, number>(); // id -> UI time it starts fading (-1: stamp on the next frame)
    let feedIds = new Set(untrack(() => feed().map((l) => l.id)));
    const queued: HudToast[] = [];
    /** Moves queued lines up while fewer than TOAST_MAX are showing. */
    const promote = () => {
      const shown = untrack(toasts);
      let live = shown.filter((t) => !t.gone).length;
      if (queued.length === 0 || live >= TOAST_MAX) return;
      const next = [...shown];
      while (queued.length > 0 && live < TOAST_MAX) {
        const t = queued.shift()!;
        toastEnds.set(t.id, -1);
        next.push(t);
        live++;
      }
      setToasts(next);
    };

    createEffect(() => {
      // a new match (Loading just ended): the hint comes back for 20 s
      flow().matchSeed;
      hintDeadline = -1;
      setHintOn(true);
      setHitFlash(false);
      setToasts([]);
      toastEnds.clear();
      queued.length = 0;
    });
    createEffect(() => {
      const lines = feed();
      const fresh = lines.filter((l) => !feedIds.has(l.id));
      feedIds = new Set(lines.map((l) => l.id));
      if (fresh.length === 0) return;
      // a busy moment would spam the screen: two show, a few wait, the rest is dropped
      for (const l of fresh) if (queued.length < TOAST_QUEUE) queued.push({ ...l, gone: false });
      promote();
    });
    createEffect(() => {
      const hits = mine().hits;
      if (hits > lastHits) {
        setHitFlash(true);
        flashStamp = true;
      }
      lastHits = hits;
    });
    createEffect(() => {
      const cd = mine().superCd;
      if (lastCd > 0 && cd === 0) setReadyPulse((n) => n + 1);
      lastCd = cd;
      // the recharge ring fills against the longest cooldown seen since it was last ready
      setPeakCd((p) => (cd === 0 ? 0 : Math.max(p, cd)));
    });
    // which banner is up (the respawn countdown only changes its second line): a new one pops
    const bannerKind = createMemo(() => {
      const m = mine();
      if (match().phase === 'Over') return 'over';
      if (m.playerDead) return 'hurt';
      if (m.freezeIn > 0) return 'miss';
      return hitFlash() ? 'hit' : '';
    });
    createEffect(() => {
      if (bannerKind() !== '') setBannerPop((n) => n + 1);
    });
    // one tiny frame callback for the timers; it only does work while a timer is running
    const stop = onUiFrame((now) => {
      if (hintDeadline < 0) hintDeadline = now + HINT_SECONDS;
      else if (hintOn() && now > hintDeadline) setHintOn(false);
      if (flashStamp) {
        flashStamp = false;
        flashDeadline = now + HIT_SECONDS;
      } else if (flashDeadline > 0 && now > flashDeadline) {
        flashDeadline = 0;
        setHitFlash(false);
      }
      if (toastEnds.size > 0) {
        let changed = false;
        const next = toasts().filter((t) => {
          let end = toastEnds.get(t.id)!;
          if (end < 0) toastEnds.set(t.id, (end = now + TOAST_SECONDS));
          if (now < end + TOAST_FADE) return true;
          toastEnds.delete(t.id);
          changed = true;
          return false;
        }).map((t) => {
          if (t.gone || now < toastEnds.get(t.id)!) return t;
          changed = true;
          return { ...t, gone: true };
        });
        if (changed) setToasts(next);
      }
      promote();
    });
    onCleanup(stop);

    const model = (): HudModel => {
      const m = mine();
      const over = match().phase === 'Over';
      let banner = '';
      let bannerSub = '';
      let tone: HudModel['tone'] = 'hit';
      if (over) {
        banner = "TIME'S UP!";
        bannerSub = m.players > 1 ? `You scored ${m.score}  ·  ${place(m.rank)} of ${m.players}` : `You scored ${m.score}`;
        tone = 'over';
      } else if (m.playerDead && m.deathBy > 0) {
        banner = 'You got plonked!';
        bannerSub = `${m.deathBy >= 1000 ? `Hit by player ${m.deathBy - 1000 + 1}!` : 'Hit by a bot!'} Respawning in ${m.respawnIn}`;
        tone = 'hurt';
      } else if (m.freezeIn > 0) {
        banner = 'FROZEN!';
        bannerSub = `missed: thawing in ${m.freezeIn}`;
        tone = 'miss';
      } else if (hitFlash()) {
        banner = '+1 PLONK!';
        bannerSub = '';
        tone = 'hit';
      }
      const cd = m.superCd;
      const peak = peakCd();
      return {
        score: m.score,
        penalty: Math.max(1, Math.ceil(m.score / 2)),
        timeText: clock(match().timeLeft),
        urgent: match().timeLeft < 60,
        stone: over || m.playerDead ? 'gone' : m.stoneLoaded ? 'loaded' : 'flying',
        frozen: !over && !m.playerDead && m.freezeIn > 0,
        cd,
        ring: cd === 0 ? 1 : Math.min(1, Math.max(0, 1 - cd / SUPER_COOLDOWN)),
        ready: cd === 0,
        readyPulse: readyPulse(),
        banner,
        bannerSub,
        tone,
        bannerPop: bannerPop(),
        hint: false, // the controls live in the pause menu now
        placeText: `${place(m.rank)} / ${m.players}`,
        first: m.rank === 1,
        board: boardOpen(),
        rows: boardRows(m),
        toasts: [...toasts()],
      };
    };

    let handle: ViewHandle<HudModel> | null = null;
    createEffect(() => {
      if (!showing()) {
        if (handle) handle.close();
        handle = null;
        return;
      }
      // read the model inside the effect: every field it touches re-runs this (the launch cooldown, the clock, the banners)
      const m = model();
      if (!handle) handle = views.push(HudView, m, {
        onIntent: (name) => {
          // the leaderboard under the clock: presentation only, closed again for every new HUD
          if (name === 'toggleBoard') setBoardOpen(!boardOpen());
        },
      });
      else handle.update(m);
    });
    return null;
  },
});
