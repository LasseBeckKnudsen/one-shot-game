/**
 * Presentation state of an online match that the sim never sees: the local pause menu (the match keeps running for
 * everyone else, so Escape cannot pause the sim) and the lobby. Shared by the UI controllers and the LateUpdate systems.
 */
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
