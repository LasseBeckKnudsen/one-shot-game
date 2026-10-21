/** The loading cover: still, logo, three bouncing acorns, a progress bar and a rotating tip. No intents. */
import { Widget, defineView, ui } from '@gameengine/ui';

export interface LoadingModel {
  /** 0..1 */
  progress: number;
  tip: string;
  /** Bumped when the tip changes, so the tip pill pops. */
  tipSwap: number;
}

const HOP = [{ transform: 'translateY(0px)' }, { transform: 'translateY(-26px)', easing: 'out-quad' }, { transform: 'translateY(0px)', easing: 'in-quad' }];

export const LoadingView = defineView<LoadingModel>({
  name: 'Loading',
  description: 'Opaque loading cover: background still, logo, acorn hop, progress bar and a tip. No intents.',
  samples: {
    start: { progress: 0.05, tip: 'Missing costs you a point.', tipSwap: 0 },
    mid: { progress: 0.55, tip: 'Leaders lose half their score when hit.', tipSwap: 1 },
    done: { progress: 1, tip: 'Double-tap Space to launch high.', tipSwap: 2 },
  },
  render: (model) => (
    <Widget
      doc="loading-screen"
      props={{ progress: () => model().progress, tip: () => model().tip, tipSwap: () => model().tipSwap }}
      refs={(key, node) => {
        if (key.startsWith('acorn')) ui.animate(node, HOP, { duration: 900, iterations: Infinity, delay: (Number(key.slice(5)) - 1) * 160, easing: 'linear' });
      }}
    />
  ),
});
