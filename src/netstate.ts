/**
 * Presentation state of an online match that the sim never sees: the local pause menu (the match keeps running for
 * everyone else, so Escape cannot pause the sim) and the lobby. Shared by the UI controllers and the LateUpdate systems.
 */
import { gameengine } from '@gameengine/runtime';
import { createSignal } from '@gameengine/ui';

/** The pause/options menu is open over a running online match: the mouse is released and this device sends no input. */
export const [onlinePaused, setOnlinePaused] = createSignal(false);

/** The multiplayer lobby (host or join a match) is open over the start screen. */
export const [lobbyOpen, setLobbyOpen] = createSignal(false);

/** Mouse sensitivity of an online match (the sim's Settings resource only reaches a solo match: UI events never reach an online sim). */
export const [onlineSens, setOnlineSens] = createSignal(1);

/** The leaderboard under the clock is open (Tab or the chevron). */
export const [boardOpen, setBoardOpen] = createSignal(false);

/** One announcement line of the feed under the top of the HUD; `id` makes each one new. */
export interface FeedLine {
  id: number;
  head: string;
  taunt: string;
  /** Whether the local player did it (or it was done to them). */
  mine: boolean;
}

/** The latest announcements, newest last (the HUD shows the last three for a few seconds each). */
export const [feed, setFeed] = createSignal<readonly FeedLine[]>([]);

/** Longest name a player can type. */
export const NAME_MAX = 12;

/** What a typed name may hold: letters, digits, spaces, `_` and `-`; the rest is dropped (names travel as notices and show in the HUD). */
export const cleanName = (s: string): string => s.replace(/[^A-Za-z0-9 _-]/g, '').replace(/^ +/, '').slice(0, NAME_MAX);

const [nameTick, bumpName] = createSignal(0);

/**
 * This player's name, typed in the lobby (empty: "Player N"). It lives in the settings store, not a variable or signal: the match start
 * rebuilds the world and the game's presentation state starts over, and the store also keeps the name for the next launch.
 */
export const playerName = (): string => {
  nameTick();
  return gameengine.kv.get<string>('playerName', '');
};
export const setPlayerName = (n: string): void => {
  gameengine.kv.set('playerName', n);
  bumpName(nameTick() + 1);
};

/** The lobby's name box has the keyboard: typed text goes to `playerName`. */
export const [nameEditing, setNameEditing] = createSignal(false);

/** The names of the seats of the running online match, as each told it (`multiplayer.say('name')`); a seat that said none is "Player N". */
export const [seatNames, setSeatNames] = createSignal<Readonly<Record<number, string>>>({});

/**
 * This device's look in an online match: integrated from the mouse by the sampler the engine calls right before every match step
 * (net.ts `sampleLook`), which has no `ctx`, so it lives here. A match start resets it, and `NetInput` seeds it from the seat's spawn.
 */
export const netLook = { yaw: 0, pitch: 0, aiming: false, seeded: false };
