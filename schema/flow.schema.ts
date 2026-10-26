import { component, resource, event, f32, u32, bool, enumOf } from '@gameengine/schema';

/**
 * The app flow the whole game obeys. The UI layer (start screen, loading screen, pause/settings menu) reads it and
 * raises the events below; the sim systems of a match run only while `screen` is Playing.
 */
export const Flow = resource(
  'Flow',
  {
    screen: enumOf('FlowScreen', ['Start', 'Loading', 'Playing', 'Paused'], { default: 'Start' }),
    mode: enumOf('FlowMode', ['Solo', 'Online'], { default: 'Solo' }),
    loadTime: f32({ doc: 'Seconds spent on the loading screen (it never ends before 1.2 s, and only once GameReady arrived)' }),
    ready: bool({ doc: 'The presentation reported that the world is drawn and warm (GameReady)' }),
    matchSeed: u32({ doc: 'Bumped whenever a match starts, so the UI can restart per-match effects' }),
    trimmed: bool({ doc: 'The seats and bots the match does not use were removed' }),
    seated: bool({ doc: 'Online: every seat started empty, to be filled by SeatChanged (or by the fixed-match fallback)' }),
    presence: bool({ doc: 'Online: the server told the sim who is in a seat at least once' }),
    onlineFor: f32({ doc: 'Online: seconds since the match began while no presence has come yet' }),
  },
  { sim: true },
);

/** Start screen: "Play solo vs bots". */
export const StartSolo = event('StartSolo', {}, { sim: true });
/** Loading screen controller: the world is drawn, assets are resident, shaders warm. Ends the loading screen. */
export const GameReady = event('GameReady', {}, { sim: true });
/** Pause menu: Resume. */
export const ResumeGame = event('ResumeGame', {}, { sim: true });
/** Pause menu: leave the match for the start screen. */
export const QuitToMenu = event('QuitToMenu', {}, { sim: true });

/** Player settings the sim reads (the pause menu writes them through SetSensitivity). */
export const Settings = resource('Settings', { sensitivity: f32({ default: 1, min: 0.2, max: 3, doc: 'Mouse-look multiplier' }) }, { sim: true });
export const SetSensitivity = event('SetSensitivity', { value: f32({ default: 1 }) }, { sim: true });

/** A seat's first-person slingshot rig (its Animator is driven by the ViewmodelAnim system; only this device's seat is shown). */
export const VmRig = component('VmRig', { index: u32({ doc: 'Seat it belongs to' }) }, { sim: true });
/** Sim events the animation and effects react to. */
export const Jumped = event('Jumped', { seat: u32() }, { sim: true });
export const SuperJumped = event('SuperJumped', { seat: u32() }, { sim: true });

/** What the presentation last asked the player window for (mouse capture follows Flow.screen). */
export const MouseState = resource('MouseState', { captured: bool() }, { sim: false });

/** A drifting cloud card on a ring around the world (presentation only). */
export const Cloud = component(
  'Cloud',
  { angle: f32({ doc: 'Where on the ring it starts (rad)' }), radius: f32({ default: 220 }), speed: f32({ default: 0.008, doc: 'Rad per second around the ring' }) },
  { sim: false },
);
