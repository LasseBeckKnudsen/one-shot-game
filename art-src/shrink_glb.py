"""Shrinks the textures embedded in assets/models/*.glb (the cook keeps every embedded image at its size: the 1 MB wood and
stone textures were repeated in every prop and the Meshy ones were 2048 px), keeping the originals in art-src/glb_full/.
usage: PYTHONSAFEPATH=1 python3 art-src/shrink_glb.py   (idempotent: always shrinks from the full-size originals)"""
import io, json, os, shutil, struct, glob
from PIL import Image

MODELS, FULL = 'assets/models', 'art-src/glb_full'
# max edge in px per model; anything not listed gets DEFAULT. Props are small on screen, Meshy hero models keep 1024.
DEFAULT = 512
BIG = {'tree_a': 1024, 'tree_b': 1024, 'tree_c': 1024, 'hut_meshy': 1024, 'treehouse': 1024, 'guy_rig': 1024, 'viewmodel_rig': 1024, 'tower': 1024, 'cloud_card': 768}


def shrink(src, dst, edge):
    b = open(src, 'rb').read()
    n = struct.unpack('<I', b[12:16])[0]
    j = json.loads(b[20:20 + n])
    binoff = 20 + n + 8
    binlen = struct.unpack('<I', b[binoff - 8:binoff - 4])[0]
    bin_ = b[binoff:binoff + binlen]
    views = j['bufferViews']
    new = {}
    for im in j.get('images', []):
        bv = views[im['bufferView']]
        raw = bin_[bv.get('byteOffset', 0):bv.get('byteOffset', 0) + bv['byteLength']]
        img = Image.open(io.BytesIO(raw))
        if max(img.size) <= edge:
            continue
        s = edge / max(img.size)
        img = img.resize((max(1, round(img.width * s)), max(1, round(img.height * s))), Image.LANCZOS)
        out = io.BytesIO()
        if img.mode == 'RGBA':
            img.save(out, 'PNG', optimize=True)
            im['mimeType'] = 'image/png'
        else:
            img.convert('RGB').save(out, 'JPEG', quality=88)
            im['mimeType'] = 'image/jpeg'
        new[im['bufferView']] = out.getvalue()
    if not new:
        shutil.copy(src, dst)
        return
    chunks, off = [], 0
    for i, bv in enumerate(views):
        data = new[i] if i in new else bin_[bv.get('byteOffset', 0):bv.get('byteOffset', 0) + bv['byteLength']]
        pad = (-len(data)) % 4
        bv['byteOffset'], bv['byteLength'] = off, len(data)
        chunks.append(data + b'\0' * pad)
        off += len(data) + pad
    j['buffers'][0]['byteLength'] = off
    jb = json.dumps(j, separators=(',', ':')).encode()
    jb += b' ' * ((-len(jb)) % 4)
    nb = b''.join(chunks)
    total = 12 + 8 + len(jb) + 8 + len(nb)
    with open(dst, 'wb') as f:
        f.write(struct.pack('<4sII', b'glTF', 2, total) + struct.pack('<I4s', len(jb), b'JSON') + jb + struct.pack('<I4s', len(nb), b'BIN\0') + nb)


os.makedirs(FULL, exist_ok=True)
before = after = 0
for p in sorted(glob.glob(f'{MODELS}/*.glb')):
    name = os.path.basename(p)[:-4]
    full = f'{FULL}/{name}.glb'
    if not os.path.exists(full):
        shutil.copy(p, full)
    before += os.path.getsize(full)
    shrink(full, p, BIG.get(name, DEFAULT))
    after += os.path.getsize(p)
print(f'models {before // 1024} KB -> {after // 1024} KB')
