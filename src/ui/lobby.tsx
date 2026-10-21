/**
 * Lobby controller: shows the PLAY ONLINE dialog over the start screen while lobbyOpen() (JOIN GAME). It hosts a match
 * on this PC or joins one found on the network (presentation only: multiplayer.* never runs in the sim). The match
 * starts by itself when every seat is taken; the engine then rebuilds the world and this closes the lobby.
 */
import { multiplayer } from '@gameengine/runtime';
import { createEffect, createSignal, defineUI, onUiFrame, untrack, useResource, views, type ViewHandle } from '@gameengine/ui';
import { Flow } from '../schema.gen.ts';
import { lobbyOpen, setLobbyOpen } from '../netstate.ts';
import { LobbyView, type LobbyModel } from '../views/lobby.view.tsx';

type LanHost = ReturnType<typeof multiplayer.lanHosts>[number];

const IDLE_STATUS = 'Pick a size and host, or join a match on your network.';
const HOST_STATUS = 'The match starts by itself when everyone is in.';

const message = (e: unknown) => String((e as Error)?.message ?? e).replace(/^E_[A-Z_]+: /, '');

export const lobby = defineUI({
  name: 'Lobby',
  root: () => {
    const flow = useResource(Flow);
    const [players, setPlayers] = createSignal(2);
    const [mode, setMode] = createSignal<LobbyModel['mode']>('idle');
    const [joined, setJoined] = createSignal(0);
    const [address, setAddress] = createSignal('');
    const [found, setFound] = createSignal<LanHost[]>([]);
    const [joining, setJoining] = createSignal('');
    const [status, setStatus] = createSignal(IDLE_STATUS);
    const [error, setError] = createSignal(false);
    let foundKey = '';
    let noLan = false; // the browser cannot search a network or host a match: only a game server will do there

    const say = (text: string, isError = false) => {
      setStatus(text);
      setError(isError);
    };
    const reset = () => {
      setMode('idle');
      setJoined(0);
      setAddress('');
      setFound([]);
      foundKey = '';
      say(IDLE_STATUS);
    };

    const model = (): LobbyModel => ({
      players: players(),
      mode: mode(),
      joined: joined(),
      address: address(),
      hosts: found().map((h, i) => ({ key: `h${i}`, name: h.name, joined: h.joined, players: h.players })),
      status: status(),
      error: error(),
    });

    /** Each UI frame while the lobby is open: the match's progress, its errors and (while searching) the hosts on the network. */
    const tick = () => {
      for (const ev of multiplayer.events()) {
        if (ev.type === 'error' || ev.type === 'unreachable') say(ev.message, true);
      }
      const st = multiplayer.status();
      if (st.phase === 'running') {
        setLobbyOpen(false);
        return;
      }
      if (mode() !== 'idle' && st.error) say(st.error.message, true);
      if (mode() !== 'idle' && (st.phase === 'idle' || st.phase === 'closed')) {
        // the match went away under us (the host left, the connection failed): back to searching, keeping any error shown
        const shown = error() ? status() : 'The match was closed.';
        reset();
        say(shown, true);
      } else if (mode() === 'hosting') {
        setJoined(st.hosting?.joined ?? 1);
      } else if (mode() === 'joining') {
        if (!error()) say(st.phase === 'waiting' ? `Joined ${joining()}. Waiting for the others...` : `Connecting to ${joining()}...`);
      } else if (!noLan) {
        let hosts: LanHost[];
        try {
          hosts = multiplayer.lanHosts().filter((h) => h.sameBuild).slice(0, 4);
        } catch (e) {
          noLan = true;
          say(`${message(e)} Online play in the browser needs a game server, which is not set up yet.`, true);
          return;
        }
        const key = hosts.map((h) => `${h.url}|${h.room}|${h.name}|${h.joined}/${h.players}`).join(',');
        if (key !== foundKey) {
          foundKey = key;
          setFound(hosts);
        }
      }
    };

    let handle: ViewHandle<LobbyModel> | null = null;
    let stopFrames: (() => void) | null = null;
    createEffect(() => {
      const on = lobbyOpen() && flow().screen === 'Start';
      if (on && !handle) {
        reset();
        try {
          multiplayer.events(); // drop what arrived while the lobby was closed
        } catch {
          // no match client here (a build without multiplayer)
        }
        handle = views.push(LobbyView, untrack(model), {
          onIntent: (name, payload) => {
            const p = payload as { players?: number; key?: string } | undefined;
            if (name === 'pick' && p?.players) setPlayers(p.players);
            else if (name === 'host') {
              try {
                const hosted = multiplayer.host({ players: players() });
                setAddress(hosted.url);
                setJoined(1);
                setMode('hosting');
                say(HOST_STATUS);
              } catch (e) {
                say(message(e), true);
              }
            } else if (name === 'cancel') {
              multiplayer.leave();
              reset();
            } else if (name === 'join') {
              const h = found()[Number(p?.key?.slice(1))];
              if (!h) return;
              try {
                multiplayer.joinHost(h);
                setJoining(h.name);
                setMode('joining');
                say(`Connecting to ${h.name}...`);
              } catch (e) {
                say(message(e), true);
              }
            } else if (name === 'back') {
              const phase = multiplayer.status().phase;
              if (phase !== 'running' && phase !== 'idle') multiplayer.leave();
              setLobbyOpen(false);
            }
          },
        });
        stopFrames = onUiFrame(tick);
      } else if (!on && handle) {
        stopFrames?.();
        stopFrames = null;
        handle.close();
        handle = null;
        // the match started (or the start screen went away): the next visit starts fresh
        setLobbyOpen(false);
        reset();
      }
    });
    createEffect(() => {
      const m = model();
      if (handle) handle.update(m);
    });
    return null;
  },
});
