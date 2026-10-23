/**
 * The packed per-seat input of a match. The sim reads only this (`PlayerInputs`), whether the game is solo or online,
 * so every peer, the rollback and a replay see the same thing.
 *
 * Stick = move (x strafe, y forward, keys/pad through the project's `multiplayer.stick` map).
 * Buttons: bit 0 jump, 1 crouch, 2 fire, 3 aim (the project's `multiplayer.buttons` map covers the keys), bit 4 menu
 * (Escape) and bit 5 board (Tab), both read by presentation only, then the look direction as absolute angles: 12 bits of yaw and 12 of pitch, and bit 30
 * to say it is set. Absolute angles mean the mouse needs no per-frame deltas (a repeated or dropped input frame never loses turn).
 */
import { math } from '@gameengine/runtime';

export const BTN_JUMP = 1 << 0;
export const BTN_CROUCH = 1 << 1;
export const BTN_FIRE = 1 << 2;
export const BTN_AIM = 1 << 3;
export const BTN_MENU = 1 << 4;
/** Tab: shows or hides the leaderboard (presentation only). */
export const BTN_BOARD = 1 << 5;
/** Set once the sender has a look direction, so an input word of zeros (a seat that has not sent anything yet) leaves the player's facing alone. */
export const BTN_LOOK = 1 << 30;
const YAW_SHIFT = 6;
const PITCH_SHIFT = 18;
const STEPS = 4096;
const TAU = 6.2831853;
export const PITCH_LIMIT = 1.35;

/** Yaw (any angle) and pitch (clamped to +-PITCH_LIMIT) as the bits that ride in the button word. */
export function packLook(yaw: number, pitch: number): number {
  let y = yaw / TAU;
  y -= math.floor(y);
  const yq = math.floor(y * STEPS + 0.5) % STEPS;
  const p = (math.clamp(pitch, -PITCH_LIMIT, PITCH_LIMIT) + PITCH_LIMIT) / (2 * PITCH_LIMIT);
  const pq = math.floor(p * (STEPS - 1) + 0.5);
  return ((yq << YAW_SHIFT) | (pq << PITCH_SHIFT) | BTN_LOOK) >>> 0;
}

/** The look direction in a button word: yaw in 0..TAU, pitch in +-PITCH_LIMIT. */
export function unpackLook(buttons: number): { yaw: number; pitch: number } {
  const yq = (buttons >>> YAW_SHIFT) & (STEPS - 1);
  const pq = (buttons >>> PITCH_SHIFT) & (STEPS - 1);
  return { yaw: (yq / STEPS) * TAU, pitch: (pq / (STEPS - 1)) * 2 * PITCH_LIMIT - PITCH_LIMIT };
}

/** Most frames a guess carries a remote look past its newest confirmed input, and how much of the measured turn it keeps (a mouse stops about as fast as it starts). */
const GUESS_FRAMES = 6;
const GUESS_GAIN = 0.75;
const PI = 3.14159265;
/** The bits of an input word that are not the look: the buttons (jump..board) and the top bit. */
const NON_LOOK = (0x3f | 0x80000000) >>> 0;

/**
 * A guess of a remote seat's input for `frame` when its confirmed input has not arrived (`multiplayer.onPredict`): the same buttons and stick as its newest
 * confirmed one, and its look carried along the turn of its last two confirmed inputs. Repeating the last input would be wrong on every frame of a mouse turn.
 * Null repeats the last input: no history, no look yet, or `frame` is not after the newest confirmed input.
 */
export function predictInput(
  history: readonly { frame: number; buttons: number; stick: readonly [number, number] }[],
  frame: number,
): { buttons: number; stick: [number, number] } | null {
  const last = history[history.length - 1];
  const prev = history[history.length - 2];
  if (!last || !prev || !down(last.buttons, BTN_LOOK) || !down(prev.buttons, BTN_LOOK) || last.frame <= prev.frame) return null;
  const ahead = math.min(GUESS_FRAMES, frame - last.frame);
  if (ahead <= 0) return null;
  const a = unpackLook(prev.buttons);
  const b = unpackLook(last.buttons);
  const gap = last.frame - prev.frame;
  const dyaw = b.yaw - a.yaw;
  const turn = dyaw - TAU * math.floor((dyaw + PI) / TAU); // the short way round
  const k = (ahead * GUESS_GAIN) / gap;
  const look = packLook(b.yaw + turn * k, b.pitch + (b.pitch - a.pitch) * k);
  return { buttons: ((last.buttons & NON_LOOK) | look) >>> 0, stick: [last.stick[0], last.stick[1]] };
}

/** Whether a button bit is down in a button word. */
export const down = (buttons: number, bit: number): boolean => (buttons & bit) !== 0;

/** Who fired a stone: bots carry their id (1..N), players 1000 + seat. */
export const SEAT_OWNER = 1000;
export const ownerOfSeat = (seat: number): number => SEAT_OWNER + seat;
export const isSeatOwner = (owner: number): boolean => owner >= SEAT_OWNER;
export const seatOfOwner = (owner: number): number => owner - SEAT_OWNER;

/** Most seats a match has. */
export const MAX_SEATS = 4;
