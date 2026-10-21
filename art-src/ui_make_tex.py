"""Draws the OneShot UI textures (panels, pills, buttons, slider parts, glyphs, gradients) into assets/ui/.
usage: python3 art-src/ui_make_tex.py   (also writes the .gmeta 9-slice borders; see art-src/ui-style.md)"""
import math, os, uuid
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SS = 4
OUT = 'assets/ui'
os.makedirs(OUT, exist_ok=True)
CREAM = (255, 243, 214)
BARK = (46, 27, 14)


def rr(size, box, r, fill, img=None):
    """Rounded rect on an RGBA supersampled canvas."""
    if img is None:
        img = Image.new('RGBA', (size[0] * SS, size[1] * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([box[0] * SS, box[1] * SS, box[2] * SS - 1, box[3] * SS - 1], r * SS, fill=fill)
    return img


def mask_rr(size, box, r):
    m = Image.new('L', (size[0] * SS, size[1] * SS), 0)
    ImageDraw.Draw(m).rounded_rectangle([box[0] * SS, box[1] * SS, box[2] * SS - 1, box[3] * SS - 1], r * SS, fill=255)
    return m


def finish(img, size, name, meta=None):
    img = img.resize(size, Image.LANCZOS)
    img.save(f'{OUT}/{name}.png', optimize=True)
    if meta is not None:
        write_meta(name, meta)
    print(name, size)


def write_meta(name, meta):
    path = f'{OUT}/{name}.png.gmeta'
    guid, importer = None, 'texture'
    if os.path.exists(path):
        for line in open(path):
            if line.startswith('guid'):
                guid = line.split('=')[1].strip().strip('"')
    lines = []
    guid = guid or str(uuid.uuid4())
    lines.append(f'guid = "{guid}"')
    lines.append(f'importer = "{importer}"')
    lines.append('')
    lines.append('[settings]')
    lines += meta
    open(path, 'w').write('\n'.join(lines) + '\n')


def border(t, r, b, l):
    return f'border = {{ top = {t}, right = {r}, bottom = {b}, left = {l} }}'


def body(**kw):
    return 'body = { ' + ', '.join(f'{k} = {v}' for k, v in kw.items()) + ' }'


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(len(a)))


def solid(img_size, fill_mask, color):
    layer = Image.new('RGBA', (img_size[0] * SS, img_size[1] * SS), color if len(color) == 4 else color + (255,))
    layer.putalpha(Image.eval(fill_mask, lambda v: v) if len(color) == 3 else fill_mask.point(lambda v: v * color[3] // 255))
    return layer


def box_shape(name, w, h, r, ow, outline, fill_top, fill_bot, shadow, lip=0, lip_col=None, gloss=True, alpha=255, meta_extra=None):
    """A chunky 'toy' box: soft shadow below, outline, vertical fill gradient, optional darker lip and a top gloss.
    The image is w x (h + shadow); the box (body) is the top h rows."""
    size = (w, h + shadow)
    canvas = Image.new('RGBA', (size[0] * SS, size[1] * SS), (0, 0, 0, 0))
    if shadow:
        sh = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
        m = mask_rr(size, (1, shadow, w - 1, h + shadow), r)
        sh.paste((24, 10, 2, 120), mask=m)
        sh = sh.filter(ImageFilter.GaussianBlur(SS * 1.2))
        canvas.alpha_composite(sh)
    outer = mask_rr(size, (0, 0, w, h), r)
    if ow:
        canvas.paste(outline + (255,), mask=outer)
    inner_box = (ow, ow, w - ow, h - ow)
    inner = mask_rr(size, inner_box, max(r - ow, 1))
    # vertical gradient fill
    grad = np.zeros((size[1] * SS, size[0] * SS, 4), np.uint8)
    for y in range(size[1] * SS):
        t = min(max((y / SS - ow) / max(h - 2 * ow, 1), 0), 1)
        grad[y, :, :3] = lerp(fill_top, fill_bot, t)
        grad[y, :, 3] = alpha
    gl = Image.fromarray(grad)
    gl.putalpha(Image.eval(inner, lambda v: v * alpha // 255))
    canvas.alpha_composite(gl)
    if lip:
        # darker band along the bottom of the face: the face is the inner shape pushed up by `lip`
        face = mask_rr(size, (ow, ow, w - ow, h - ow - lip), max(r - ow, 1))
        lipmask = Image.fromarray(np.minimum(np.asarray(inner), 255 - np.asarray(face)))
        lay = Image.new('RGBA', canvas.size, lip_col + (255,))
        lay.putalpha(lipmask)
        canvas.alpha_composite(lay)
    if gloss:
        gh = max(int(h * 0.33), 4)
        g = mask_rr(size, (ow + r * 0.28, ow + 2, w - ow - r * 0.28, ow + 2 + gh), gh // 2)
        lay = Image.new('RGBA', canvas.size, (255, 255, 255, 255))
        lay.putalpha(g.point(lambda v: v * 46 // 255))
        canvas.alpha_composite(lay)
    return canvas, size


def box(name, w, h, r, ow, outline, top, bot, shadow, **kw):
    meta_b = kw.pop('border_px', r)
    content = kw.pop('content', None)
    canvas, size = box_shape(name, w, h, r, ow, outline, top, bot, shadow, **kw)
    meta = [border(meta_b, meta_b, meta_b + shadow, meta_b)]
    if shadow:
        meta.append(body(bottom=shadow))
    if content:
        meta.append('content = { top = %d, right = %d, bottom = %d, left = %d }' % content)
    finish(canvas, size, name, meta)


def glyph(name, draw_fn, px=128):
    img = Image.new('RGBA', (px * SS, px * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    draw_fn(d, px * SS)
    finish(img, (px, px), name, ['atlas = "none"'] if False else [])


# ---- panels and pills -------------------------------------------------------------------------
box('panel', 128, 128, 44, 6, CREAM, (58, 36, 20), (40, 24, 12), 10, alpha=244, gloss=False, border_px=48)
box('pill', 96, 88, 32, 5, CREAM, (58, 36, 20), (40, 24, 12), 8, alpha=240, gloss=False)
box('chip', 48, 36, 12, 3, BARK, (255, 246, 222), (255, 232, 186), 3, gloss=False)

# ---- buttons: cream outline, bright face, darker lip, gloss, soft shadow -------------------------
for name, top, bot, lip in (
    ('btn_green', (150, 226, 96), (92, 188, 62), (46, 128, 40)),
    ('btn_amber', (255, 206, 92), (255, 160, 40), (196, 100, 14)),
    ('btn_red', (255, 130, 110), (234, 84, 72), (164, 44, 40)),
    ('btn_wood', (214, 160, 98), (184, 126, 66), (116, 72, 34)),
):
    box(name, 160, 104, 46, 5, CREAM, top, bot, 10, lip=12, lip_col=lip, border_px=50, content=(0, 36, 12, 36))

# ---- slider -----------------------------------------------------------------------------------
box('slider_track', 72, 56, 24, 3, CREAM, (30, 18, 9), (44, 27, 14), 0, gloss=False, border_px=24)
box('slider_fill', 72, 56, 24, 0, (0, 0, 0), (150, 226, 96), (92, 188, 62), 0, lip=9, lip_col=(46, 128, 40), border_px=24)

# ---- round things -------------------------------------------------------------------------------
def disc(name, px, ow=0, fill=(255, 255, 255), outline=CREAM, glossy=False):
    img = Image.new('RGBA', (px * SS, px * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if ow:
        d.ellipse([0, 0, px * SS - 1, px * SS - 1], fill=outline + (255,))
    d.ellipse([ow * SS, ow * SS, (px - ow) * SS - 1, (px - ow) * SS - 1], fill=fill + (255,))
    if glossy:
        d.ellipse([px * 0.22 * SS, px * 0.14 * SS, px * 0.52 * SS, px * 0.34 * SS], fill=(255, 255, 255, 120))
    finish(img, (px, px), name)

disc('disc', 128)
disc('knob', 96, 7, (255, 190, 60), CREAM, glossy=True)

def ring(name, px, thick):
    img = Image.new('RGBA', (px * SS, px * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse([0, 0, px * SS - 1, px * SS - 1], fill=(255, 255, 255, 255))
    d.ellipse([thick * SS, thick * SS, (px - thick) * SS - 1, (px - thick) * SS - 1], fill=(0, 0, 0, 0))
    # the hole must be transparent: cut it out of alpha
    a = np.asarray(img).copy()
    yy, xx = np.mgrid[0:px * SS, 0:px * SS]
    c = px * SS / 2
    dist = np.hypot(xx + 0.5 - c, yy + 0.5 - c)
    a[..., 3] = np.where((dist <= c) & (dist >= (px / 2 - thick) * SS), 255, 0)
    finish(Image.fromarray(a), (px, px), name)

ring('ring', 256, 30)

# the stone: warm grey pebble with a cream rim and a highlight
def stone(d, s):
    d.ellipse([s * 0.06, s * 0.12, s * 0.94, s * 0.9], fill=CREAM + (255,))
    d.ellipse([s * 0.13, s * 0.19, s * 0.87, s * 0.83], fill=(150, 142, 132, 255))
    d.ellipse([s * 0.13, s * 0.19, s * 0.87, s * 0.83], outline=(96, 90, 82, 255), width=int(s * 0.03))
    d.ellipse([s * 0.26, s * 0.27, s * 0.5, s * 0.42], fill=(222, 216, 206, 255))
glyph('stone', stone)

# white glyphs, tinted by the document
def star(d, s):
    cx, cy, R, r = s / 2, s * 0.53, s * 0.45, s * 0.2
    pts = []
    for i in range(10):
        a = -math.pi / 2 + i * math.pi / 5
        rad = R if i % 2 == 0 else r
        pts.append((cx + rad * math.cos(a), cy + rad * math.sin(a)))
    d.polygon(pts, fill=(255, 255, 255, 255))
    # round the tips: draw circles on them and a fat outline
    d.line(pts + [pts[0]], fill=(255, 255, 255, 255), width=int(s * 0.07), joint='curve')
    for p in pts[::2]:
        d.ellipse([p[0] - s * 0.035, p[1] - s * 0.035, p[0] + s * 0.035, p[1] + s * 0.035], fill=(255, 255, 255, 255))
glyph('star', star)

def chevrons(d, s):
    w = int(s * 0.13)
    for k, y in enumerate((0.58, 0.28)):
        pts = [(s * 0.2, s * (y + 0.2)), (s * 0.5, s * y), (s * 0.8, s * (y + 0.2))]
        d.line(pts, fill=(255, 255, 255, 255), width=w, joint='curve')
        for p in (pts[0], pts[2]):
            d.ellipse([p[0] - w / 2, p[1] - w / 2, p[0] + w / 2, p[1] + w / 2], fill=(255, 255, 255, 255))
glyph('chevrons', chevrons)

# ---- gradients (stretched to the screen) ---------------------------------------------------------
def gradient(name, w, h, fn):
    yy, xx = np.mgrid[0:h, 0:w]
    a = np.clip(fn((xx + 0.5) / w, (yy + 0.5) / h), 0, 1)
    rgba = np.zeros((h, w, 4), np.uint8)
    rgba[..., :3] = (22, 10, 4)
    rgba[..., 3] = (a * 255).astype(np.uint8)
    Image.fromarray(rgba).save(f'{OUT}/{name}.png', optimize=True)
    print(name, (w, h))

gradient('shade_left', 256, 8, lambda x, y: 0.82 * np.clip(1 - x * 1.25, 0, 1) ** 1.3)
gradient('vignette', 256, 144, lambda x, y: 0.62 * np.clip((np.hypot((x - .5) * 1.5, (y - .5) * 1.1) - 0.28) / 0.6, 0, 1) ** 1.6)
gradient('shade_flat', 8, 8, lambda x, y: 0 * x + 0.55)

# ---- gmeta for the non-sliced ones: nothing special; keep sidecars with a guid
for n in ('disc', 'knob', 'ring', 'stone', 'star', 'chevrons', 'shade_left', 'vignette', 'shade_flat', 'logo'):
    path = f'{OUT}/{n}.png.gmeta'
    if not os.path.exists(path) or 'guid' not in open(path).read():
        write_meta(n, [])
