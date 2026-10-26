// @generated — do not edit. Regenerate with `pnpm gen` (tools/bindgen).
import { typeToken, rowRead as $r, registerSchema, type EntityId } from '@gameengine/runtime';

export type { EntityId };

/** Project schema IR, registered with the engine when the bundle boots. */
export const schemaIr = {
  "version": 1,
  "package": "OneShot",
  "enums": [
    {
      "name": "FlowScreen",
      "values": [
        "Start",
        "Loading",
        "Playing",
        "Paused"
      ],
      "package": "OneShot"
    },
    {
      "name": "FlowMode",
      "values": [
        "Solo",
        "Online"
      ],
      "package": "OneShot"
    },
    {
      "name": "MatchPhase",
      "values": [
        "Playing",
        "Over"
      ],
      "package": "OneShot"
    },
    {
      "name": "PlayerState",
      "values": [
        "Alive",
        "Dead"
      ],
      "package": "OneShot"
    },
    {
      "name": "ViewPart",
      "values": [
        "Frame",
        "Pouch",
        "Stone"
      ],
      "package": "OneShot"
    }
  ],
  "types": [
    {
      "name": "Cloud",
      "kind": "component",
      "sim": false,
      "fields": [
        {
          "name": "angle",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "doc": "Where on the ring it starts (rad)"
        },
        {
          "name": "radius",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 220
        },
        {
          "name": "speed",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 0.008,
          "doc": "Rad per second around the ring"
        }
      ],
      "package": "OneShot"
    },
    {
      "name": "Flow",
      "kind": "resource",
      "sim": true,
      "fields": [
        {
          "name": "screen",
          "kind": "enum",
          "scalar": "u8",
          "lanes": 1,
          "enumName": "FlowScreen",
          "default": "Start"
        },
        {
          "name": "mode",
          "kind": "enum",
          "scalar": "u8",
          "lanes": 1,
          "enumName": "FlowMode",
          "default": "Solo"
        },
        {
          "name": "loadTime",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "doc": "Seconds spent on the loading screen (it never ends before 1.2 s, and only once GameReady arrived)"
        },
        {
          "name": "ready",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "doc": "The presentation reported that the world is drawn and warm (GameReady)"
        },
        {
          "name": "matchSeed",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "doc": "Bumped whenever a match starts, so the UI can restart per-match effects"
        },
        {
          "name": "trimmed",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "doc": "The seats and bots the match does not use were removed"
        },
        {
          "name": "seated",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "doc": "Online: every seat started empty, to be filled by SeatChanged (or by the fixed-match fallback)"
        },
        {
          "name": "presence",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "doc": "Online: the server told the sim who is in a seat at least once"
        },
        {
          "name": "onlineFor",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "doc": "Online: seconds since the match began while no presence has come yet"
        }
      ],
      "package": "OneShot"
    },
    {
      "name": "GameReady",
      "kind": "event",
      "sim": true,
      "fields": [],
      "package": "OneShot"
    },
    {
      "name": "Jumped",
      "kind": "event",
      "sim": true,
      "fields": [
        {
          "name": "seat",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        }
      ],
      "package": "OneShot"
    },
    {
      "name": "MouseState",
      "kind": "resource",
      "sim": false,
      "fields": [
        {
          "name": "captured",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1
        }
      ],
      "package": "OneShot"
    },
    {
      "name": "QuitToMenu",
      "kind": "event",
      "sim": true,
      "fields": [],
      "package": "OneShot"
    },
    {
      "name": "ResumeGame",
      "kind": "event",
      "sim": true,
      "fields": [],
      "package": "OneShot"
    },
    {
      "name": "SetSensitivity",
      "kind": "event",
      "sim": true,
      "fields": [
        {
          "name": "value",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 1
        }
      ],
      "package": "OneShot"
    },
    {
      "name": "Settings",
      "kind": "resource",
      "sim": true,
      "fields": [
        {
          "name": "sensitivity",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 1,
          "min": 0.2,
          "max": 3,
          "doc": "Mouse-look multiplier"
        }
      ],
      "package": "OneShot"
    },
    {
      "name": "StartSolo",
      "kind": "event",
      "sim": true,
      "fields": [],
      "package": "OneShot"
    },
    {
      "name": "SuperJumped",
      "kind": "event",
      "sim": true,
      "fields": [
        {
          "name": "seat",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        }
      ],
      "package": "OneShot"
    },
    {
      "name": "VmRig",
      "kind": "component",
      "sim": true,
      "fields": [
        {
          "name": "index",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "doc": "Seat it belongs to"
        }
      ],
      "package": "OneShot"
    },
    {
      "name": "Announce",
      "kind": "event",
      "sim": true,
      "fields": [
        {
          "name": "kind",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "a",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "b",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        }
      ],
      "package": "OneShot"
    },
    {
      "name": "Blocker",
      "kind": "component",
      "sim": true,
      "fields": [
        {
          "name": "radius",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "doc": "Disc footprint radius (0: use the rectangle)"
        },
        {
          "name": "halfX",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 1
        },
        {
          "name": "halfZ",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 1
        },
        {
          "name": "yaw",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "doc": "Rotation of the rectangle about Y (rad)"
        },
        {
          "name": "y0",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "doc": "Underside height: a jump that reaches it stops here"
        },
        {
          "name": "y1",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "doc": "Top height (the floor when walk is on)"
        },
        {
          "name": "walk",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "doc": "The top can be stood on (a bridge)"
        }
      ],
      "package": "OneShot",
      "doc": "A volume the player cannot jump up through (a canopy, a deck, a bridge); with walk it is also a floor."
    },
    {
      "name": "Critter",
      "kind": "component",
      "sim": true,
      "fields": [
        {
          "name": "heading",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1
        },
        {
          "name": "turn",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "doc": "Seconds until the next change of heading"
        },
        {
          "name": "speed",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 2.4
        },
        {
          "name": "dead",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "doc": "Seconds until it is back (0 = alive)"
        },
        {
          "name": "freeze",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "doc": "Seconds until a missed shot thaws (frozen: no wandering or shooting, still hittable)"
        },
        {
          "name": "home",
          "kind": "vec3",
          "scalar": "f32",
          "lanes": 3
        },
        {
          "name": "id",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "doc": "Bot number (1..N); stones carry it as their owner"
        },
        {
          "name": "score",
          "kind": "i32",
          "scalar": "i32",
          "lanes": 1
        },
        {
          "name": "loaded",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": true,
          "doc": "The bot holds its stone"
        },
        {
          "name": "aim",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 3,
          "doc": "Seconds until it may shoot"
        }
      ],
      "package": "OneShot"
    },
    {
      "name": "CritterHit",
      "kind": "event",
      "sim": true,
      "fields": [
        {
          "name": "position",
          "kind": "vec3",
          "scalar": "f32",
          "lanes": 3
        },
        {
          "name": "seat",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "doc": "The seat that scored the hit"
        }
      ],
      "package": "OneShot"
    },
    {
      "name": "IceShell",
      "kind": "component",
      "sim": false,
      "fields": [
        {
          "name": "owner",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "doc": "A seat 0..3, or 100 + a bot number"
        }
      ],
      "package": "OneShot"
    },
    {
      "name": "Ladder",
      "kind": "component",
      "sim": true,
      "fields": [
        {
          "name": "top",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 5.3,
          "doc": "Feet height of the platform at the top"
        },
        {
          "name": "nx",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "doc": "Outward direction (x) the climber hangs on"
        },
        {
          "name": "nz",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "doc": "Outward direction (z)"
        },
        {
          "name": "reach",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 1.5,
          "doc": "How near a jumping player grabs it"
        }
      ],
      "package": "OneShot",
      "doc": "A climbable ladder: jump next to it to grab, W/S climb, Space lets go, the top steps onto the platform."
    },
    {
      "name": "LocalHud",
      "kind": "resource",
      "sim": false,
      "fields": [
        {
          "name": "seat",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "doc": "The seat this device plays"
        },
        {
          "name": "score",
          "kind": "i32",
          "scalar": "i32",
          "lanes": 1
        },
        {
          "name": "hits",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "playerDead",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1
        },
        {
          "name": "respawnIn",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "doc": "Whole seconds until respawn"
        },
        {
          "name": "freezeIn",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "doc": "Whole seconds until this seat thaws (0 = not frozen)"
        },
        {
          "name": "stoneLoaded",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": true
        },
        {
          "name": "superCd",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "doc": "Whole seconds until the launch jump is ready"
        },
        {
          "name": "deathBy",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "rank",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "doc": "Place among everyone in the round, players and bots (1 = best)"
        },
        {
          "name": "players",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "doc": "How many are in the round, players and bots"
        },
        {
          "name": "rows",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "doc": "Leaderboard rows filled (the best, at most 8)"
        },
        {
          "name": "row0",
          "kind": "i32",
          "scalar": "i32",
          "lanes": 1
        },
        {
          "name": "row1",
          "kind": "i32",
          "scalar": "i32",
          "lanes": 1
        },
        {
          "name": "row2",
          "kind": "i32",
          "scalar": "i32",
          "lanes": 1
        },
        {
          "name": "row3",
          "kind": "i32",
          "scalar": "i32",
          "lanes": 1
        },
        {
          "name": "row4",
          "kind": "i32",
          "scalar": "i32",
          "lanes": 1
        },
        {
          "name": "row5",
          "kind": "i32",
          "scalar": "i32",
          "lanes": 1
        },
        {
          "name": "row6",
          "kind": "i32",
          "scalar": "i32",
          "lanes": 1
        },
        {
          "name": "row7",
          "kind": "i32",
          "scalar": "i32",
          "lanes": 1
        }
      ],
      "package": "OneShot"
    },
    {
      "name": "Match",
      "kind": "resource",
      "sim": true,
      "fields": [
        {
          "name": "timeLeft",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 360,
          "doc": "Seconds left in the round"
        },
        {
          "name": "phase",
          "kind": "enum",
          "scalar": "u8",
          "lanes": 1,
          "enumName": "MatchPhase",
          "default": "Playing"
        },
        {
          "name": "overTimer",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "doc": "Seconds the results stay up before the next round"
        }
      ],
      "package": "OneShot"
    },
    {
      "name": "NetLook",
      "kind": "resource",
      "sim": false,
      "fields": [
        {
          "name": "yaw",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1
        },
        {
          "name": "pitch",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1
        },
        {
          "name": "aiming",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1
        },
        {
          "name": "menuHeld",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1
        },
        {
          "name": "boardHeld",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1
        },
        {
          "name": "seeded",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "doc": "yaw and pitch were taken from the seat once"
        }
      ],
      "package": "OneShot"
    },
    {
      "name": "Platform",
      "kind": "component",
      "sim": true,
      "fields": [
        {
          "name": "halfX",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 3
        },
        {
          "name": "halfZ",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 3
        },
        {
          "name": "top",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 0.35
        }
      ],
      "package": "OneShot",
      "doc": "A walkable deck: the player stands on its top inside its footprint."
    },
    {
      "name": "Player",
      "kind": "component",
      "sim": true,
      "fields": [
        {
          "name": "index",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "doc": "Seat 0..3: which PlayerInputs entry drives this player"
        },
        {
          "name": "yaw",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1
        },
        {
          "name": "pitch",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1
        },
        {
          "name": "score",
          "kind": "i32",
          "scalar": "i32",
          "lanes": 1,
          "doc": "Points held"
        },
        {
          "name": "hits",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "misses",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "deaths",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "deathBy",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "doc": "Who ended the last life: 0 = the own miss, a bot id, or 1000 + the seat that hit"
        },
        {
          "name": "vy",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "doc": "Vertical speed (m/s)"
        },
        {
          "name": "speed",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "doc": "Horizontal speed, drives the weapon bob"
        },
        {
          "name": "state",
          "kind": "enum",
          "scalar": "u8",
          "lanes": 1,
          "enumName": "PlayerState",
          "default": "Alive"
        },
        {
          "name": "respawn",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "doc": "Seconds until the player is back"
        },
        {
          "name": "freeze",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "doc": "Seconds until a missed shot thaws: frozen means no moving or firing, and still being hittable"
        },
        {
          "name": "protect",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "doc": "Spawn protection seconds"
        },
        {
          "name": "loaded",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": true,
          "doc": "The stone is in the sling"
        },
        {
          "name": "aiming",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1
        },
        {
          "name": "fireHeld",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "doc": "The fire button was down last step (edge detection)"
        },
        {
          "name": "jumpHeld",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "doc": "Space was down last step (edge detection)"
        },
        {
          "name": "sinceJump",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 9,
          "doc": "Seconds since the last jump press (double-tap window)"
        },
        {
          "name": "superCd",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "doc": "Seconds until the double-jump launch is ready again"
        },
        {
          "name": "climbing",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "doc": "Holding a ladder (W/S climb, Space lets go)"
        },
        {
          "name": "ladderX",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1
        },
        {
          "name": "ladderZ",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1
        },
        {
          "name": "ladderNx",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "doc": "Outward direction of the ladder (the side the player hangs on)"
        },
        {
          "name": "ladderNz",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1
        },
        {
          "name": "ladderTop",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "doc": "Feet height at the top of the ladder"
        },
        {
          "name": "ladderCool",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "doc": "Seconds before the player can grab a ladder again"
        },
        {
          "name": "eye",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 1.65,
          "doc": "Eye height above the feet (lower while crouching)"
        },
        {
          "name": "crouch",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "doc": "Crouch-walking (Shift): slower, lower, harder to spot"
        },
        {
          "name": "active",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": true,
          "doc": "A player is in this seat (online: set by SeatChanged; an empty seat is hidden and skipped)"
        }
      ],
      "package": "OneShot"
    },
    {
      "name": "PlayerHit",
      "kind": "event",
      "sim": true,
      "fields": [
        {
          "name": "by",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "seat",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "doc": "The seat that was hit"
        }
      ],
      "package": "OneShot"
    },
    {
      "name": "PlayerRespawned",
      "kind": "event",
      "sim": true,
      "fields": [
        {
          "name": "seat",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        }
      ],
      "package": "OneShot"
    },
    {
      "name": "SeatBody",
      "kind": "component",
      "sim": true,
      "fields": [
        {
          "name": "index",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "doc": "Seat it shows"
        }
      ],
      "package": "OneShot"
    },
    {
      "name": "SeatCam",
      "kind": "component",
      "sim": false,
      "fields": [
        {
          "name": "seat",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        }
      ],
      "package": "OneShot"
    },
    {
      "name": "SeatChanged",
      "kind": "event",
      "sim": true,
      "fields": [
        {
          "name": "seat",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "present",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1
        },
        {
          "name": "fresh",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1
        }
      ],
      "package": "OneShot"
    },
    {
      "name": "ShotFired",
      "kind": "event",
      "sim": true,
      "fields": [
        {
          "name": "position",
          "kind": "vec3",
          "scalar": "f32",
          "lanes": 3
        },
        {
          "name": "direction",
          "kind": "vec3",
          "scalar": "f32",
          "lanes": 3
        },
        {
          "name": "seat",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        }
      ],
      "package": "OneShot"
    },
    {
      "name": "Solid",
      "kind": "component",
      "sim": true,
      "fields": [
        {
          "name": "radius",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 1
        },
        {
          "name": "height",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 100,
          "doc": "Top of the obstacle, metres"
        },
        {
          "name": "walk",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "doc": "Its top can be stood on, and a jump clears it: crates, rocks, barrels"
        }
      ],
      "package": "OneShot",
      "doc": "A vertical cylinder players, critters and stones cannot pass."
    },
    {
      "name": "SoloLook",
      "kind": "resource",
      "sim": true,
      "fields": [
        {
          "name": "yaw",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1
        },
        {
          "name": "pitch",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1
        },
        {
          "name": "lookX",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1
        },
        {
          "name": "lookY",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1
        },
        {
          "name": "hasLook",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1
        },
        {
          "name": "aiming",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1
        },
        {
          "name": "fireHeld",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "doc": "The left button is down"
        }
      ],
      "package": "OneShot"
    },
    {
      "name": "SpawnPoint",
      "kind": "component",
      "sim": true,
      "fields": [],
      "package": "OneShot"
    },
    {
      "name": "Stone",
      "kind": "component",
      "sim": true,
      "fields": [
        {
          "name": "velocity",
          "kind": "vec3",
          "scalar": "f32",
          "lanes": 3
        },
        {
          "name": "life",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "doc": "Seconds in flight"
        },
        {
          "name": "travelled",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "doc": "Metres flown"
        },
        {
          "name": "owner",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "doc": "Who shot it: a bot id, or 1000 + the seat of a player"
        }
      ],
      "package": "OneShot"
    },
    {
      "name": "StoneMissed",
      "kind": "event",
      "sim": true,
      "fields": [
        {
          "name": "position",
          "kind": "vec3",
          "scalar": "f32",
          "lanes": 3
        },
        {
          "name": "seat",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "doc": "The seat that missed (bots: 99)"
        }
      ],
      "package": "OneShot"
    },
    {
      "name": "Temp",
      "kind": "component",
      "sim": true,
      "fields": [
        {
          "name": "life",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 1.5,
          "doc": "Seconds until the entity is removed"
        }
      ],
      "package": "OneShot"
    },
    {
      "name": "Viewmodel",
      "kind": "component",
      "sim": false,
      "fields": [
        {
          "name": "part",
          "kind": "enum",
          "scalar": "u8",
          "lanes": 1,
          "enumName": "ViewPart",
          "default": "Frame"
        },
        {
          "name": "seat",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "doc": "Seat whose rig this belongs to"
        }
      ],
      "package": "OneShot",
      "doc": "A first-person weapon part the presentation animates (recoil, bob, loaded stone)."
    },
    {
      "name": "AirReady",
      "kind": "event",
      "sim": true,
      "fields": [
        {
          "name": "seat",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        }
      ],
      "package": "OneShot"
    },
    {
      "name": "FxHost",
      "kind": "component",
      "sim": true,
      "fields": [
        {
          "name": "kind",
          "kind": "string",
          "scalar": "u32",
          "lanes": 1,
          "doc": "Which effect this host plays (see src/vfx.ts)"
        }
      ],
      "package": "OneShot"
    },
    {
      "name": "FxState",
      "kind": "resource",
      "sim": false,
      "fields": [
        {
          "name": "step",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "doc": "Last sim step looked at"
        },
        {
          "name": "prevVy",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1
        },
        {
          "name": "minVy",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "doc": "Fastest fall since leaving the ground"
        },
        {
          "name": "grounded",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": true
        },
        {
          "name": "stride",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "doc": "Metres walked since the last footstep puff"
        },
        {
          "name": "foot",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "doc": "Which foot comes next"
        },
        {
          "name": "trailUntil",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "doc": "Step until which the double-jump trail is drawn"
        },
        {
          "name": "tracerStep",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "doc": "Last sim step the stone tracer was laid for"
        },
        {
          "name": "lastStone",
          "kind": "vec3",
          "scalar": "f32",
          "lanes": 3,
          "doc": "Where the stone was last seen (the tracer runs on to the impact)"
        },
        {
          "name": "hasStone",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1
        }
      ],
      "package": "OneShot"
    }
  ],
  "commands": [],
  "protocol": [],
  "services": []
} as const;
registerSchema(schemaIr);

