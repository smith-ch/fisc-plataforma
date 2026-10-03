"""Synthesize music + SFX for one storyboard as a single, key-consistent mix.

python3 audio.py <spec.json> <out.wav>
Music and effects share the key and a common reverb so the effects sit inside the track.
"""
import json, sys, wave
import numpy as np

SR = 48000
rng = np.random.default_rng(7)

def midi(n): return 440.0 * 2 ** ((n - 69) / 12)

def env(n, a, d, sustain=0.0, r=0.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * (sustain + (1 - sustain) * np.exp(-t / max(d, 1e-4)))
    if r > 0:
        rel = int(r * SR); e[-rel:] *= np.linspace(1, 0, min(rel, n))
    return e

def fft_filter(x, lo=None, hi=None, slope=0.15):
    """Smooth band filter in the frequency domain (soft shoulders, no ringing)."""
    n = len(x); X = np.fft.rfft(x); f = np.fft.rfftfreq(n, 1 / SR)
    g = np.ones_like(f)
    if hi: g *= 1 / (1 + (f / hi) ** (2 / slope * 0.3))
    if lo: g *= 1 / (1 + (lo / np.maximum(f, 1)) ** (2 / slope * 0.3))
    return np.fft.irfft(X * g, n)

def conv(x, ir):
    n = len(x) + len(ir); N = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, N) * np.fft.rfft(ir, N), N)[:len(x)]

def saw(f, n, harmonics=7, detune=0.0):
    t = np.arange(n) / SR; y = np.zeros(n)
    for k in range(1, harmonics + 1):
        y += np.sin(2 * np.pi * f * (1 + detune) * k * t + k) / k
    return y

def place(buf, x, at, gain=1.0):
    i = int(at * SR)
    if i >= len(buf): return
    m = min(len(x), len(buf) - i); buf[i:i + m] += x[:m] * gain

