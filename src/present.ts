/**
 * Presentation: the first-person weapon (bob, recoil, loaded stone, drop on death), the aim zoom and camera shake.
 * All LateUpdate: it reads the sim and writes only VisualOffset / Camera, so no hash ever sees it.
 */
import { defineSystem, query, read, write, math, shakeCamera, Camera, VirtualCamera, VisualOffset } from '@gameengine/runtime';
import { Cloud, Critter, CritterHit, IceShell, Player, SeatCam, ShotFired, SoloLook, StoneMissed, Viewmodel } from './schema.gen.ts';
import { inOnlineMatch, localSeat } from './net.ts';
import { netLook } from './netstate.ts';

/** The rig plays its own clips (ViewmodelAnim in the sim); this only shows the stone in the pouch while its seat's stone is loaded (and this device plays that seat). */
export const ViewmodelMotion = defineSystem({
  name: 'ViewmodelMotion',
  stage: 'LateUpdate',
  queries: { parts: query(read(Viewmodel), write(VisualOffset)), player: query(read(Player)) },
  run(ctx, { parts, player }) {
    const me = localSeat();
    let loaded = false;
    for (const c of player.chunks()) {
      for (let i = 0; i < c.length; i++) {
        const p = c.get(Player, i);
        if (p.index === me) loaded = p.loaded && p.state !== 'Dead';
      }
    }
    for (const c of parts.chunks()) {
      for (let i = 0; i < c.length; i++) {
        const k = loaded && c.get(Viewmodel, i).seat === me ? 1 : 0;
        c.set(VisualOffset, i, { scale: [k, k, k] });
      }
    }
  },
});

/** The aim zoom and the shake of shots, hits and misses of this device's seat. */
export const CameraFeel = defineSystem({
  name: 'CameraFeel',
  stage: 'LateUpdate',
  queries: { cams: query(read(Camera)), views: query(read(SeatCam), write(VirtualCamera)) },
  resources: [read(SoloLook)],
  events: [ShotFired, CritterHit, StoneMissed],
  run(ctx, { cams, views }) {
    const me = localSeat();
    // zoom is local: this device's right button (solo: SoloLook, online: the mouse sampler), never the sim
    const aiming = inOnlineMatch() ? netLook.aiming : ctx.get(SoloLook).aiming;
    let shots = 0;
    let hits = 0;
    let misses = 0;
    for (const e of ctx.events.read(ShotFired)) if (e.seat === me) shots++;
    for (const e of ctx.events.read(CritterHit)) if (e.seat === me) hits++;
    for (const e of ctx.events.read(StoneMissed)) if (e.seat === me) misses++;
    // the zoom is the fieldOfView of this seat's virtual camera (it is what the camera shows)
    for (const c of views.chunks()) {
      for (let i = 0; i < c.length; i++) {
        if (c.get(SeatCam, i).seat !== me) continue;
        const cur = c.get(VirtualCamera, i).fovY;
        const fov = cur + ((aiming ? 0.62 : 1.0) - cur) * 0.18;
        if (math.abs(fov - cur) > 1e-4) c.set(VirtualCamera, i, { fovY: fov });
      }
    }
    for (const c of cams.chunks()) {
      for (let i = 0; i < c.length; i++) {
        const e = c.entity(i);
        if (shots > 0) shakeCamera(e, 0.12);
        if (hits > 0) shakeCamera(e, 0.22);
        if (misses > 0) shakeCamera(e, 0.5);
      }
    }
  },
});

/** Clouds drift slowly around the world: each card circles its ring and keeps facing the middle. */
export const CloudDrift = defineSystem({
  name: 'CloudDrift',
  stage: 'LateUpdate',
  query: query(read(Cloud), write(VisualOffset)),
  run(ctx, q) {
    const t = ctx.step / 60;
    for (const c of q.chunks()) {
      for (let i = 0; i < c.length; i++) {
        const k = c.get(Cloud, i);
        const d = k.speed * t;
        const a0 = k.angle;
        const a = a0 + d;
        const r = k.radius;
        c.set(VisualOffset, i, {
          position: [(math.sin(a) - math.sin(a0)) * r, 0, (-math.cos(a) + math.cos(a0)) * r],
          rotation: [0, math.sin(-d / 2), 0, math.cos(-d / 2)],
        });
      }
    }
  },
});

/** The ice around every frozen character (players and bots): its shell is shown while its owner's freeze runs and hidden otherwise. */
export const IceFx = defineSystem({
  name: 'IceFx',
  stage: 'LateUpdate',
  queries: { ice: query(read(IceShell), write(VisualOffset)), players: query(read(Player)), bots: query(read(Critter)) },
  run(ctx, { ice, players, bots }) {
    const frozen = new Set<number>();
    for (const c of players.chunks()) for (let i = 0; i < c.length; i++) if (c.get(Player, i).freeze > 0 && c.get(Player, i).state !== 'Dead') frozen.add(c.get(Player, i).index);
    for (const c of bots.chunks()) for (let i = 0; i < c.length; i++) if (c.get(Critter, i).freeze > 0 && c.get(Critter, i).dead <= 0) frozen.add(100 + c.get(Critter, i).id);
    for (const c of ice.chunks()) {
      for (let i = 0; i < c.length; i++) {
        const k = frozen.has(c.get(IceShell, i).owner) ? 1 : 0;
        if (c.get(VisualOffset, i).scale[0] !== k) c.set(VisualOffset, i, { scale: [k, k, k] });
      }
    }
  },
});
