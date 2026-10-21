// @generated — do not edit. Regenerate with `pnpm gen` (tools/bindgen).
// This project's UI documents (ui/**/*.ui.json, ADR 0122) as types: `<Widget doc="…">` checks its
// props, codeAreas and refs against them. Types only: nothing imports this file at run time.
// Events are the names `onIntent` hears: `<id>` is the placing `<Widget>`'s `id` or `eventKey` (else a slug of
// its first text property's value, else the document's name), or in a document the use's key; `<item>` is a
// Repeat item's key.
import type { LocText } from '@gameengine/ui';

declare module '@gameengine/ui' {
  interface UiDocumentTypes {
    /**
     * Choice chip: a widget, button (ui/docs/choice-chip.ui.json)
     *
     * Properties:
     *   - `label`: text, default "2"
     *   - `on`: yesno, default false
     * Events: `<id>`
     * Code areas: none
     * Refs: none
     * Samples (`view render doc:choice-chip --sample …`): `off`, `on`
     */
    'choice-chip': {
      props: { label: string | { loc: string } | LocText; on: boolean };
      areas: never;
      refs: never;
    };
    /**
     * Host row: a widget (ui/docs/host-row.ui.json)
     *
     * Properties:
     *   - `name`: text, default "Ana's PC"
     *   - `count`: text, default "1/2"
     * Events: `<id>: join`
     * Code areas: none
     * Refs: `join`
     * Samples (`view render doc:host-row --sample …`): `default`, `long`
     */
    'host-row': {
      props: { name: string | { loc: string } | LocText; count: string | { loc: string } | LocText };
      areas: never;
      refs: 'join';
    };
    /**
     * HUD: a view (ui/docs/hud.ui.json)
     *
     * Properties:
     *   - `score`: number, default 0
     *   - `penalty`: number, default 1
     *   - `timeText`: text, default "06:00"
     *   - `urgent`: yesno, default false
     *   - `banner`: text, default ""
     *   - `bannerSub`: text, default ""
     *   - `hint`: yesno, default true
     *   - `cd`: number, default 0
     *   - `ring`: number, default 1
     *   - `ready`: yesno, default true
     *   - `stone`: enum loaded | flying | gone, default "loaded"
     *   - `readyPulse`: trigger (a counter: each change fires it)
     *   - `bannerPop`: trigger (a counter: each change fires it)
     *   - `tone`: enum hit | miss | hurt | over, default "hit"
     *   - `placeText`: text, default "1st / 1"
     *   - `first`: yesno, default false
     *   - `board`: yesno, default false
     *   - `rows`: list of hud-row
     * Events: `leaderboard`
     * Code areas: none
     * Refs: `leaderboard`
     * Samples (`view render doc:hud --sample …`): `play`, `cooling`, `hit`, `miss`, `over`, `hurt`
     */
    'hud': {
      props: { score: number; penalty: number; timeText: string | { loc: string } | LocText; urgent: boolean; banner: string | { loc: string } | LocText; bannerSub: string | { loc: string } | LocText; hint: boolean; cd: number; ring: number; ready: boolean; stone: 'loaded' | 'flying' | 'gone'; readyPulse: number; bannerPop: number; tone: 'hit' | 'miss' | 'hurt' | 'over'; placeText: string | { loc: string } | LocText; first: boolean; board: boolean; rows: readonly { key: string; rank?: string | { loc: string } | LocText; name?: string | { loc: string } | LocText; score?: number; me?: boolean }[] };
      areas: never;
      refs: 'leaderboard';
    };
    /**
     * HUD leaderboard toggle: a widget, button (ui/docs/hud-chevron.ui.json)
     *
     * Properties:
     *   - `open`: yesno, default false
     * Events: `<id>`
     * Code areas: none
     * Refs: none
     * Samples (`view render doc:hud-chevron --sample …`): `closed`, `opened`
     */
    'hud-chevron': {
      props: { open: boolean };
      areas: never;
      refs: never;
    };
    /**
     * HUD leaderboard row: a widget (ui/docs/hud-row.ui.json)
     *
     * Properties:
     *   - `rank`: text, default "1"
     *   - `name`: text, default "You"
     *   - `score`: number, default 0
     *   - `me`: yesno, default false
     * Events: none
     * Code areas: none
     * Refs: none
     * Samples (`view render doc:hud-row --sample …`): `other`, `mine`
     */
    'hud-row': {
      props: { rank: string | { loc: string } | LocText; name: string | { loc: string } | LocText; score: number; me: boolean };
      areas: never;
      refs: never;
    };
    /**
     * Key row: a widget (ui/docs/key-row.ui.json)
     *
     * Properties:
     *   - `keycap`: text, default "WASD"
     *   - `action`: text, default "Move"
     * Events: none
     * Code areas: none
     * Refs: none
     * Samples (`view render doc:key-row --sample …`): `move`
     */
    'key-row': {
      props: { keycap: string | { loc: string } | LocText; action: string | { loc: string } | LocText };
      areas: never;
      refs: never;
    };
    /**
     * Loading screen: a view (ui/docs/loading-screen.ui.json)
     *
     * Properties:
     *   - `progress`: number, default 0
     *   - `tip`: text, default "Missing costs you a point."
     *   - `tipSwap`: trigger (a counter: each change fires it)
     * Events: none
     * Code areas: none
     * Refs: `acorn1`, `acorn2`, `acorn3`
     * Samples (`view render doc:loading-screen --sample …`): `mid`, `start`
     */
    'loading-screen': {
      props: { progress: number; tip: string | { loc: string } | LocText; tipSwap: number };
      areas: never;
      refs: 'acorn1' | 'acorn2' | 'acorn3';
    };
    /**
     * Lobby: a view, dialog (ui/docs/lobby.ui.json)
     *
     * Properties:
     *   - `pick2`: yesno, default true
     *   - `pick3`: yesno, default false
     *   - `pick4`: yesno, default false
     *   - `mode`: enum idle | hosting | joining, default "idle"
     *   - `waitText`: text, default "1 / 2"
     *   - `address`: text, default "ws://192.168.1.20:7600"
     *   - `hosts`: list of host-row
     *   - `listing`: yesno, default false
     *   - `findNote`: text, default "Searching the local network..."
     *   - `status`: text, default "Pick a size and host, or join a match on your network."
     *   - `error`: yesno, default false
     * Events: `p2`, `p3`, `p4`, `host`, `cancel`, `join (<item>)`, `back`
     * Code areas: none
     * Refs: `p2`, `p3`, `p4`, `host`, `cancel`, `back`
     */
    'lobby': {
      props: { pick2: boolean; pick3: boolean; pick4: boolean; mode: 'idle' | 'hosting' | 'joining'; waitText: string | { loc: string } | LocText; address: string | { loc: string } | LocText; hosts: readonly { key: string; name?: string | { loc: string } | LocText; count?: string | { loc: string } | LocText }[]; listing: boolean; findNote: string | { loc: string } | LocText; status: string | { loc: string } | LocText; error: boolean };
      areas: never;
      refs: 'p2' | 'p3' | 'p4' | 'host' | 'cancel' | 'back';
    };
    /**
     * Pause menu: a view, dialog (ui/docs/pause-menu.ui.json)
     *
     * Properties:
     *   - `sensAmount`: number, default 0.5
     *   - `sensText`: text, default "50%"
     *   - `masterAmount`: number, default 0.5
     *   - `masterText`: text, default "50%"
     *   - `musicAmount`: number, default 0.5
     *   - `musicText`: text, default "50%"
     *   - `sfxAmount`: number, default 0.5
     *   - `sfxText`: text, default "50%"
     *   - `fromStart`: yesno, default false
     * Events: `resume`, `quit`, `back`
     * Code areas: `sens.hit`, `master.hit`, `music.hit`, `sfx.hit`
     * Refs: `resume`, `quit`, `back`, `k1`, `k2`, `k3`, `k4`, `k5`, `k6`, `k7`, `k8`, `k9`, `sens`, `master`, `music`, `sfx`
     * Samples (`view render doc:pause-menu --sample …`): `default`
     */
    'pause-menu': {
      props: { sensAmount: number; sensText: string | { loc: string } | LocText; masterAmount: number; masterText: string | { loc: string } | LocText; musicAmount: number; musicText: string | { loc: string } | LocText; sfxAmount: number; sfxText: string | { loc: string } | LocText; fromStart: boolean };
      areas: 'sens.hit' | 'master.hit' | 'music.hit' | 'sfx.hit';
      refs: 'resume' | 'quit' | 'back' | 'k1' | 'k2' | 'k3' | 'k4' | 'k5' | 'k6' | 'k7' | 'k8' | 'k9' | 'sens' | 'master' | 'music' | 'sfx';
    };
    /**
     * Rule row: a widget (ui/docs/rule-row.ui.json)
     *
     * Properties:
     *   - `badge`: text, default "+1"
     *   - `label`: text, default "Hit an opponent"
     *   - `value`: text, default "+1 point"
     *   - `tone`: enum green | orange | red | gold, default "green"
     * Events: none
     * Code areas: none
     * Refs: none
     * Samples (`view render doc:rule-row --sample …`): `hit`, `miss`, `hurt`, `win`
     */
    'rule-row': {
      props: { badge: string | { loc: string } | LocText; label: string | { loc: string } | LocText; value: string | { loc: string } | LocText; tone: 'green' | 'orange' | 'red' | 'gold' };
      areas: never;
      refs: never;
    };
    /**
     * Slider row: a widget (ui/docs/slider-row.ui.json)
     *
     * Properties:
     *   - `label`: text, default "Master volume"
     *   - `valueText`: text, default "100%"
     *   - `amount`: number, default 0.5
     * Events: none
     * Code areas: `hit`
     * Refs: none
     * Samples (`view render doc:slider-row --sample …`): `mid`, `full`, `low`
     */
    'slider-row': {
      props: { label: string | { loc: string } | LocText; valueText: string | { loc: string } | LocText; amount: number };
      areas: 'hit';
      refs: never;
    };
    /**
     * Start menu: a view, screen (ui/docs/start-menu.ui.json)
     *
     * Properties: none
     * Events: `join`, `solo`, `options`
     * Code areas: none
     * Refs: `join`, `solo`, `options`, `r1`, `r2`, `r3`, `r4`
     * Samples (`view render doc:start-menu --sample …`): `default`
     */
    'start-menu': {
      props: {};
      areas: never;
      refs: 'join' | 'solo' | 'options' | 'r1' | 'r2' | 'r3' | 'r4';
    };
    /**
     * Button: a widget, button (ui/docs/ui-button.ui.json)
     *
     * Properties:
     *   - `label`: text, default "BUTTON"
     *   - `tone`: enum green | amber | red | wood, default "green"
     * Events: `<id>`
     * Code areas: none
     * Refs: none
     * Samples (`view render doc:ui-button --sample …`): `green`, `amber`, `red`
     */
    'ui-button': {
      props: { label: string | { loc: string } | LocText; tone: 'green' | 'amber' | 'red' | 'wood' };
      areas: never;
      refs: never;
    };
  }
}
