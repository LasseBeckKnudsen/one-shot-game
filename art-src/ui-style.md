# OneShot UI style

Direction (picked from the Create Art concept round, "dark warm glass pills with a cream outline, amber highlights"):
**chunky toy-like, golden-hour treehouse.** Dark warm-brown panels with a thick cream outline read clearly over the bright
world; the bright, glossy coloured buttons are the only things that shout. Logo, acorns and the amber stone carry the charm,
the wood/leaf motif stays a hint (one leaf, plank colours), never texture.

Everything is drawn by `art-src/ui_make_tex.py` (panels, pills, buttons, glyphs, gradients) and `art-src/ui_logo.py`
(Create Art logo, keyed from magenta). Re-run them after changing a value here.

## Palette

| Role | Hex | Use |
|---|---|---|
| Bark (panel fill) | `#3A2414` -> `#28180C` | every panel and pill, 95% opaque |
| Bark dark | `#2A1708` | text outlines, key-cap text, strokes |
| Cream | `#FFF3D6` | all outlines, primary text, reticle |
| Honey | `#FFB52E` | accents, numbers, focus glow, clock |
| Amber glow | `#FFD866` | highlights, READY pulse |
| Leaf green | `#6FC04A` (face `#96E260` -> `#5CBC3E`, lip `#2E8028`) | positive: +1, JOIN, LOADED, Resume |
| Orange | `#FF9A3D` | warning: miss (-1), RELOADING |
| Red | `#EA5448` (lip `#A42C28`) | danger: get hit, last minute, Quit |
| Gold | `#FFD23F` | winning, star |
| Sky | `#8EC9F2` | rare cool accent (none needed yet) |
| Muted cream | `#D9C7A0` | secondary text on bark (contrast 9:1) |

Text on bark is always cream or an accent from this table; never grey. Over the 3D world text gets a hard dark drop shadow
(`shadowY` 3-7 px, `#2A1708`, no blur); the engine's text outline renders hairline thin, so it is not used.

## Shapes

- Corner radii (reference px at 1920x1080): panel 44, button 46, pill 36 (full round at 72 px high), chip 28, slider 20.
- Outline: cream, 6 px on panels, 5 px on pills and buttons, 4 px on chips (bark outline on the light chip), 3 px on slider track.
- Shadow: a soft 8-10 px shadow baked into the texture below the shape (the texture `.gmeta` `body` keeps it out of layout).
- Buttons have a darker 12 px "lip" at the bottom and a faint gloss strip on top: they look pressable.
- Textures are 9-sliced via their `.gmeta`: `panel`, `pill`, `chip`, `btn_*`, `slider_*`, `row` (white, tinted by the document).
- Round glyphs and discs (`disc`, `ring`, `star`, `chevrons`) are white and tinted by `color`.

## Typography (Fredoka, project default)

| Use | Size | Weight |
|---|---|---|
| Logo-adjacent display / banners | 72-96 | 900 |
| Screen titles | 56 | 800 |
| Buttons | 44 (36 small) | 800 |
| HUD numbers | 44-48 | 800 |
| Body / rules | 30-34 | 700 |
| Captions, hints | 22-24 | 700 |

Minimum text size is 20 px. Numbers use the same weight as the label next to them. Padding is generous: pills 10 28, panels 32+.

## Spacing scale

4, 8, 12, 16, 24, 32, 48, 64. HUD margin from the safe area: 32 (top and sides), 40 (bottom).

## Icons

Own-colour sprites: acorn (score), clock, stone. White glyphs tinted by the document: star (win), chevrons (launch),
ring and disc (cooldown, reticle). Badges are a coloured round `disc` with a bold number or sign inside.
One icon per idea; never decorative icons.

## Buttons

States: normal, pressed (scale 0.95, 3 px down, 12% darker, 100 ms ease-out), disabled (desaturated, 60% opacity).
There is no hover state in the engine's documents, so buttons stay readable and attractive at rest.
Tones: green = go (Join, Resume), amber = secondary action (Play solo), red = leave (Quit), wood = neutral.

## Motion

- Idle UI is still. The HUD never loops: the READY state is a static gold chevron ring plus one elastic pulse when the
  launch becomes ready, a banner pops once, a score gain bounces the score pill once.
- Pop-ins: `back 240 1.4` for panels, `elastic 420 1.2 0.3` for value bounces (score up, banner).
- Presses 100-150 ms, poses 200-350 ms, screen fades 250-400 ms.
- Loading screen: only cheap motion (3 bouncing acorns, a filling bar, a tip crossfade every 3.5 s).
- Reduced motion is honoured by the engine.

## Screens

- **Start:** full-bleed screenshot of the village + left shade gradient + vignette. Left column: logo, two buttons.
  Right: colour-coded rules panel. Footer: version.
- **Loading:** same still, dimmer; logo, bouncing acorns, progress bar, a rotating tip.
- **HUD:** top-left score pill + "Lose N if hit" chip, top-right clock pill, centre dot reticle only, bottom-centre stone pill
  (LOADED green / RELOADING orange), bottom-left launch ring with `Space x2` key cap, centre banners, controls hint for 20 s.
- **Pause:** engine scrim, one bark panel: Resume (green), sliders (sensitivity, master, music, SFX), Quit (red).