export const FlowScreen = {
  Start: 0,
  Loading: 1,
  Playing: 2,
  Paused: 3,
} as const;
export type FlowScreenName = 'Start' | 'Loading' | 'Playing' | 'Paused';

export const FlowMode = {
  Solo: 0,
  Online: 1,
} as const;
export type FlowModeName = 'Solo' | 'Online';

export const MatchPhase = {
  Playing: 0,
  Over: 1,
} as const;
export type MatchPhaseName = 'Playing' | 'Over';

export const PlayerState = {
  Alive: 0,
  Dead: 1,
} as const;
export type PlayerStateName = 'Alive' | 'Dead';

export const ViewPart = {
  Frame: 0,
  Pouch: 1,
  Stone: 2,
} as const;
export type ViewPartName = 'Frame' | 'Pouch' | 'Stone';

export interface CloudViews {
  /** Where on the ring it starts (rad) */
  angle: Float32Array;
  radius: Float32Array;
  /** Rad per second around the ring */
  speed: Float32Array;
}
export interface CloudValue {
  /** Where on the ring it starts (rad) */
  angle: number;
  radius: number;
  /** Rad per second around the ring */
  speed: number;
}
/** Cloud (component, presentation-only) */
export const Cloud = typeToken<CloudViews, CloudValue>('Cloud', 'component', { sig: 'angle:f32:1,radius:f32:1,speed:f32:1', read: (v: CloudViews, i: number, o: Record<string, unknown>) => { o.angle = v.angle[i]; o.radius = v.radius[i]; o.speed = v.speed[i]; return o; } });

