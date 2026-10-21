/**
 * Loading screen controller. The screen is up while Flow.screen is Loading and fades out when it becomes Playing.
 * It decides when the game is truly ready: once the renderer has drawn a frame after Loading began and reports no
 * pending assets or pipelines for STABLE_FRAMES frames in a row (RenderStatus), it emits GameReady; a hard timeout
 * (TIMEOUT_SECONDS of Flow.loadTime) emits it anyway so the screen can never hang. The sim then ends Loading after
 * its own minimum of 1.2 s.
 */
import { RenderStatus } from '@gameengine/runtime';
import { createEffect, createSignal, defineUI, emit, onUiFrame, untrack, useResource, views, type ViewHandle } from '@gameengine/ui';
import { Flow, GameReady } from '../schema.gen.ts';
import { LoadingView, type LoadingModel } from '../views/loading.view.tsx';

const STABLE_FRAMES = 10;
const TIMEOUT_SECONDS = 8;
const TIP_SECONDS = 3.5;
const TIPS = [
  'Missing costs you a point.',
  'Leaders lose half their score when hit.',
  'Double-tap Space to launch high.',
  'Right-click to steady your aim.',
  'You only have one shot. Make it count.',
  'Bots shoot back. Keep moving.',
];

export const loading = defineUI({
  name: 'Loading',
  root: () => {
    const flow = useResource(Flow);
    const render = useResource(RenderStatus);
    const [stable, setStable] = createSignal(0);
    const [ready, setReady] = createSignal(false);
    const [tipIndex, setTipIndex] = createSignal(0);
    const [tipSwap, setTipSwap] = createSignal(0);
    let startFrame = 0;
    let handle: ViewHandle<LoadingModel> | null = null;

    const model = (): LoadingModel => {
      const t = flow().loadTime;
      // ease towards 85% by time, the last 15% is the renderer settling, 100% once GameReady went out
      const eased = 0.85 * (1 - Math.exp(-t * 1.5));
      const progress = ready() ? 1 : Math.min(0.99, eased + 0.15 * (stable() / STABLE_FRAMES));
      return { progress: Math.round(progress * 100) / 100, tip: TIPS[tipIndex() % TIPS.length]!, tipSwap: tipSwap() };
    };

    // the screen follows Flow.screen
    createEffect(() => {
      const on = flow().screen === 'Loading';
      if (on && !handle) {
        startFrame = untrack(() => render().frame);
        setStable(0);
        setReady(false);
        setTipIndex(untrack(() => flow().matchSeed) % TIPS.length);
        handle = views.push(LoadingView, untrack(model), { layer: 'overlay', enter: null });
      } else if (!on && handle) {
        handle.close();
        handle = null;
      }
    });
    createEffect(() => {
      if (handle) handle.update(model());
    });

    // readiness: only subscribed to the render counters while the screen is up and not ready yet
    createEffect(() => {
      if (flow().screen !== 'Loading' || ready()) return;
      const r = render();
      const settled = r.frame > startFrame && r.pendingAssets === 0 && r.pendingPipelines === 0;
      const n = untrack(stable);
      setStable(settled ? n + 1 : 0);
    });
    createEffect(() => {
      if (flow().screen !== 'Loading' || ready()) return;
      if (stable() >= STABLE_FRAMES || flow().loadTime >= TIMEOUT_SECONDS) {
        setReady(true);
        emit(GameReady, {});
      }
    });

    // the tip changes every few seconds; the timer only runs while the screen is up
    let nextTip = 0;
    const stopTips = onUiFrame((now) => {
      if (!handle) {
        nextTip = 0;
        return;
      }
      if (nextTip === 0) nextTip = now + TIP_SECONDS;
      else if (now >= nextTip) {
        nextTip = now + TIP_SECONDS;
        setTipIndex((i) => i + 1);
        setTipSwap((n) => n + 1);
      }
    });
    void stopTips;
    return null;
  },
});
