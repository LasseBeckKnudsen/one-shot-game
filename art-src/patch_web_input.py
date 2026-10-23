"""TEMPORARY: patches the minified web player (build/web/site/player.js) for two engine bugs until the engine fix is released.
1. `setPointerCapture` throws InvalidStateError on a real mouse once the pointer lock is in play, which aborted the press (no clicks at all).
2. A mouse button pressed while another is held (fire while zooming) raises only `pointermove`, never `pointerdown`: the changed buttons are sent as presses and releases.
Usage: python3 art-src/patch_web_input.py build/web/site/player.js   (idempotent; refuses a player it does not recognise)"""
import re, sys

p = sys.argv[1]
s = open(p).read()
if 'PB=0;let g=' in s:
    print('already patched')
    sys.exit(0)
m = re.search(r'([A-Za-z_$][\w$]*)\.setPointerCapture\(([A-Za-z_$][\w$]*)\.pointerId\)', s)
assert m and s.count('setPointerCapture') == 1, 'setPointerCapture call not found'
s = s.replace(m.group(0), '(()=>{try{' + m.group(0) + '}catch{}})()', 1)
send = 'c([1,D??0,w,O,C,Math.max(0,i.button),null,0,0]),w>=2&&a.delete(i.pointerId),i.preventDefault()}'
assert s.count(send) == 1, 'pointer send not found'
chord = ('(()=>{if(i.pointerType==="mouse"){let nb=i.buttons;if(w===1&&nb!==PB)for(const[bit,btn]of[[1,0],[2,2],[4,1]]){'
         'if((nb&bit)&&!(PB&bit))c([1,D??0,0,O,C,btn,null,0,0]);else if(!(nb&bit)&&(PB&bit))c([1,D??0,2,O,C,btn,null,0,0])}PB=w>=2?0:nb}})(),')
s = s.replace(send, chord + send, 1)
assert s.count('let g=(i,w)=>{') == 1
s = s.replace('let g=(i,w)=>{', 'let PB=0;let g=(i,w)=>{', 1)
open(p, 'w').write(s)
print('patched', p)