export interface FlowViews {
  screen: Uint8Array;
  mode: Uint8Array;
  /** Seconds spent on the loading screen (it never ends before 1.2 s, and only once GameReady arrived) */
  loadTime: Float32Array;
  /** The presentation reported that the world is drawn and warm (GameReady) */
  ready: Uint8Array;
  /** Bumped whenever a match starts, so the UI can restart per-match effects */
  matchSeed: Uint32Array;
  /** The seats and bots the match does not use were removed */
  trimmed: Uint8Array;
  /** Online: every seat started empty, to be filled by SeatChanged (or by the fixed-match fallback) */
  seated: Uint8Array;
  /** Online: the server told the sim who is in a seat at least once */
  presence: Uint8Array;
  /** Online: seconds since the match began while no presence has come yet */
  onlineFor: Float32Array;
}
export interface FlowValue {
  screen: FlowScreenName | number;
  mode: FlowModeName | number;
  /** Seconds spent on the loading screen (it never ends before 1.2 s, and only once GameReady arrived) */
  loadTime: number;
  /** The presentation reported that the world is drawn and warm (GameReady) */
  ready: boolean;
  /** Bumped whenever a match starts, so the UI can restart per-match effects */
  matchSeed: number;
  /** The seats and bots the match does not use were removed */
  trimmed: boolean;
  /** Online: every seat started empty, to be filled by SeatChanged (or by the fixed-match fallback) */
  seated: boolean;
  /** Online: the server told the sim who is in a seat at least once */
  presence: boolean;
  /** Online: seconds since the match began while no presence has come yet */
  onlineFor: number;
}
/** Flow (resource, sim) */
export const Flow = typeToken<FlowViews, FlowValue>('Flow', 'resource', { sig: 'screen:enum:1,mode:enum:1,loadTime:f32:1,ready:bool:1,matchSeed:u32:1,trimmed:bool:1,seated:bool:1,presence:bool:1,onlineFor:f32:1', read: (v: FlowViews, i: number, o: Record<string, unknown>) => { o.screen = $r.enm('FlowScreen', v.screen[i]!); o.mode = $r.enm('FlowMode', v.mode[i]!); o.loadTime = v.loadTime[i]; o.ready = v.ready[i] !== 0; o.matchSeed = v.matchSeed[i]; o.trimmed = v.trimmed[i] !== 0; o.seated = v.seated[i] !== 0; o.presence = v.presence[i] !== 0; o.onlineFor = v.onlineFor[i]; return o; } });

