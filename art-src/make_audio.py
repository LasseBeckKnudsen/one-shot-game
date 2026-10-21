"""Procedural SFX and a ukulele-ish loop -> assets/audio/*.wav (mono SFX, stereo music). usage: python3 art-src/make_audio.py"""
import wave, numpy as np
SR = 44100
rng = np.random.default_rng(5)

def save(name, x, stereo=False):
    x = np.clip(x, -1, 1)
    pcm = (x * 32767).astype(np.int16)
    with wave.open(f'assets/audio/{name}.wav', 'wb') as w:
        w.setnchannels(2 if stereo else 1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(pcm.tobytes())

def t_(d): return np.arange(int(SR * d)) / SR
def env(t, a, d): return np.minimum(t / a, 1) * np.exp(-t / d)

def pluck(freq, dur, bright=0.5):
    n = int(SR * dur); p = int(SR / freq)
    buf = rng.uniform(-1, 1, p) * bright + (1 - bright) * np.sin(np.linspace(0, 6.28, p))
    out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = 0.4985 * (buf[i % p] + buf[(i + 1) % p])
    return out * np.linspace(1, 0.0, n) ** 0.5

# slingshot release: rubber twang + air
t = t_(0.35)
f = 520 * np.exp(-t * 6) + 180
twang = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(t, 0.002, 0.09)
air = np.convolve(rng.normal(0, 1, len(t)), np.ones(30) / 30, 'same') * env(t, 0.005, 0.06) * 0.5
save('fire', twang * 0.7 + air * 0.5)
# hit: woodblock "tok" + sparkle
t = t_(0.4)
tok = (np.sin(2 * np.pi * 880 * t) + 0.6 * np.sin(2 * np.pi * 1320 * t)) * env(t, 0.001, 0.05)
body = np.sin(2 * np.pi * 330 * t) * env(t, 0.001, 0.09) * 0.8
ding = np.sin(2 * np.pi * 1760 * t) * env(t, 0.01, 0.15) * 0.25
save('hit', tok * 0.6 + body * 0.5 + ding)
# miss: comic plop
t = t_(0.45)
f = 340 * np.exp(-t * 7) + 70
save('miss', np.sin(2 * np.pi * np.cumsum(f) / SR) * env(t, 0.003, 0.12) * 0.9)
# respawn: rising ding
x = np.zeros(int(SR * 0.7))
for i, fr in enumerate((523, 659, 784)):
    tt = t_(0.5); n = len(tt); s = i * int(SR * 0.09)
    x[s:s + n] += (np.sin(2 * np.pi * fr * tt) * env(tt, 0.004, 0.14))[: len(x) - s]
save('respawn', x * 0.5)
# whistle of the stone in flight
t = t_(0.3)
f = 2400 - 1400 * t / 0.3
save('whistle', np.sin(2 * np.pi * np.cumsum(f) / SR) * env(t, 0.03, 0.12) * 0.25)
# music: 4-chord ukulele loop with woodblock beat, 90 bpm, stereo
bpm = 100; beat = 60 / bpm; bars = 8
chords = [[261.6, 329.6, 392.0], [220.0, 261.6, 329.6], [174.6, 220.0, 261.6], [196.0, 246.9, 293.7]]
total = int(SR * beat * 4 * bars)
L = np.zeros(total); R = np.zeros(total)
for bar in range(bars):
    ch = chords[bar % 4]
    for b in range(8):  # eighth-note strum pattern
        s = int(SR * (bar * 4 + b * 0.5) * beat)
        if b % 2 == 0 or b in (3, 7):
            for k, fr in enumerate(ch):
                p = pluck(fr, 0.9, 0.7) * (0.16 if b % 2 == 0 else 0.1)
                n = min(len(p), total - s)
                L[s:s + n] += p[:n] * (0.9 - 0.1 * k); R[s:s + n] += p[:n] * (0.7 + 0.1 * k)
        if b in (2, 6):  # woodblock
            tt = t_(0.12); wb = np.sin(2 * np.pi * 1100 * tt) * env(tt, 0.001, 0.02) * 0.1
            n = min(len(wb), total - s); L[s:s + n] += wb[:n]; R[s:s + n] += wb[:n]
    # melody pluck on beats 1 and 3
    mel = {0: (659, 784), 1: (659, 523), 2: (698, 880), 3: (784, 587)}[bar % 4]
    for j, fr in enumerate(mel):
        s = int(SR * (bar * 4 + j * 2 + 0.5) * beat)
        p = pluck(fr, 1.2, 0.5) * 0.2
        n = min(len(p), total - s); L[s:s + n] += p[:n] * 0.8; R[s:s + n] += p[:n]
m = np.stack([L, R], axis=1)
m /= max(1e-6, np.abs(m).max()) / 0.7
m[: int(SR * 0.05)] *= np.linspace(0, 1, int(SR * 0.05))[:, None]
save('theme', m.reshape(-1), stereo=True)
print('audio ok')