def main(spec_path, out):
    spec = json.load(open(spec_path))
    total = sum(s['dur'] for s in spec['scenes'])
    N = int((total + 0.05) * SR)
    bpm = spec.get('bpm', 112); beat = 60 / bpm; bar = 4 * beat
    root = 48 + spec.get('key', 0)                    # C3 + key offset
    tone = spec.get('tone', 'default')
    minor = tone in ('polished', 'cinematic', 'deadpan')
    # chord progression (scale degrees as semitone triads from the root)
    prog = [[9, 12, 16], [5, 9, 12], [0, 4, 7], [7, 11, 14]] if minor else [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]]
    scale = [0, 2, 4, 5, 7, 9, 11]
    halftime = tone in ('polished', 'cinematic', 'deadpan')

    starts = np.cumsum([0] + [s['dur'] for s in spec['scenes']])[:-1]
    drums_in = starts[1] if len(starts) > 1 else 0          # beat drops after the hook
    outro_at = starts[-1]

    pad = np.zeros(N); bass = np.zeros(N); arp = np.zeros(N); kick = np.zeros(N); snare = np.zeros(N); hat = np.zeros(N)
    nbars = int(np.ceil(total / bar)) + 1
    for b in range(nbars):
        ch = prog[b % 4]; t0 = b * bar
        n = int(bar * SR * 1.15)
        for k, iv in enumerate(ch + [ch[0] + 12]):
            f = midi(root + 12 + iv)
            v = saw(f, n, 6, 0.0015) + saw(f, n, 6, -0.0015)
            place(pad, v * env(n, 0.35, 9, 0.6, 0.5) * 0.10, t0)
        # bass: eighth-note root pulses
        for e8 in range(8):
            tt = t0 + e8 * beat / 2
            if tt < drums_in - 0.01: continue
            n2 = int(beat / 2 * SR); f = midi(root - 12 + ch[0] % 12)
            tb = np.arange(n2) / SR
            v = (np.sin(2 * np.pi * f * tb) + 0.25 * np.sin(4 * np.pi * f * tb)) * env(n2, 0.004, 0.16, 0.25, 0.03)
            place(bass, v * 0.55, tt)
        # arp: sixteenths over chord tones
        for s16 in range(16):
            tt = t0 + s16 * beat / 4
            if tt < drums_in - 0.01 or tt > outro_at + 1.2: continue
            iv = (ch + [ch[0] + 12])[[0, 1, 2, 3, 2, 1, 0, 2][s16 % 8]]
            f = midi(root + 24 + iv); n3 = int(0.22 * SR); ta = np.arange(n3) / SR
            v = (np.sin(2 * np.pi * f * ta) + np.sin(6 * np.pi * f * ta) / 9) * env(n3, 0.002, 0.07)
            place(arp, v * (0.16 if s16 % 4 == 0 else 0.10), tt)
        # drums
        for q in range(4):
            tt = t0 + q * beat
            if tt < drums_in - 0.01 or tt > outro_at + 1.6: continue
            if (not halftime) or q in (0, 2):
                n4 = int(0.4 * SR); tk = np.arange(n4) / SR
                fk = 48 + 95 * np.exp(-tk / 0.035)
                v = np.sin(2 * np.pi * np.cumsum(fk) / SR) * env(n4, 0.003, 0.16)
                place(kick, v, tt)
            if q in ((2,) if halftime else (1, 3)):
                n5 = int(0.25 * SR)
                place(snare, rng.standard_normal(n5) * env(n5, 0.001, 0.06), tt)
            for h in (0.5,) if halftime else (0.5,):
                n6 = int(0.06 * SR)
                place(hat, rng.standard_normal(n6) * env(n6, 0.0005, 0.018), tt + h * beat)

    # sidechain: duck pad/bass under the kick
    kenv = np.convolve(np.abs(kick), np.ones(int(0.01 * SR)) / int(0.01 * SR), 'same')
    duck = 1 - 0.45 * np.clip(kenv / (kenv.max() + 1e-9) * 1.4, 0, 1)
    intro_open = np.clip((np.arange(N) / SR) / max(drums_in, 0.1), 0, 1)  # pad opens up through the hook
    pad_f = fft_filter(pad, hi=1400) * (1 - intro_open) + fft_filter(pad, hi=3800) * intro_open
    music = pad_f * duck * 0.9 + fft_filter(bass, hi=900) * duck + fft_filter(arp, hi=6000) * 0.8 \
        + fft_filter(kick, hi=1800) * 0.85 + fft_filter(snare, lo=900, hi=5000) * 0.22 + fft_filter(hat, lo=7000) * 0.10

    # ---------------- SFX, tuned to the key ----------------
    sfx = np.zeros(N)
    def note(deg_oct, octv=5):
        return midi(root + 12 * (octv - 3) + scale[deg_oct % 7] + 12 * (deg_oct // 7))
    def pop(at, deg, g=0.30):
        n = int(0.35 * SR); t = np.arange(n) / SR; f = note(deg)
        v = np.sin(2 * np.pi * f * t * (1 + 0.02 * np.exp(-t / 0.02))) * env(n, 0.002, 0.09) + 0.3 * np.sin(4 * np.pi * f * t) * env(n, 0.002, 0.05)
        place(sfx, v * g, at)
    def whoosh(at, g=0.14):
        n = int(0.5 * SR); x = rng.standard_normal(n)
        # rising band sweep: blend of low and high filtered noise across the swell
        lo, hi = fft_filter(x, lo=300, hi=1500), fft_filter(x, lo=1500, hi=6000)
        k = np.linspace(0, 1, n); shape = np.sin(np.pi * k) ** 2
        place(sfx, (lo * (1 - k) + hi * k) * shape * g, at - 0.32)
    def click(at, g=0.25):
        n = int(0.04 * SR); t = np.arange(n) / SR
        v = fft_filter(np.sin(2 * np.pi * 2200 * t) * env(n, 0.001, 0.006) + rng.standard_normal(n) * env(n, 0.0005, 0.002) * 0.3, hi=7000)
        place(sfx, v * g, at)
    def bell(at, g=0.30):
        n = int(2.4 * SR); t = np.arange(n) / SR; f = midi(root + 24)
        v = sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t / d) for m, a, d in ((1, 1, 1.2), (2, .5, .8), (3, .25, .5), (4.2, .12, .3)))
        place(sfx, v * env(n, 0.003, 9) * g, at)
        for k2, iv in enumerate((0, 4, 7)):  # chord shimmer
            ff = midi(root + 36 + iv); vv = np.sin(2 * np.pi * ff * t) * np.exp(-t / 0.9)
            place(sfx, vv * g * 0.25, at + 0.06 * (k2 + 1))
    def thump(at, g=0.5):
        n = int(0.5 * SR); t = np.arange(n) / SR
        place(sfx, np.sin(2 * np.pi * (45 + 60 * np.exp(-t / 0.05)) * t) * env(n, 0.001, 0.2) * g, at)

    deg = 0
    for i, sc in enumerate(spec['scenes']):
        t0 = starts[i]
        if i > 0: whoosh(t0)
        if sc['type'] == 'text':
            for j, ln in enumerate(sc.get('lines', [])):
                at = ln.get('at', 0.12 + j * sc.get('stagger', 0.16))
                pop(t0 + at + 0.05, [4, 2, 0, 4][j % 4] + 7, 0.12)
                if 'strike' in ln: click(t0 + ln['strike'], 0.18)
            if 'counter' in sc:
                c = sc['counter']
                for k in range(8): pop(t0 + c['at'] + k * c.get('d', 1.2) / 8, k + 4, 0.08 + 0.01 * k)
                thump(t0 + c['at'] + c.get('d', 1.2), 0.45)
        if sc['type'] == 'logo':
            for k in range(4): pop(t0 + 0.15 + k * 0.22 + 0.3, [0, 2, 4, 7][k] + 7, 0.14)
            thump(t0 + 1.35, 0.45); bell(t0 + 1.38, 0.2)
        if sc['type'] == 'pillar':
            pop(t0 + 0.2, 7, 0.14)
            for j in range(len(sc.get('title', []))): pop(t0 + 0.3 + j * 0.18 + 0.05, [4, 2, 0][j % 3] + 7, 0.12)
            for j in range(len(sc.get('items', []))): pop(t0 + sc.get('itemsAt', 2) + j * 0.28 + 0.04, [0, 2, 4, 5, 7][j % 5] + 7, 0.10)
        if sc['type'] == 'list':
            for j in range(len(sc.get('lines', []))): pop(t0 + 0.12 + j * 0.18 + 0.05, [4, 2, 0][j % 3] + 7, 0.12)
            for j in range(len(sc.get('items', []))): pop(t0 + sc.get('itemsAt', 0.6 + len(sc.get('lines', [])) * 0.18) + j * 0.32 + 0.05, [0, 2, 4, 5, 7][j % 5] + 7, 0.12)
        if sc['type'] == 'cards':
            for j in range(len(sc['items'])): pop(t0 + 0.2 + j * 0.5 + 0.1, [0, 4, 7][j % 3] + 7, 0.16)
        if sc['type'] == 'outro':
            thump(t0 + 1.35, 0.4); bell(t0 + 1.38, 0.24)
            if 'cta' in sc: click(t0 + 2.9, 0.3)

    ir_n = int(1.1 * SR); ir = rng.standard_normal(ir_n) * np.exp(-np.arange(ir_n) / SR / 0.28)
    ir = fft_filter(ir, hi=5000); ir /= np.sqrt(np.sum(ir ** 2))
    def rms(x): return np.sqrt(np.mean(x ** 2) + 1e-12)
    music = music / rms(music) * 0.11
    sfx = sfx / (rms(sfx) + 1e-9) * 0.035              # effects sit under the music
    wet = conv(music * 0.25 + sfx * 0.6, ir) * 0.35
    mix = music + sfx + wet
    t = np.arange(N) / SR
    mix *= np.clip(t / 0.25, 0, 1) * np.clip((total - t) / 1.2, 0, 1)   # gentle in, 1.2 s tail out
    mix = np.tanh(mix * 1.6) / 1.6
    mix *= 0.89 / (np.max(np.abs(mix)) + 1e-9)            # -1 dBFS peak
    st = np.stack([mix, np.roll(mix, int(0.004 * SR)) * 0.98 + wet * 0.0], 1)  # slight Haas width
    pcm = (np.clip(st, -1, 1) * 32767).astype('<i2')
    with wave.open(out, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    print('audio', out, f'{total:.2f}s')

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