export type GameReadyViews = Record<string, never>;
export type GameReadyValue = Record<string, never>;
/** GameReady (event, sim) */
export const GameReady = typeToken<GameReadyViews, GameReadyValue>('GameReady', 'event');

export interface JumpedViews {
  seat: Uint32Array;
}
export interface JumpedValue {
  seat: number;
}
/** Jumped (event, sim) */
export const Jumped = typeToken<JumpedViews, JumpedValue>('Jumped', 'event', { sig: 'seat:u32:1', read: (v: JumpedViews, i: number, o: Record<string, unknown>) => { o.seat = v.seat[i]; return o; } });

export interface MouseStateViews {
  captured: Uint8Array;
}
export interface MouseStateValue {
  captured: boolean;
}
/** MouseState (resource, presentation-only) */
export const MouseState = typeToken<MouseStateViews, MouseStateValue>('MouseState', 'resource', { sig: 'captured:bool:1', read: (v: MouseStateViews, i: number, o: Record<string, unknown>) => { o.captured = v.captured[i] !== 0; return o; } });

export type QuitToMenuViews = Record<string, never>;
export type QuitToMenuValue = Record<string, never>;
/** QuitToMenu (event, sim) */
export const QuitToMenu = typeToken<QuitToMenuViews, QuitToMenuValue>('QuitToMenu', 'event');

export type ResumeGameViews = Record<string, never>;
export type ResumeGameValue = Record<string, never>;
/** ResumeGame (event, sim) */
export const ResumeGame = typeToken<ResumeGameViews, ResumeGameValue>('ResumeGame', 'event');

export interface SetSensitivityViews {
  value: Float32Array;
}
export interface SetSensitivityValue {
  value: number;
}
/** SetSensitivity (event, sim) */
export const SetSensitivity = typeToken<SetSensitivityViews, SetSensitivityValue>('SetSensitivity', 'event', { sig: 'value:f32:1', read: (v: SetSensitivityViews, i: number, o: Record<string, unknown>) => { o.value = v.value[i]; return o; } });

export interface SettingsViews {
  /** Mouse-look multiplier */
  sensitivity: Float32Array;
}
export interface SettingsValue {
  /** Mouse-look multiplier */
  sensitivity: number;
}
/** Settings (resource, sim) */
export const Settings = typeToken<SettingsViews, SettingsValue>('Settings', 'resource', { sig: 'sensitivity:f32:1', read: (v: SettingsViews, i: number, o: Record<string, unknown>) => { o.sensitivity = v.sensitivity[i]; return o; } });

export type StartSoloViews = Record<string, never>;
export type StartSoloValue = Record<string, never>;
/** StartSolo (event, sim) */
export const StartSolo = typeToken<StartSoloViews, StartSoloValue>('StartSolo', 'event');

export interface SuperJumpedViews {
  seat: Uint32Array;
}
export interface SuperJumpedValue {
  seat: number;
}
/** SuperJumped (event, sim) */
export const SuperJumped = typeToken<SuperJumpedViews, SuperJumpedValue>('SuperJumped', 'event', { sig: 'seat:u32:1', read: (v: SuperJumpedViews, i: number, o: Record<string, unknown>) => { o.seat = v.seat[i]; return o; } });

export interface VmRigViews {
  /** Seat it belongs to */
  index: Uint32Array;
}
export interface VmRigValue {
  /** Seat it belongs to */
  index: number;
}
/** VmRig (component, sim) */
export const VmRig = typeToken<VmRigViews, VmRigValue>('VmRig', 'component', { sig: 'index:u32:1', read: (v: VmRigViews, i: number, o: Record<string, unknown>) => { o.index = v.index[i]; return o; } });

export interface AnnounceViews {
  kind: Uint32Array;
  a: Uint32Array;
  b: Uint32Array;
}
export interface AnnounceValue {
  kind: number;
  a: number;
  b: number;
}
/** Announce (event, sim) */
export const Announce = typeToken<AnnounceViews, AnnounceValue>('Announce', 'event', { sig: 'kind:u32:1,a:u32:1,b:u32:1', read: (v: AnnounceViews, i: number, o: Record<string, unknown>) => { o.kind = v.kind[i]; o.a = v.a[i]; o.b = v.b[i]; return o; } });

