/** The online lobby over the start screen: host a 2-4 player match or join one found on the network. Intents: pick {players}, host, cancel, join {key}, back. */
import { Widget, defineView } from '@gameengine/ui';

export interface LobbyHost {
  /** What the join intent carries back. */
  key: string;
  name: string;
  joined: number;
  players: number;
}

export interface LobbyModel {
  /** The match size HOST asks for. */
  players: number;
  /** idle: searching the network; hosting: this PC serves a match; joining: connecting to or waiting in another's. */
  mode: 'idle' | 'hosting' | 'joining';
  /** Hosting: players in the match so far (the host is one). */
  joined: number;
  /** Hosting: the address players elsewhere type (hosting.url). */
  address: string;
  /** Matches found on the network (at most 4 are shown). */
  hosts: LobbyHost[];
  /** The bottom line: what is happening, or what went wrong. */
  status: string;
  error: boolean;
}

const IDLE_STATUS = 'Pick a size and host, or join a match on your network.';

const findNote = (m: LobbyModel) =>
  m.mode === 'hosting' ? 'You are hosting: finding other matches is paused.'
    : m.mode === 'joining' ? 'You joined a match: finding is paused.'
      : 'Searching the local network...';

export const LobbyView = defineView<LobbyModel>({
  name: 'Lobby',
  description: 'PLAY ONLINE dialog: host a 2/3/4 player match (then waiting count, address, Cancel), matches found on the network with Join, a status line and Back. Intents: pick {players}, host, cancel, join {key}, back.',
  samples: {
    searching: { players: 2, mode: 'idle', joined: 0, address: '', hosts: [], status: IDLE_STATUS, error: false },
    found: {
      players: 2, mode: 'idle', joined: 0, address: '', status: IDLE_STATUS, error: false,
      hosts: [
        { key: 'h0', name: "Ana's PC", joined: 1, players: 2 },
        { key: 'h1', name: 'TREEHOUSE-GAMING-RIG-02', joined: 2, players: 4 },
        { key: 'h2', name: 'Lasse', joined: 1, players: 3 },
      ],
    },
    hosting: { players: 3, mode: 'hosting', joined: 2, address: 'ws://192.168.1.20:7600', hosts: [], status: 'The match starts by itself when everyone is in.', error: false },
    joining: { players: 2, mode: 'joining', joined: 0, address: '', hosts: [], status: "Joined Ana's PC. Waiting for the others...", error: false },
    error: {
      players: 2, mode: 'idle', joined: 0, address: '', hosts: [], error: true,
      status: '192.168.1.31 found your match but could not connect: allow TCP port 7600 in this PC\'s firewall.',
    },
  },
  dims: true,
  blockInput: true,
  render: (model, { intent }) => (
    <Widget
      doc="lobby"
      props={{
        pick2: () => model().players === 2,
        pick3: () => model().players === 3,
        pick4: () => model().players === 4,
        mode: () => model().mode,
        waitText: () => `${model().joined} / ${model().players}`,
        address: () => model().address,
        hosts: () => model().hosts.slice(0, 4).map((h) => ({ key: h.key, name: h.name, count: `${h.joined}/${h.players}` })),
        listing: () => model().mode === 'idle' && model().hosts.length > 0,
        findNote: () => findNote(model()),
        status: () => model().status,
        error: () => model().error,
      }}
      onIntent={(_, e) => {
        const k = e.path.at(-1)!;
        if (k === 'p2' || k === 'p3' || k === 'p4') intent('pick', { players: Number(k.slice(1)) });
        else if (k === 'join') intent('join', { key: e.item });
        else if (k === 'host' || k === 'cancel' || k === 'back') intent(k);
      }}
    />
  ),
});
