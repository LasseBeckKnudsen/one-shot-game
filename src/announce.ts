/** The announcements: who hit or missed whom, with a short taunt picked at random (presentation only, never the sim's rng). */

/** [headline, taunt]; {A} is who did it, {B} who it hit. */
const HITS: readonly (readonly [string, string])[] = [
  ['{A} plonked {B}!', 'Right on the acorn.'],
  ['Bullseye! {A} tagged {B}.', 'One shot is all it takes.'],
  ['{A} sent {B} flying!', 'Next stop: respawn.'],
];

const MISSES: readonly (readonly [string, string])[] = [
  ['{A} missed!', 'The tree sends its regards.'],
  ['{A} missed!', 'That stone is somewhere in the next village.'],
  ['{A} missed!', 'Their one shot, gone.'],
];

/** "You", a seat's own name, "Player 2" or "Bot 3" for an actor code (a seat, or 100 + a bot's number); `object` is the "you" of "hit you". */
export function actorName(code: number, me: number, object = false, names: Readonly<Record<number, string>> = {}): string {
  if (code >= 100) return `Bot ${code - 100}`;
  if (code === me) return object ? 'you' : 'You';
  return names[code] || `Player ${code + 1}`;
}

/** The announcement of one event; `pick` is a number in 0..1 (Math.random in presentation). */
export function announcement(kind: number, a: number, b: number, me: number, pick: number, names: Readonly<Record<number, string>> = {}): { head: string; taunt: string } {
  const list = kind === 0 ? HITS : MISSES;
  const [head, taunt] = list[Math.min(list.length - 1, Math.floor(pick * list.length))]!;
  const fill = (t: string) => t.replace(/\{A\}/g, actorName(a, me, false, names)).replace(/\{B\}/g, actorName(b, me, true, names));
  return { head: fill(head), taunt: fill(taunt) };
}

/** The line shown when a player joins or leaves the match. */
export function presenceLine(joined: boolean, name: string): { head: string; taunt: string } {
  return joined ? { head: `${name} joined`, taunt: 'Welcome to the village.' } : { head: `${name} left`, taunt: 'The village is a little quieter.' };
}