export interface BlockerViews {
  /** Disc footprint radius (0: use the rectangle) */
  radius: Float32Array;
  halfX: Float32Array;
  halfZ: Float32Array;
  /** Rotation of the rectangle about Y (rad) */
  yaw: Float32Array;
  /** Underside height: a jump that reaches it stops here */
  y0: Float32Array;
  /** Top height (the floor when walk is on) */
  y1: Float32Array;
  /** The top can be stood on (a bridge) */
  walk: Uint8Array;
}
export interface BlockerValue {
  /** Disc footprint radius (0: use the rectangle) */
  radius: number;
  halfX: number;
  halfZ: number;
  /** Rotation of the rectangle about Y (rad) */
  yaw: number;
  /** Underside height: a jump that reaches it stops here */
  y0: number;
  /** Top height (the floor when walk is on) */
  y1: number;
  /** The top can be stood on (a bridge) */
  walk: boolean;
}
/** A volume the player cannot jump up through (a canopy, a deck, a bridge); with walk it is also a floor. (component, sim) */
export const Blocker = typeToken<BlockerViews, BlockerValue>('Blocker', 'component', { sig: 'radius:f32:1,halfX:f32:1,halfZ:f32:1,yaw:f32:1,y0:f32:1,y1:f32:1,walk:bool:1', read: (v: BlockerViews, i: number, o: Record<string, unknown>) => { o.radius = v.radius[i]; o.halfX = v.halfX[i]; o.halfZ = v.halfZ[i]; o.yaw = v.yaw[i]; o.y0 = v.y0[i]; o.y1 = v.y1[i]; o.walk = v.walk[i] !== 0; return o; } });

export interface CritterViews {
  heading: Float32Array;
  /** Seconds until the next change of heading */
  turn: Float32Array;
  speed: Float32Array;
  /** Seconds until it is back (0 = alive) */
  dead: Float32Array;
  /** Seconds until a missed shot thaws (frozen: no wandering or shooting, still hittable) */
  freeze: Float32Array;
  home: Float32Array;
  /** Bot number (1..N); stones carry it as their owner */
  id: Uint32Array;
  score: Int32Array;
  /** The bot holds its stone */
  loaded: Uint8Array;
  /** Seconds until it may shoot */
  aim: Float32Array;
}
export interface CritterValue {
  heading: number;
  /** Seconds until the next change of heading */
  turn: number;
  speed: number;
  /** Seconds until it is back (0 = alive) */
  dead: number;
  /** Seconds until a missed shot thaws (frozen: no wandering or shooting, still hittable) */
  freeze: number;
  home: [number, number, number];
  /** Bot number (1..N); stones carry it as their owner */
  id: number;
  score: number;
  /** The bot holds its stone */
  loaded: boolean;
  /** Seconds until it may shoot */
  aim: number;
}
/** Critter (component, sim) */
export const Critter = typeToken<CritterViews, CritterValue>('Critter', 'component', { sig: 'heading:f32:1,turn:f32:1,speed:f32:1,dead:f32:1,freeze:f32:1,home:vec3:3,id:u32:1,score:i32:1,loaded:bool:1,aim:f32:1', read: (v: CritterViews, i: number, o: Record<string, unknown>) => { o.heading = v.heading[i]; o.turn = v.turn[i]; o.speed = v.speed[i]; o.dead = v.dead[i]; o.freeze = v.freeze[i]; o.home = $r.lanes(v.home, i, 3, o.home); o.id = v.id[i]; o.score = v.score[i]; o.loaded = v.loaded[i] !== 0; o.aim = v.aim[i]; return o; } });

export interface CritterHitViews {
  position: Float32Array;
  /** The seat that scored the hit */
  seat: Uint32Array;
}
export interface CritterHitValue {
  position: [number, number, number];
  /** The seat that scored the hit */
  seat: number;
}
/** CritterHit (event, sim) */
export const CritterHit = typeToken<CritterHitViews, CritterHitValue>('CritterHit', 'event', { sig: 'position:vec3:3,seat:u32:1', read: (v: CritterHitViews, i: number, o: Record<string, unknown>) => { o.position = $r.lanes(v.position, i, 3, o.position); o.seat = v.seat[i]; return o; } });

export interface IceShellViews {
  /** A seat 0..3, or 100 + a bot number */
  owner: Uint32Array;
}
export interface IceShellValue {
  /** A seat 0..3, or 100 + a bot number */
  owner: number;
}
/** IceShell (component, presentation-only) */
export const IceShell = typeToken<IceShellViews, IceShellValue>('IceShell', 'component', { sig: 'owner:u32:1', read: (v: IceShellViews, i: number, o: Record<string, unknown>) => { o.owner = v.owner[i]; return o; } });

export interface LadderViews {
  /** Feet height of the platform at the top */
  top: Float32Array;
  /** Outward direction (x) the climber hangs on */
  nx: Float32Array;
  /** Outward direction (z) */
  nz: Float32Array;
  /** How near a jumping player grabs it */
  reach: Float32Array;
}
export interface LadderValue {
  /** Feet height of the platform at the top */
  top: number;
  /** Outward direction (x) the climber hangs on */
  nx: number;
  /** Outward direction (z) */
  nz: number;
  /** How near a jumping player grabs it */
  reach: number;
}
/** A climbable ladder: jump next to it to grab, W/S climb, Space lets go, the top steps onto the platform. (component, sim) */
export const Ladder = typeToken<LadderViews, LadderValue>('Ladder', 'component', { sig: 'top:f32:1,nx:f32:1,nz:f32:1,reach:f32:1', read: (v: LadderViews, i: number, o: Record<string, unknown>) => { o.top = v.top[i]; o.nx = v.nx[i]; o.nz = v.nz[i]; o.reach = v.reach[i]; return o; } });

export interface LocalHudViews {
  /** The seat this device plays */
  seat: Uint32Array;
  score: Int32Array;
  hits: Uint32Array;
  playerDead: Uint8Array;
  /** Whole seconds until respawn */
  respawnIn: Uint32Array;
  /** Whole seconds until this seat thaws (0 = not frozen) */
  freezeIn: Uint32Array;
  stoneLoaded: Uint8Array;
  /** Whole seconds until the launch jump is ready */
  superCd: Uint32Array;
  deathBy: Uint32Array;
  /** Place among everyone in the round, players and bots (1 = best) */
  rank: Uint32Array;
  /** How many are in the round, players and bots */
  players: Uint32Array;
  /** Leaderboard rows filled (the best, at most 8) */
  rows: Uint32Array;
  row0: Int32Array;
  row1: Int32Array;
  row2: Int32Array;
  row3: Int32Array;
  row4: Int32Array;
  row5: Int32Array;
  row6: Int32Array;
  row7: Int32Array;
}
export interface LocalHudValue {
  /** The seat this device plays */
  seat: number;
  score: number;
  hits: number;
  playerDead: boolean;
  /** Whole seconds until respawn */
  respawnIn: number;
  /** Whole seconds until this seat thaws (0 = not frozen) */
  freezeIn: number;
  stoneLoaded: boolean;
  /** Whole seconds until the launch jump is ready */
  superCd: number;
  deathBy: number;
  /** Place among everyone in the round, players and bots (1 = best) */
  rank: number;
  /** How many are in the round, players and bots */
  players: number;
  /** Leaderboard rows filled (the best, at most 8) */
  rows: number;
  row0: number;
  row1: number;
  row2: number;
  row3: number;
  row4: number;
  row5: number;
  row6: number;
  row7: number;
}
/** LocalHud (resource, presentation-only) */
export const LocalHud = typeToken<LocalHudViews, LocalHudValue>('LocalHud', 'resource', { sig: 'seat:u32:1,score:i32:1,hits:u32:1,playerDead:bool:1,respawnIn:u32:1,freezeIn:u32:1,stoneLoaded:bool:1,superCd:u32:1,deathBy:u32:1,rank:u32:1,players:u32:1,rows:u32:1,row0:i32:1,row1:i32:1,row2:i32:1,row3:i32:1,row4:i32:1,row5:i32:1,row6:i32:1,row7:i32:1', read: (v: LocalHudViews, i: number, o: Record<string, unknown>) => { o.seat = v.seat[i]; o.score = v.score[i]; o.hits = v.hits[i]; o.playerDead = v.playerDead[i] !== 0; o.respawnIn = v.respawnIn[i]; o.freezeIn = v.freezeIn[i]; o.stoneLoaded = v.stoneLoaded[i] !== 0; o.superCd = v.superCd[i]; o.deathBy = v.deathBy[i]; o.rank = v.rank[i]; o.players = v.players[i]; o.rows = v.rows[i]; o.row0 = v.row0[i]; o.row1 = v.row1[i]; o.row2 = v.row2[i]; o.row3 = v.row3[i]; o.row4 = v.row4[i]; o.row5 = v.row5[i]; o.row6 = v.row6[i]; o.row7 = v.row7[i]; return o; } });

