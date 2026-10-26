import { component, resource, event, f32, i32, u32, bool, vec3, enumOf } from '@gameengine/schema';

/** The round: clock and phase. Each player's own score and stats live on its Player entity. */
export const Match = resource(
  'Match',
  {
    timeLeft: f32({ default: 360, doc: 'Seconds left in the round' }),
    phase: enumOf('MatchPhase', ['Playing', 'Over'], { default: 'Playing' }),
    overTimer: f32({ doc: 'Seconds the results stay up before the next round' }),
  },
  { sim: true },
);

export const Player = component(
  'Player',
  {
    index: u32({ doc: 'Seat 0..3: which PlayerInputs entry drives this player' }),
    yaw: f32(),
    pitch: f32(),
    score: i32({ doc: 'Points held' }),
    hits: u32(),
    misses: u32(),
    deaths: u32(),
    deathBy: u32({ doc: 'Who ended the last life: 0 = the own miss, a bot id, or 1000 + the seat that hit' }),
    vy: f32({ doc: 'Vertical speed (m/s)' }),
    speed: f32({ doc: 'Horizontal speed, drives the weapon bob' }),
    state: enumOf('PlayerState', ['Alive', 'Dead'], { default: 'Alive' }),
    respawn: f32({ doc: 'Seconds until the player is back' }),
    freeze: f32({ doc: 'Seconds until a missed shot thaws: frozen means no moving or firing, and still being hittable' }),
    protect: f32({ doc: 'Spawn protection seconds' }),
    loaded: bool({ default: true, doc: 'The stone is in the sling' }),
    aiming: bool(),
    fireHeld: bool({ doc: 'The fire button was down last step (edge detection)' }),
    jumpHeld: bool({ doc: 'Space was down last step (edge detection)' }),
    sinceJump: f32({ default: 9, doc: 'Seconds since the last jump press (double-tap window)' }),
    superCd: f32({ doc: 'Seconds until the double-jump launch is ready again' }),
    climbing: bool({ doc: 'Holding a ladder (W/S climb, Space lets go)' }),
    ladderX: f32(),
    ladderZ: f32(),
    ladderNx: f32({ doc: 'Outward direction of the ladder (the side the player hangs on)' }),
    ladderNz: f32(),
    ladderTop: f32({ doc: 'Feet height at the top of the ladder' }),
    ladderCool: f32({ doc: 'Seconds before the player can grab a ladder again' }),
    eye: f32({ default: 1.65, doc: 'Eye height above the feet (lower while crouching)' }),
    crouch: bool({ doc: 'Crouch-walking (Shift): slower, lower, harder to spot' }),
    active: bool({ default: true, doc: 'A player is in this seat (online: set by SeatChanged; an empty seat is hidden and skipped)' }),
  },
  { sim: true },
);

export const Stone = component(
  'Stone',
  { velocity: vec3(), life: f32({ doc: 'Seconds in flight' }), travelled: f32({ doc: 'Metres flown' }), owner: u32({ doc: 'Who shot it: a bot id, or 1000 + the seat of a player' }) },
  { sim: true },
);

export const Critter = component(
  'Critter',
  {
    heading: f32(),
    turn: f32({ doc: 'Seconds until the next change of heading' }),
    speed: f32({ default: 2.4 }),
    dead: f32({ doc: 'Seconds until it is back (0 = alive)' }),
    freeze: f32({ doc: 'Seconds until a missed shot thaws (frozen: no wandering or shooting, still hittable)' }),
    home: vec3(),
    id: u32({ doc: 'Bot number (1..N); stones carry it as their owner' }),
    score: i32(),
    loaded: bool({ default: true, doc: 'The bot holds its stone' }),
    aim: f32({ default: 3, doc: 'Seconds until it may shoot' }),
  },
  { sim: true },
);

export const Solid = component(
  'Solid',
  { radius: f32({ default: 1 }), height: f32({ default: 100, doc: 'Top of the obstacle, metres' }), walk: bool({ doc: 'Its top can be stood on, and a jump clears it: crates, rocks, barrels' }) },
  { sim: true, doc: 'A vertical cylinder players, critters and stones cannot pass.' },
);

export const Platform = component(
  'Platform',
  { halfX: f32({ default: 3 }), halfZ: f32({ default: 3 }), top: f32({ default: 0.35 }) },
  { sim: true, doc: 'A walkable deck: the player stands on its top inside its footprint.' },
);

export const SpawnPoint = component('SpawnPoint', {}, { sim: true });

export const ShotFired = event('ShotFired', { position: vec3(), direction: vec3(), seat: u32() }, { sim: true });
export const CritterHit = event('CritterHit', { position: vec3(), seat: u32({ doc: 'The seat that scored the hit' }) }, { sim: true });
export const StoneMissed = event('StoneMissed', { position: vec3(), seat: u32({ doc: 'The seat that missed (bots: 99)' }) }, { sim: true });
/** Open rooms: the server says a seat got a player (fresh: a new one) or lost it, at the same frame on every device and the server. */
export const SeatChanged = event('SeatChanged', { seat: u32(), present: bool(), fresh: bool() }, { sim: true });
export const PlayerRespawned = event('PlayerRespawned', { seat: u32() }, { sim: true });

