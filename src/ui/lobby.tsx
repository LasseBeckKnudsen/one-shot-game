/**
 * Lobby controller: shows the PLAY ONLINE dialog over the start screen while lobbyOpen() (JOIN GAME). It hosts a match
 * on this PC or joins one found on the network (presentation only: multiplayer.* never runs in the sim). The match
 * starts by itself when every seat is taken; the engine then rebuilds the world and this closes the lobby.
 */
import { multiplayer, services } from '@gameengine/runtime';
import { createEffect, createSignal, defineUI, onUiFrame, untrack, useResource, views, type ViewHandle } from '@gameengine/ui';
import { Flow } from '../schema.gen.ts';
import { lobbyOpen, nameEditing, playerName, setLobbyOpen, setNameEditing, setPlayerName } from '../netstate.ts';
import { randomName } from '../names.ts';
import { LobbyView, type LobbyModel } from '../views/lobby.view.tsx';

type LanHost = ReturnType<typeof multiplayer.lanHosts>[number];

/** Seats of a server room: open rooms take players as they come, up to this many. */
const SERVER_SEATS = 4;

const IDLE_STATUS = 'Pick a size and host, join a match on your network, or play on the server.';
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
    /** Open rooms running on the match server, a free seat first (`multiplayer.rooms`). */
    const [rooms, setRooms] = createSignal<{ server: string; room: string; seats: number; taken: number }[]>([]);
    let roomsKey = '';
    const [joining, setJoining] = createSignal('');
    const [status, setStatus] = createSignal(IDLE_STATUS);
    const [error, setError] = createSignal(false);
    let foundKey = '';
    const [noLanSig, setNoLanSig] = createSignal(false); // the browser cannot search a network or host a match: only the game server will do there
    let noLan = false;
    /** The address of the game server of the page this runs in (the browser build), else undefined: the project's `multiplayer.server`. */
    let pageServer: string | undefined;

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
      setRooms([]);
      roomsKey = '';
      say(IDLE_STATUS);
    };

    const model = (): LobbyModel => ({
      players: players(),
      mode: mode(),
      joined: joined(),
      address: address(),
      hosts: [
        ...rooms().map((r, i) => ({ key: `r${i}`, name: `Server room ${i + 1}`, joined: r.taken, players: r.seats })),
        ...found().map((h, i) => ({ key: `h${i}`, name: h.name, joined: h.joined, players: h.players })),
      ],
      status: status(),
      error: error(),
      noLan: noLanSig(),
      name: playerName(),
      editing: nameEditing(),
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
      } else {
        // the server's open rooms (players come and go while a room runs): poll every frame, the engine asks once a second
        let listing: ReturnType<typeof multiplayer.rooms> = null;
        try {
          listing = multiplayer.rooms(pageServer ? { server: pageServer } : {});
        } catch {
          // the server cannot be reached right now: the list stays as it was
        }
        if (listing) {
          const open = listing.rooms.filter((r) => r.free > 0).slice(0, 4).map((r) => ({ server: listing!.server, room: r.room, seats: r.seats, taken: r.taken }));
          const key = open.map((r) => `${r.room}|${r.taken}/${r.seats}`).join(',');
          if (key !== roomsKey) {
            roomsKey = key;
            setRooms(open);
          }
        }
      }
      if (mode() === 'idle' && !noLan) {
        let hosts: LanHost[];
        try {
          hosts = multiplayer.lanHosts().filter((h) => h.sameBuild).slice(0, 4);
        } catch (e) {
          noLan = true;
          setNoLanSig(true);
          say('Pick a size and press PLAY ON SERVER.');
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
        // a player who never typed a name gets a fun one (kept in the settings store, so it is theirs from now on)
        if (!playerName()) setPlayerName(randomName());
        reset();
        try {
          multiplayer.events(); // drop what arrived while the lobby was closed
        } catch {
          // no match client here (a build without multiplayer)
        }
        // a game published on the office arcade is served by its own match server next to the page: .../<game>/socket
        void services.system.launchLink().then((r) => {
          // no page address (a native player): the pattern does not match and the project's server is used
          const link = (r as { url?: string }).url ?? '';
          const m = /^(https?):\/\/([^/?#]+)([^?#]*)/.exec(link);
          if (m) pageServer = `${m[1] === 'https' ? 'wss' : 'ws'}://${m[2]}${m[3]!.replace(/\/+$/, '')}/socket`;
          // ?server=ws://host:port points the page at another match server (a dev server refuses a release page: its build id differs)
          const forced = /[?&]server=(wss?:\/\/[^&#\s]+)/.exec(link);
          if (forced) pageServer = forced[1];
        }, () => undefined);
        handle = views.push(LobbyView, untrack(model), {
          onIntent: (name, payload) => {
            const p = payload as { players?: number; key?: string } | undefined;
            if (name === 'pick' && p?.players) setPlayers(p.players);
            else if (name === 'name') {
              // the name box takes the keyboard (NameEntry types into it); on a phone the on-screen keyboard shows
              const on = !nameEditing();
              setNameEditing(on);
              if (on) void services.keyboard.show({ type: 'text', text: playerName() }).catch(() => undefined);
              else void services.keyboard.hide().catch(() => undefined);
            }
            else if (name === 'host') {
              if (noLan) return; // the browser cannot host: only PLAY ON SERVER
              try {
                const hosted = multiplayer.host({ players: players() });
                setAddress(hosted.url);
                setJoined(1);
                setMode('hosting');
                say(HOST_STATUS);
              } catch (e) {
                say(message(e), true);
              }
            } else if (name === 'server') {
              if (mode() !== 'idle') return;
              try {
                // an open room: the fullest running room with a free seat, or a new one (always the full 4 seats)
                multiplayer.join(pageServer ? { server: pageServer, players: SERVER_SEATS } : { players: SERVER_SEATS });
                setJoining('the server');
                setMode('joining');
                say('Connecting to the server...');
              } catch (e) {
                say(message(e), true);
              }
            } else if (name === 'cancel') {
              multiplayer.leave();
              reset();
            } else if (name === 'join' && p?.key?.startsWith('r')) {
              const r = rooms()[Number(p.key.slice(1))];
              if (!r) return;
              try {
                multiplayer.join({ server: r.server, room: r.room, players: SERVER_SEATS });
                setJoining('the room');
                setMode('joining');
                say('Joining the room...');
              } catch (e) {
                say(message(e), true);
              }
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
        if (nameEditing()) {
          setNameEditing(false);
          void services.keyboard.hide().catch(() => undefined);
        }
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