export interface MatchViews {
  /** Seconds left in the round */
  timeLeft: Float32Array;
  phase: Uint8Array;
  /** Seconds the results stay up before the next round */
  overTimer: Float32Array;
}
export interface MatchValue {
  /** Seconds left in the round */
  timeLeft: number;
  phase: MatchPhaseName | number;
  /** Seconds the results stay up before the next round */
  overTimer: number;
}
/** Match (resource, sim) */
export const Match = typeToken<MatchViews, MatchValue>('Match', 'resource', { sig: 'timeLeft:f32:1,phase:enum:1,overTimer:f32:1', read: (v: MatchViews, i: number, o: Record<string, unknown>) => { o.timeLeft = v.timeLeft[i]; o.phase = $r.enm('MatchPhase', v.phase[i]!); o.overTimer = v.overTimer[i]; return o; } });

export interface NetLookViews {
  yaw: Float32Array;
  pitch: Float32Array;
  aiming: Uint8Array;
  menuHeld: Uint8Array;
  boardHeld: Uint8Array;
  /** yaw and pitch were taken from the seat once */
  seeded: Uint8Array;
}
export interface NetLookValue {
  yaw: number;
  pitch: number;
  aiming: boolean;
  menuHeld: boolean;
  boardHeld: boolean;
  /** yaw and pitch were taken from the seat once */
  seeded: boolean;
}
/** NetLook (resource, presentation-only) */
export const NetLook = typeToken<NetLookViews, NetLookValue>('NetLook', 'resource', { sig: 'yaw:f32:1,pitch:f32:1,aiming:bool:1,menuHeld:bool:1,boardHeld:bool:1,seeded:bool:1', read: (v: NetLookViews, i: number, o: Record<string, unknown>) => { o.yaw = v.yaw[i]; o.pitch = v.pitch[i]; o.aiming = v.aiming[i] !== 0; o.menuHeld = v.menuHeld[i] !== 0; o.boardHeld = v.boardHeld[i] !== 0; o.seeded = v.seeded[i] !== 0; return o; } });

export interface PlatformViews {
  halfX: Float32Array;
  halfZ: Float32Array;
  top: Float32Array;
}
export interface PlatformValue {
  halfX: number;
  halfZ: number;
  top: number;
}
/** A walkable deck: the player stands on its top inside its footprint. (component, sim) */
export const Platform = typeToken<PlatformViews, PlatformValue>('Platform', 'component', { sig: 'halfX:f32:1,halfZ:f32:1,top:f32:1', read: (v: PlatformViews, i: number, o: Record<string, unknown>) => { o.halfX = v.halfX[i]; o.halfZ = v.halfZ[i]; o.top = v.top[i]; return o; } });

export interface PlayerViews {
  /** Seat 0..3: which PlayerInputs entry drives this player */
  index: Uint32Array;
  yaw: Float32Array;
  pitch: Float32Array;
  /** Points held */
  score: Int32Array;
  hits: Uint32Array;
  misses: Uint32Array;
  deaths: Uint32Array;
  /** Who ended the last life: 0 = the own miss, a bot id, or 1000 + the seat that hit */
  deathBy: Uint32Array;
  /** Vertical speed (m/s) */
  vy: Float32Array;
  /** Horizontal speed, drives the weapon bob */
  speed: Float32Array;
  state: Uint8Array;
  /** Seconds until the player is back */
  respawn: Float32Array;
  /** Seconds until a missed shot thaws: frozen means no moving or firing, and still being hittable */
  freeze: Float32Array;
  /** Spawn protection seconds */
  protect: Float32Array;
  /** The stone is in the sling */
  loaded: Uint8Array;
  aiming: Uint8Array;
  /** The fire button was down last step (edge detection) */
  fireHeld: Uint8Array;
  /** Space was down last step (edge detection) */
  jumpHeld: Uint8Array;
  /** Seconds since the last jump press (double-tap window) */
  sinceJump: Float32Array;
  /** Seconds until the double-jump launch is ready again */
  superCd: Float32Array;
  /** Holding a ladder (W/S climb, Space lets go) */
  climbing: Uint8Array;
  ladderX: Float32Array;
  ladderZ: Float32Array;
  /** Outward direction of the ladder (the side the player hangs on) */
  ladderNx: Float32Array;
  ladderNz: Float32Array;
  /** Feet height at the top of the ladder */
  ladderTop: Float32Array;
  /** Seconds before the player can grab a ladder again */
  ladderCool: Float32Array;
  /** Eye height above the feet (lower while crouching) */
  eye: Float32Array;
  /** Crouch-walking (Shift): slower, lower, harder to spot */
  crouch: Uint8Array;
  /** A player is in this seat (online: set by SeatChanged; an empty seat is hidden and skipped) */
  active: Uint8Array;
}
export interface PlayerValue {
  /** Seat 0..3: which PlayerInputs entry drives this player */
  index: number;
  yaw: number;
  pitch: number;
  /** Points held */
  score: number;
  hits: number;
  misses: number;
  deaths: number;
  /** Who ended the last life: 0 = the own miss, a bot id, or 1000 + the seat that hit */
  deathBy: number;
  /** Vertical speed (m/s) */
  vy: number;
  /** Horizontal speed, drives the weapon bob */
  speed: number;
  state: PlayerStateName | number;
  /** Seconds until the player is back */
  respawn: number;
  /** Seconds until a missed shot thaws: frozen means no moving or firing, and still being hittable */
  freeze: number;
  /** Spawn protection seconds */
  protect: number;
  /** The stone is in the sling */
  loaded: boolean;
  aiming: boolean;
  /** The fire button was down last step (edge detection) */
  fireHeld: boolean;
  /** Space was down last step (edge detection) */
  jumpHeld: boolean;
  /** Seconds since the last jump press (double-tap window) */
  sinceJump: number;
  /** Seconds until the double-jump launch is ready again */
  superCd: number;
  /** Holding a ladder (W/S climb, Space lets go) */
  climbing: boolean;
  ladderX: number;
  ladderZ: number;
  /** Outward direction of the ladder (the side the player hangs on) */
  ladderNx: number;
  ladderNz: number;
  /** Feet height at the top of the ladder */
  ladderTop: number;
  /** Seconds before the player can grab a ladder again */
  ladderCool: number;
  /** Eye height above the feet (lower while crouching) */
  eye: number;
  /** Crouch-walking (Shift): slower, lower, harder to spot */
  crouch: boolean;
  /** A player is in this seat (online: set by SeatChanged; an empty seat is hidden and skipped) */
  active: boolean;
}
/** Player (component, sim) */
export const Player = typeToken<PlayerViews, PlayerValue>('Player', 'component', { sig: 'index:u32:1,yaw:f32:1,pitch:f32:1,score:i32:1,hits:u32:1,misses:u32:1,deaths:u32:1,deathBy:u32:1,vy:f32:1,speed:f32:1,state:enum:1,respawn:f32:1,freeze:f32:1,protect:f32:1,loaded:bool:1,aiming:bool:1,fireHeld:bool:1,jumpHeld:bool:1,sinceJump:f32:1,superCd:f32:1,climbing:bool:1,ladderX:f32:1,ladderZ:f32:1,ladderNx:f32:1,ladderNz:f32:1,ladderTop:f32:1,ladderCool:f32:1,eye:f32:1,crouch:bool:1,active:bool:1', read: (v: PlayerViews, i: number, o: Record<string, unknown>) => { o.index = v.index[i]; o.yaw = v.yaw[i]; o.pitch = v.pitch[i]; o.score = v.score[i]; o.hits = v.hits[i]; o.misses = v.misses[i]; o.deaths = v.deaths[i]; o.deathBy = v.deathBy[i]; o.vy = v.vy[i]; o.speed = v.speed[i]; o.state = $r.enm('PlayerState', v.state[i]!); o.respawn = v.respawn[i]; o.freeze = v.freeze[i]; o.protect = v.protect[i]; o.loaded = v.loaded[i] !== 0; o.aiming = v.aiming[i] !== 0; o.fireHeld = v.fireHeld[i] !== 0; o.jumpHeld = v.jumpHeld[i] !== 0; o.sinceJump = v.sinceJump[i]; o.superCd = v.superCd[i]; o.climbing = v.climbing[i] !== 0; o.ladderX = v.ladderX[i]; o.ladderZ = v.ladderZ[i]; o.ladderNx = v.ladderNx[i]; o.ladderNz = v.ladderNz[i]; o.ladderTop = v.ladderTop[i]; o.ladderCool = v.ladderCool[i]; o.eye = v.eye[i]; o.crouch = v.crouch[i] !== 0; o.active = v.active[i] !== 0; return o; } });

