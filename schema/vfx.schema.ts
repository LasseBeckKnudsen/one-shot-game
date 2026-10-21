import { component, resource, event, string, f32, u32, bool, vec3 } from '@gameengine/schema';

/** An entity that hosts one effect for the presentation (`burstAt` bursts, or a looping ambience). Spawned once by `FxHosts`. */
export const FxHost = component('FxHost', { kind: string({ doc: 'Which effect this host plays (see src/vfx.ts)' }) }, { sim: true });

/** What the presentation remembers between frames to spot footsteps, jumps and landings. */
export const FxState = resource(
  'FxState',
  {
    step: u32({ doc: 'Last sim step looked at' }),
    prevVy: f32(),
    minVy: f32({ doc: 'Fastest fall since leaving the ground' }),
    grounded: bool({ default: true }),
    stride: f32({ doc: 'Metres walked since the last footstep puff' }),
    foot: bool({ doc: 'Which foot comes next' }),
    trailUntil: u32({ doc: 'Step until which the double-jump trail is drawn' }),
    tracerStep: u32({ doc: 'Last sim step the stone tracer was laid for' }),
    lastStone: vec3({ doc: 'Where the stone was last seen (the tracer runs on to the impact)' }),
    hasStone: bool(),
  },
  { sim: false },
);

/** The sim emits this when the double jump comes off cooldown: the presentation plays a small sparkle at the sling (`fx/air_ready.vfx.json`). */
export const AirReady = event('AirReady', { seat: u32() }, { sim: true });