export const Temp = component('Temp', { life: f32({ default: 1.5, doc: 'Seconds until the entity is removed' }) }, { sim: true });

/** The ice shell around a frozen character: shown by presentation (scale 1) while its owner is frozen, else hidden (scale 0). */
export const IceShell = component('IceShell', { owner: u32({ doc: 'A seat 0..3, or 100 + a bot number' }) }, { sim: false });

export const Viewmodel = component(
  'Viewmodel',
  { part: enumOf('ViewPart', ['Frame', 'Pouch', 'Stone'], { default: 'Frame' }), seat: u32({ doc: 'Seat whose rig this belongs to' }) },
  { sim: false, doc: 'A first-person weapon part the presentation animates (recoil, bob, loaded stone).' },
);

/** Who did what to whom, for the announcements: kind 0 a hit, 1 a miss; actors are a seat (0..3) or 100 + a bot's number (b is 0 for a miss). */
export const Announce = event('Announce', { kind: u32(), a: u32(), b: u32() }, { sim: true });

export const PlayerHit = event('PlayerHit', { by: u32(), seat: u32({ doc: 'The seat that was hit' }) }, { sim: true });

export const Ladder = component(
  'Ladder',
  {
    top: f32({ default: 5.3, doc: 'Feet height of the platform at the top' }),
    nx: f32({ doc: 'Outward direction (x) the climber hangs on' }),
    nz: f32({ doc: 'Outward direction (z)' }),
    reach: f32({ default: 1.5, doc: 'How near a jumping player grabs it' }),
  },
  { sim: true, doc: 'A climbable ladder: jump next to it to grab, W/S climb, Space lets go, the top steps onto the platform.' },
);

export const Blocker = component(
  'Blocker',
  {
    radius: f32({ doc: 'Disc footprint radius (0: use the rectangle)' }),
    halfX: f32({ default: 1 }),
    halfZ: f32({ default: 1 }),
    yaw: f32({ doc: 'Rotation of the rectangle about Y (rad)' }),
    y0: f32({ doc: 'Underside height: a jump that reaches it stops here' }),
    y1: f32({ doc: 'Top height (the floor when walk is on)' }),
    walk: bool({ doc: 'The top can be stood on (a bridge)' }),
  },
  { sim: true, doc: 'A volume the player cannot jump up through (a canopy, a deck, a bridge); with walk it is also a floor.' },
);

/** The body a seat is drawn with (everyone else's view of it); a sim system poses it from the seat's Player. */
export const SeatBody = component('SeatBody', { index: u32({ doc: 'Seat it shows' }) }, { sim: true });

/** What the local player's HUD shows: filled each frame by presentation from the local seat's Player. */
export const LocalHud = resource(
  'LocalHud',
  {
    seat: u32({ doc: 'The seat this device plays' }),
    score: i32(),
    hits: u32(),
    playerDead: bool(),
    respawnIn: u32({ doc: 'Whole seconds until respawn' }),
    freezeIn: u32({ doc: 'Whole seconds until this seat thaws (0 = not frozen)' }),
    stoneLoaded: bool({ default: true }),
    superCd: u32({ doc: 'Whole seconds until the launch jump is ready' }),
    deathBy: u32(),
    rank: u32({ doc: 'Place among everyone in the round, players and bots (1 = best)' }),
    players: u32({ doc: 'How many are in the round, players and bots' }),
    rows: u32({ doc: 'Leaderboard rows filled (the best, at most 8)' }),
    // leaderboard row i, best first: (kind * 100 + id) * 1000 + score, with kind 0 a player (id = seat) and 1 a bot (id = bot number)
    row0: i32(),
    row1: i32(),
    row2: i32(),
    row3: i32(),
    row4: i32(),
    row5: i32(),
    row6: i32(),
    row7: i32(),

  },
  { sim: false },
);

/** Solo only: the mouse-look the offline input system integrates before it packs it into PlayerInputs (online, presentation does this). */
export const SoloLook = resource(
  'SoloLook',
  { yaw: f32(), pitch: f32(), lookX: f32(), lookY: f32(), hasLook: bool(), aiming: bool(), fireHeld: bool({ doc: 'The left button is down' }) },
  { sim: true },
);

/** Marks the camera pose of a seat (a VirtualCamera under its Player): this device's seat gets the top priority. */
export const SeatCam = component('SeatCam', { seat: u32() }, { sim: false });

/** Online only, presentation: this device's mouse look, integrated before it is sent as the local input. */
export const NetLook = resource(
  'NetLook',
  { yaw: f32(), pitch: f32(), aiming: bool(), menuHeld: bool(), boardHeld: bool(), seeded: bool({ doc: 'yaw and pitch were taken from the seat once' }) },
  { sim: false },
);