export interface PlayerHitViews {
  by: Uint32Array;
  /** The seat that was hit */
  seat: Uint32Array;
}
export interface PlayerHitValue {
  by: number;
  /** The seat that was hit */
  seat: number;
}
/** PlayerHit (event, sim) */
export const PlayerHit = typeToken<PlayerHitViews, PlayerHitValue>('PlayerHit', 'event', { sig: 'by:u32:1,seat:u32:1', read: (v: PlayerHitViews, i: number, o: Record<string, unknown>) => { o.by = v.by[i]; o.seat = v.seat[i]; return o; } });

export interface PlayerRespawnedViews {
  seat: Uint32Array;
}
export interface PlayerRespawnedValue {
  seat: number;
}
/** PlayerRespawned (event, sim) */
export const PlayerRespawned = typeToken<PlayerRespawnedViews, PlayerRespawnedValue>('PlayerRespawned', 'event', { sig: 'seat:u32:1', read: (v: PlayerRespawnedViews, i: number, o: Record<string, unknown>) => { o.seat = v.seat[i]; return o; } });

export interface SeatBodyViews {
  /** Seat it shows */
  index: Uint32Array;
}
export interface SeatBodyValue {
  /** Seat it shows */
  index: number;
}
/** SeatBody (component, sim) */
export const SeatBody = typeToken<SeatBodyViews, SeatBodyValue>('SeatBody', 'component', { sig: 'index:u32:1', read: (v: SeatBodyViews, i: number, o: Record<string, unknown>) => { o.index = v.index[i]; return o; } });

export interface SeatCamViews {
  seat: Uint32Array;
}
export interface SeatCamValue {
  seat: number;
}
/** SeatCam (component, presentation-only) */
export const SeatCam = typeToken<SeatCamViews, SeatCamValue>('SeatCam', 'component', { sig: 'seat:u32:1', read: (v: SeatCamViews, i: number, o: Record<string, unknown>) => { o.seat = v.seat[i]; return o; } });

export interface SeatChangedViews {
  seat: Uint32Array;
  present: Uint8Array;
  fresh: Uint8Array;
}
export interface SeatChangedValue {
  seat: number;
  present: boolean;
  fresh: boolean;
}
/** SeatChanged (event, sim) */
export const SeatChanged = typeToken<SeatChangedViews, SeatChangedValue>('SeatChanged', 'event', { sig: 'seat:u32:1,present:bool:1,fresh:bool:1', read: (v: SeatChangedViews, i: number, o: Record<string, unknown>) => { o.seat = v.seat[i]; o.present = v.present[i] !== 0; o.fresh = v.fresh[i] !== 0; return o; } });

export interface ShotFiredViews {
  position: Float32Array;
  direction: Float32Array;
  seat: Uint32Array;
}
export interface ShotFiredValue {
  position: [number, number, number];
  direction: [number, number, number];
  seat: number;
}
/** ShotFired (event, sim) */
export const ShotFired = typeToken<ShotFiredViews, ShotFiredValue>('ShotFired', 'event', { sig: 'position:vec3:3,direction:vec3:3,seat:u32:1', read: (v: ShotFiredViews, i: number, o: Record<string, unknown>) => { o.position = $r.lanes(v.position, i, 3, o.position); o.direction = $r.lanes(v.direction, i, 3, o.direction); o.seat = v.seat[i]; return o; } });

export interface SolidViews {
  radius: Float32Array;
  /** Top of the obstacle, metres */
  height: Float32Array;
  /** Its top can be stood on, and a jump clears it: crates, rocks, barrels */
  walk: Uint8Array;
}
export interface SolidValue {
  radius: number;
  /** Top of the obstacle, metres */
  height: number;
  /** Its top can be stood on, and a jump clears it: crates, rocks, barrels */
  walk: boolean;
}
/** A vertical cylinder players, critters and stones cannot pass. (component, sim) */
export const Solid = typeToken<SolidViews, SolidValue>('Solid', 'component', { sig: 'radius:f32:1,height:f32:1,walk:bool:1', read: (v: SolidViews, i: number, o: Record<string, unknown>) => { o.radius = v.radius[i]; o.height = v.height[i]; o.walk = v.walk[i] !== 0; return o; } });

export interface SoloLookViews {
  yaw: Float32Array;
  pitch: Float32Array;
  lookX: Float32Array;
  lookY: Float32Array;
  hasLook: Uint8Array;
  aiming: Uint8Array;
  /** The left button is down */
  fireHeld: Uint8Array;
}
export interface SoloLookValue {
  yaw: number;
  pitch: number;
  lookX: number;
  lookY: number;
  hasLook: boolean;
  aiming: boolean;
  /** The left button is down */
  fireHeld: boolean;
}
/** SoloLook (resource, sim) */
export const SoloLook = typeToken<SoloLookViews, SoloLookValue>('SoloLook', 'resource', { sig: 'yaw:f32:1,pitch:f32:1,lookX:f32:1,lookY:f32:1,hasLook:bool:1,aiming:bool:1,fireHeld:bool:1', read: (v: SoloLookViews, i: number, o: Record<string, unknown>) => { o.yaw = v.yaw[i]; o.pitch = v.pitch[i]; o.lookX = v.lookX[i]; o.lookY = v.lookY[i]; o.hasLook = v.hasLook[i] !== 0; o.aiming = v.aiming[i] !== 0; o.fireHeld = v.fireHeld[i] !== 0; return o; } });

export type SpawnPointViews = Record<string, never>;
export type SpawnPointValue = Record<string, never>;
/** SpawnPoint (component, sim) */
export const SpawnPoint = typeToken<SpawnPointViews, SpawnPointValue>('SpawnPoint', 'component');

export interface StoneViews {
  velocity: Float32Array;
  /** Seconds in flight */
  life: Float32Array;
  /** Metres flown */
  travelled: Float32Array;
  /** Who shot it: a bot id, or 1000 + the seat of a player */
  owner: Uint32Array;
}
export interface StoneValue {
  velocity: [number, number, number];
  /** Seconds in flight */
  life: number;
  /** Metres flown */
  travelled: number;
  /** Who shot it: a bot id, or 1000 + the seat of a player */
  owner: number;
}
/** Stone (component, sim) */
export const Stone = typeToken<StoneViews, StoneValue>('Stone', 'component', { sig: 'velocity:vec3:3,life:f32:1,travelled:f32:1,owner:u32:1', read: (v: StoneViews, i: number, o: Record<string, unknown>) => { o.velocity = $r.lanes(v.velocity, i, 3, o.velocity); o.life = v.life[i]; o.travelled = v.travelled[i]; o.owner = v.owner[i]; return o; } });

export interface StoneMissedViews {
  position: Float32Array;
  /** The seat that missed (bots: 99) */
  seat: Uint32Array;
}
export interface StoneMissedValue {
  position: [number, number, number];
  /** The seat that missed (bots: 99) */
  seat: number;
}
/** StoneMissed (event, sim) */
export const StoneMissed = typeToken<StoneMissedViews, StoneMissedValue>('StoneMissed', 'event', { sig: 'position:vec3:3,seat:u32:1', read: (v: StoneMissedViews, i: number, o: Record<string, unknown>) => { o.position = $r.lanes(v.position, i, 3, o.position); o.seat = v.seat[i]; return o; } });

export interface TempViews {
  /** Seconds until the entity is removed */
  life: Float32Array;
}
export interface TempValue {
  /** Seconds until the entity is removed */
  life: number;
}
/** Temp (component, sim) */
export const Temp = typeToken<TempViews, TempValue>('Temp', 'component', { sig: 'life:f32:1', read: (v: TempViews, i: number, o: Record<string, unknown>) => { o.life = v.life[i]; return o; } });

export interface ViewmodelViews {
  part: Uint8Array;
  /** Seat whose rig this belongs to */
  seat: Uint32Array;
}
export interface ViewmodelValue {
  part: ViewPartName | number;
  /** Seat whose rig this belongs to */
  seat: number;
}
/** A first-person weapon part the presentation animates (recoil, bob, loaded stone). (component, presentation-only) */
export const Viewmodel = typeToken<ViewmodelViews, ViewmodelValue>('Viewmodel', 'component', { sig: 'part:enum:1,seat:u32:1', read: (v: ViewmodelViews, i: number, o: Record<string, unknown>) => { o.part = $r.enm('ViewPart', v.part[i]!); o.seat = v.seat[i]; return o; } });

export interface AirReadyViews {
  seat: Uint32Array;
}
export interface AirReadyValue {
  seat: number;
}
/** AirReady (event, sim) */
export const AirReady = typeToken<AirReadyViews, AirReadyValue>('AirReady', 'event', { sig: 'seat:u32:1', read: (v: AirReadyViews, i: number, o: Record<string, unknown>) => { o.seat = v.seat[i]; return o; } });

export interface FxHostViews {
  /** Which effect this host plays (see src/vfx.ts) */
  kind: Uint32Array;
}
export interface FxHostValue {
  /** Which effect this host plays (see src/vfx.ts) */
  kind: string;
}
/** FxHost (component, sim) */
export const FxHost = typeToken<FxHostViews, FxHostValue>('FxHost', 'component', { sig: 'kind:string:1', read: (v: FxHostViews, i: number, o: Record<string, unknown>) => { o.kind = $r.str(v.kind[i]!); return o; } });

export interface FxStateViews {
  /** Last sim step looked at */
  step: Uint32Array;
  prevVy: Float32Array;
  /** Fastest fall since leaving the ground */
  minVy: Float32Array;
  grounded: Uint8Array;
  /** Metres walked since the last footstep puff */
  stride: Float32Array;
  /** Which foot comes next */
  foot: Uint8Array;
  /** Step until which the double-jump trail is drawn */
  trailUntil: Uint32Array;
  /** Last sim step the stone tracer was laid for */
  tracerStep: Uint32Array;
  /** Where the stone was last seen (the tracer runs on to the impact) */
  lastStone: Float32Array;
  hasStone: Uint8Array;
}
export interface FxStateValue {
  /** Last sim step looked at */
  step: number;
  prevVy: number;
  /** Fastest fall since leaving the ground */
  minVy: number;
  grounded: boolean;
  /** Metres walked since the last footstep puff */
  stride: number;
  /** Which foot comes next */
  foot: boolean;
  /** Step until which the double-jump trail is drawn */
  trailUntil: number;
  /** Last sim step the stone tracer was laid for */
  tracerStep: number;
  /** Where the stone was last seen (the tracer runs on to the impact) */
  lastStone: [number, number, number];
  hasStone: boolean;
}
/** FxState (resource, presentation-only) */
export const FxState = typeToken<FxStateViews, FxStateValue>('FxState', 'resource', { sig: 'step:u32:1,prevVy:f32:1,minVy:f32:1,grounded:bool:1,stride:f32:1,foot:bool:1,trailUntil:u32:1,tracerStep:u32:1,lastStone:vec3:3,hasStone:bool:1', read: (v: FxStateViews, i: number, o: Record<string, unknown>) => { o.step = v.step[i]; o.prevVy = v.prevVy[i]; o.minVy = v.minVy[i]; o.grounded = v.grounded[i] !== 0; o.stride = v.stride[i]; o.foot = v.foot[i] !== 0; o.trailUntil = v.trailUntil[i]; o.tracerStep = v.tracerStep[i]; o.lastStone = $r.lanes(v.lastStone, i, 3, o.lastStone); o.hasStone = v.hasStone[i] !== 0; return o; } });
