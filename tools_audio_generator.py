#!/usr/bin/env python3
"""
Cowball v49 audio generator.

Generates the realistic-style soundtrack and stadium sound effects used by the game.
Everything is synthesized from scratch (numpy/scipy) and encoded with ffmpeg, so the
output is original material with no samples or third-party recordings.

Usage:
    python3 tools_audio_generator.py music [name ...]
    python3 tools_audio_generator.py sfx   [name ...]
    python3 tools_audio_generator.py all

Output goes to the current directory (same file names the game already loads).
Requires: numpy, scipy, ffmpeg with libmp3lame.
"""
import os
import re
import subprocess
import sys
import tempfile
from functools import lru_cache

import numpy as np
import scipy.signal as sg
from scipy.io import wavfile

SR = 44100
OUT_DIR = os.environ.get("COWBALL_AUDIO_OUT", ".")


# ----------------------------------------------------------------------------
# Basic helpers
# ----------------------------------------------------------------------------
def mtof(m):
    return 440.0 * 2.0 ** ((m - 69) / 12.0)


def db(x):
    return 10.0 ** (x / 20.0)


def rng_for(*key):
    return np.random.default_rng(abs(hash(key)) % (2 ** 32))


def _wn(fc):
    return np.clip(np.asarray(fc, dtype=float) / (SR / 2.0), 1e-4, 0.99)


def lp(x, fc, order=2):
    return sg.sosfilt(sg.butter(order, _wn(fc), "low", output="sos"), x, axis=-1)


def hp(x, fc, order=2):
    return sg.sosfilt(sg.butter(order, _wn(fc), "high", output="sos"), x, axis=-1)


def bp(x, lo, hi, order=2):
    return sg.sosfilt(sg.butter(order, [_wn(lo), _wn(hi)], "band", output="sos"), x, axis=-1)


def white(n, seed):
    return np.random.default_rng(seed).standard_normal(n)


def pink(n, seed):
    """Approximate pink noise by spectral shaping."""
    x = white(n, seed)
    spec = np.fft.rfft(x)
    f = np.arange(len(spec), dtype=float)
    f[0] = 1.0
    spec /= np.sqrt(f)
    y = np.fft.irfft(spec, n)
    return y / (np.max(np.abs(y)) + 1e-9)


def smooth_env(n, a, r, hold=None):
    """Attack / sustain / release envelope with smooth curves. All times in seconds."""
    t = np.arange(n) / SR
    na = max(a, 1e-3)
    e = np.minimum(1.0, t / na)
    e = np.sin(e * np.pi / 2) ** 1.5 if a > 0 else np.ones(n)
    if r is not None and r > 0:
        end = (n / SR) - r
        e = e * np.clip(1.0 - (t - end) / r, 0, 1) ** 1.6
    return e


def fit(x, n):
    if len(x) >= n:
        return x[:n]
    return np.pad(x, (0, n - len(x)))


# ----------------------------------------------------------------------------
# Stereo mix bus
# ----------------------------------------------------------------------------
class Bus:
    def __init__(self, seconds, tail=0.0):
        self.n = int(seconds * SR)
        self.tail = int(tail * SR)
        self.buf = np.zeros((2, self.n + self.tail), dtype=np.float64)

    def put(self, sig, t, pan=0.0, gain=1.0):
        if sig is None or len(sig) == 0:
            return
        i = int(round(t * SR))
        if i < 0:
            sig = sig[-i:]
            i = 0
        if i >= self.buf.shape[1]:
            return
        m = min(len(sig), self.buf.shape[1] - i)
        ang = (np.clip(pan, -1, 1) + 1) * np.pi / 4
        self.buf[0, i:i + m] += sig[:m] * np.cos(ang) * gain
        self.buf[1, i:i + m] += sig[:m] * np.sin(ang) * gain

    def put_stereo(self, sig2, t, gain=1.0):
        i = int(round(t * SR))
        m = min(sig2.shape[1], self.buf.shape[1] - i)
        if m > 0:
            self.buf[:, i:i + m] += sig2[:, :m] * gain


def make_ir(rt60, pre=0.015, seed=1, bright=1.0):
    n = int(min(rt60 * 1.5, 7.0) * SR)
    t = np.arange(n) / SR
    ir = np.zeros((2, n))
    for ch in range(2):
        noise = white(n, seed * 31 + ch)
        low = lp(noise, 350) * np.exp(-6.91 * t / (rt60 * 1.3))
        mid = bp(noise, 350, 3200) * np.exp(-6.91 * t / rt60)
        high = hp(noise, 3200) * np.exp(-6.91 * t / (rt60 * 0.5)) * bright
        ir[ch] = low + mid + 0.7 * high
        fade = np.minimum(1.0, t / 0.004)
        ir[ch] *= fade
    ir = np.concatenate([np.zeros((2, int(pre * SR))), ir], axis=1)
    ir /= np.sqrt(np.sum(ir ** 2, axis=1, keepdims=True)) + 1e-12
    return ir


def apply_reverb(x, ir, wet=0.3, wrap=False):
    n = x.shape[1]
    y = np.stack([sg.fftconvolve(x[c], ir[c]) for c in range(2)])
    out = x.copy()
    if wrap:
        # seamless loop: fold reverb tail back onto the start
        main = y[:, :n].copy()
        tail = y[:, n:]
        m = min(tail.shape[1], n)
        main[:, :m] += tail[:, :m]
        out += main * wet
    else:
        m = min(y.shape[1], n)
        out[:, :m] += y[:, :m] * wet
    return out


def wrap_tail(buf, n):
    """Fold anything past sample n back to the start (for loops)."""
    main = buf[:, :n].copy()
    tail = buf[:, n:]
    m = min(tail.shape[1], n)
    main[:, :m] += tail[:, :m]
    return main


# ----------------------------------------------------------------------------
# Instruments (all return mono float arrays)
# ----------------------------------------------------------------------------
@lru_cache(maxsize=4096)
def brass(f, dur, vel=0.8, soft=False):
    rel = 0.22
    n = int((dur + rel) * SR)
    t = np.arange(n) / SR
    a = 0.085 + 0.06 * (1 - vel) + (0.05 if soft else 0)
    env = np.sin(np.minimum(1.0, t / a) * np.pi / 2) ** 1.3
    env *= np.where(t < dur, 1.0, np.exp(-(t - dur) / (rel * 0.35)))
    r = (f * 7.13) % 1.0
    vib = 1 + 0.0035 * np.sin(2 * np.pi * 5.4 * t + r * 6) * np.clip((t - 0.3) / 0.5, 0, 1)
    ph = 2 * np.pi * f * np.cumsum(vib) / SR
    br = np.clip((0.30 + 0.62 * vel) * env ** 0.55, 0.05, 0.93)
    if soft:
        br = br * 0.78
    kmax = int(min(26, (SR / 2 - 800) / f))
    y = np.zeros(n)
    for k in range(1, kmax + 1):
        y += np.sin(k * ph + 0.2 * k) * (br ** (k - 1)) / (k ** 0.8)
    y *= env
    breath = bp(white(n, int(f)), 1800, 5200) * np.exp(-t / 0.06) * 0.05 * vel
    y = lp(y, 5200 if not soft else 3600) + breath
    return (y / 3.2).astype(np.float64)


@lru_cache(maxsize=4096)
def strings(f, dur, vel=0.6, att=0.30, rel=0.55, voices=4):
    n = int((dur + rel) * SR)
    t = np.arange(n) / SR
    env = np.sin(np.minimum(1.0, t / att) * np.pi / 2) ** 1.4
    env *= np.where(t < dur, 1.0, np.exp(-(t - dur) / (rel * 0.4)))
    y = np.zeros(n)
    kmax = int(min(14, (SR / 2 - 800) / f))
    for v in range(voices):
        rg = np.random.default_rng(int(f * 10) + v * 977)
        det = (v - (voices - 1) / 2) * 6.5 + rg.uniform(-2, 2)
        fv = f * 2 ** (det / 1200)
        rate = rg.uniform(4.6, 5.8)
        vib = 1 + 0.0028 * np.sin(2 * np.pi * rate * t + rg.uniform(0, 6)) * np.clip((t - 0.45) / 0.6, 0, 1)
        ph = 2 * np.pi * fv * np.cumsum(vib) / SR + rg.uniform(0, 6.28)
        for k in range(1, kmax + 1):
            y += np.sin(k * ph) / (k ** 1.1)
    y *= env / voices
    bow = 3600 * (0.55 + 0.7 * vel)
    y = lp(y, bow)
    y += lp(white(n, int(f) + 3), 2500) * 0.004 * env  # bow noise
    return (y * 0.9).astype(np.float64)


@lru_cache(maxsize=2048)
def piano(f, dur, vel=0.7):
    tau0 = np.clip(5.5 - 0.0045 * f, 0.9, 5.0) * (0.75 + 0.5 * vel)
    n = int((dur + 0.35) * SR)
    t = np.arange(n) / SR
    y = np.zeros(n)
    B = 0.00035 + 0.00000045 * f
    kmax = int(min(18, (SR / 2 - 800) / f))
    rg = np.random.default_rng(int(f * 13))
    for k in range(1, kmax + 1):
        fk = k * f * np.sqrt(1 + B * k * k)
        amp = vel ** (0.6 + 0.12 * k) / (k ** 1.05)
        tau = tau0 / (1 + 0.55 * (k - 1))
        for d in (-0.35, 0.35):  # two strings, slight beating
            y += amp * 0.5 * np.exp(-t / tau) * np.sin(2 * np.pi * (fk + d * k * 0.18) * t + rg.uniform(0, 6.28))
    hammer = lp(white(n, int(f) + 11), 2200) * np.exp(-t / 0.012) * 0.25 * vel
    y += hammer
    y *= np.where(t < dur, 1.0, np.exp(-(t - dur) / 0.12))
    y *= np.minimum(1.0, t / 0.002)
    return (y * 0.55).astype(np.float64)


@lru_cache(maxsize=2048)
def pluck(f, dur=1.6, vel=0.7, nylon=True):
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = np.zeros(n)
    tau0 = 1.5 if f < 250 else 1.1
    kmax = int(min(16, (SR / 2 - 800) / f))
    for k in range(1, kmax + 1):
        amp = (1 / k ** 1.25) * (1 if k % 5 else 0.55) * vel ** (0.4 + 0.1 * k)
        y += amp * np.exp(-t / (tau0 / (1 + 0.9 * (k - 1)))) * np.sin(2 * np.pi * k * f * (1 + 0.0002 * k) * t)
    y *= np.minimum(1.0, t / 0.003)
    y += lp(white(n, int(f) + 5), 3500) * np.exp(-t / 0.01) * 0.12 * vel
    # body resonance
    y = y + 0.25 * bp(y, 180, 420)
    return (y * 0.7).astype(np.float64)


@lru_cache(maxsize=1024)
def bass_note(f, dur, vel=0.8, upright=True):
    n = int((dur + 0.1) * SR)
    t = np.arange(n) / SR
    y = np.zeros(n)
    for k, a in enumerate([1.0, 0.55, 0.32, 0.16, 0.09, 0.05], start=1):
        y += a * np.sin(2 * np.pi * k * f * t) * np.exp(-t / (0.9 if upright else 2.5) / (1 + 0.35 * (k - 1)))
    y *= np.minimum(1.0, t / 0.006) * np.where(t < dur, 1.0, np.exp(-(t - dur) / 0.05))
    y += lp(white(n, int(f) + 2), 900) * np.exp(-t / 0.015) * 0.18 * vel
    return (y * 0.8 * vel).astype(np.float64)


@lru_cache(maxsize=1024)
def flute(f, dur, vel=0.6):
    rel = 0.18
    n = int((dur + rel) * SR)
    t = np.arange(n) / SR
    env = np.sin(np.minimum(1.0, t / 0.07) * np.pi / 2) * np.where(t < dur, 1.0, np.exp(-(t - dur) / 0.06))
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.1 * t) * np.clip((t - 0.25) / 0.4, 0, 1)
    ph = 2 * np.pi * f * np.cumsum(vib) / SR
    y = np.sin(ph) + 0.28 * np.sin(2 * ph) + 0.09 * np.sin(3 * ph) + 0.03 * np.sin(4 * ph)
    y *= env
    y += bp(white(n, int(f) + 9), 2500, 7000) * 0.05 * env * vel
    return (y * 0.5 * vel).astype(np.float64)


VOWELS = {
    "a": [(800, 90, 1.0), (1150, 110, 0.55), (2900, 180, 0.25)],
    "o": [(450, 70, 1.0), (800, 90, 0.5), (2830, 180, 0.12)],
    "u": [(325, 60, 1.0), (700, 80, 0.35), (2530, 160, 0.08)],
    "e": [(400, 70, 1.0), (2000, 150, 0.45), (2800, 180, 0.2)],
}


def formant_gain(freqs, vowel, shift=1.0):
    g = np.zeros_like(freqs, dtype=float)
    for fc, bw, a in VOWELS[vowel]:
        g += a * np.exp(-0.5 * ((freqs - fc * shift) / bw) ** 2)
    return g + 0.02


@lru_cache(maxsize=1024)
def choir(f, dur, vel=0.7, vowel="a", att=0.5, rel=0.7, voices=5, shift=1.0):
    n = int((dur + rel) * SR)
    t = np.arange(n) / SR
    env = np.sin(np.minimum(1.0, t / att) * np.pi / 2) ** 1.5
    env *= np.where(t < dur, 1.0, np.exp(-(t - dur) / (rel * 0.4)))
    y = np.zeros(n)
    for v in range(voices):
        rg = np.random.default_rng(int(f * 7) + v * 313)
        fv = f * 2 ** (rg.uniform(-9, 9) / 1200)
        vib = 1 + 0.006 * np.sin(2 * np.pi * rg.uniform(4.8, 5.8) * t + rg.uniform(0, 6)) * np.clip((t - 0.4) / 0.6, 0, 1)
        ph = 2 * np.pi * fv * np.cumsum(vib) / SR + rg.uniform(0, 6.28)
        kmax = int(min(40, 5000 / fv))
        for k in range(1, kmax + 1):
            gk = formant_gain(np.array([k * fv]), vowel, shift)[0]
            if gk < 0.015:
                continue
            y += gk * np.sin(k * ph) / (k ** 0.35)
    y *= env / voices
    y += bp(white(n, int(f) + 21), 1500, 6000) * 0.012 * env
    return (y * 0.30 * vel).astype(np.float64)


# ---- percussion ------------------------------------------------------------
@lru_cache(maxsize=256)
def timpani(f, dur=2.4, vel=0.9):
    n = int(dur * SR)
    t = np.arange(n) / SR
    modes = [(1.0, 1.7, 1.0), (1.5, 1.2, 0.8), (1.99, 0.85, 0.5), (2.44, 0.6, 0.35), (2.89, 0.45, 0.22)]
    y = np.zeros(n)
    glide = 1 + 0.07 * np.exp(-t / 0.09)
    for ratio, tau, amp in modes:
        ph = 2 * np.pi * f * ratio * np.cumsum(glide) / SR
        y += amp * np.sin(ph) * np.exp(-t / (tau * (0.7 + 0.5 * vel)))
    y += lp(white(n, int(f)), 500) * np.exp(-t / 0.03) * 0.9 * vel
    y += bp(white(n, int(f) + 1), 1200, 4200) * np.exp(-t / 0.012) * 0.35 * vel
    y *= np.minimum(1.0, t / 0.002)
    return (y * 0.6 * vel).astype(np.float64)


@lru_cache(maxsize=64)
def bass_drum(vel=0.9, big=False):
    n = int((1.6 if big else 0.55) * SR)
    t = np.arange(n) / SR
    f0 = 52 if big else 62
    fs = f0 + 70 * np.exp(-t / 0.035)
    y = np.sin(2 * np.pi * np.cumsum(fs) / SR) * np.exp(-t / (0.45 if big else 0.16))
    y += bp(white(n, 5), 1500, 5000) * np.exp(-t / 0.006) * 0.35
    y *= np.minimum(1.0, t / 0.0015)
    return (y * vel).astype(np.float64)


@lru_cache(maxsize=64)
def snare(vel=0.8, tight=True, seed=1):
    n = int(0.42 * SR)
    t = np.arange(n) / SR
    noise = bp(white(n, seed + 100), 1400, 9000) * np.exp(-t / (0.085 if tight else 0.16))
    tone = (np.sin(2 * np.pi * 185 * t) + 0.6 * np.sin(2 * np.pi * 330 * t)) * np.exp(-t / 0.05)
    y = noise * 0.85 + tone * 0.35
    y *= np.minimum(1.0, t / 0.0008)
    return (y * vel).astype(np.float64)


@lru_cache(maxsize=64)
def brush(vel=0.6, seed=1):
    n = int(0.28 * SR)
    t = np.arange(n) / SR
    y = bp(white(n, seed + 50), 2500, 9500) * np.minimum(1.0, t / 0.03) * np.exp(-t / 0.09)
    return (y * 0.55 * vel).astype(np.float64)


@lru_cache(maxsize=64)
def hat(vel=0.6, open_=False, seed=1):
    n = int((0.45 if open_ else 0.09) * SR)
    t = np.arange(n) / SR
    y = hp(white(n, seed + 7), 7000) * np.exp(-t / (0.16 if open_ else 0.028))
    return (y * 0.45 * vel).astype(np.float64)


@lru_cache(maxsize=32)
def cymbal(dur=3.2, vel=0.9, seed=3):
    n = int(dur * SR)
    t = np.arange(n) / SR
    rg = np.random.default_rng(seed)
    y = hp(white(n, seed), 3200) * np.exp(-t / (dur * 0.34))
    for _ in range(46):
        fc = rg.uniform(2200, 13000)
        y += 0.05 * np.sin(2 * np.pi * fc * t + rg.uniform(0, 6)) * np.exp(-t / rg.uniform(0.5, dur * 0.4))
    y *= np.minimum(1.0, t / 0.004)
    return (y * 0.55 * vel).astype(np.float64)


@lru_cache(maxsize=32)
def snare_roll(dur, vel0=0.25, vel1=0.95, rate=26.0, seed=2):
    n = int((dur + 0.3) * SR)
    y = np.zeros(n)
    hits = int(dur * rate)
    for i in range(hits):
        p = i / max(1, hits - 1)
        v = vel0 + (vel1 - vel0) * p ** 1.4
        s = snare(v, True, seed + (i % 3))
        t0 = int((i / rate) * SR + np.random.default_rng(i + seed).uniform(-0.002, 0.002) * SR)
        t0 = max(0, t0)
        m = min(len(s), n - t0)
        if m > 0:
            y[t0:t0 + m] += s[:m]
    return y


def timpani_roll(f, dur, vel0=0.3, vel1=0.95, rate=14.0):
    n = int((dur + 2.0) * SR)
    y = np.zeros(n)
    hits = int(dur * rate)
    for i in range(hits):
        p = i / max(1, hits - 1)
        v = vel0 + (vel1 - vel0) * p ** 1.3
        s = timpani(f, 1.4, v)
        t0 = int(i / rate * SR)
        m = min(len(s), n - t0)
        y[t0:t0 + m] += s[:m] * 0.8
    return y


# ----------------------------------------------------------------------------
# Mastering / encoding
# ----------------------------------------------------------------------------
def _run(cmd):
    return subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)


def _measure_lufs(path, af):
    r = _run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", af + ",ebur128=peak=true", "-f", "null", "-"])
    m = re.findall(r"\n\s+I:\s+(-?\d+\.?\d*) LUFS", r.stderr)
    return float(m[-1]) if m else -23.0


def finalize_music(stereo, name, target_lufs=-14.5, bitrate="128k", comp=True):
    x = stereo.T.astype(np.float32)
    peak = float(np.max(np.abs(x)) + 1e-9)
    x = x / peak * 0.7
    tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    tmp.close()
    wavfile.write(tmp.name, SR, x)
    chain = "acompressor=threshold=0.18:ratio=2.2:attack=30:release=320:makeup=1.6" if comp else "anull"
    cur = _measure_lufs(tmp.name, chain)
    gain = target_lufs - cur
    out = os.path.join(OUT_DIR, name)
    af = f"{chain},volume={gain:.2f}dB,alimiter=limit=0.89:attack=4:release=60:level=disabled"
    r = _run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", tmp.name, "-af", af,
              "-c:a", "libmp3lame", "-b:a", bitrate, "-ar", str(SR), out])
    os.unlink(tmp.name)
    if r.returncode != 0:
        raise RuntimeError(r.stderr)
    final = _measure_lufs(out, "anull")
    print(f"  {name}: {len(x) / SR:5.1f}s  {os.path.getsize(out) / 1024:6.0f} KB  {final:5.1f} LUFS")


def finalize_sfx(sig, name, peak_db=-2.5, bitrate="96k", stereo=False, fade_out=0.01, trim=True, drive=0.0):
    x = np.asarray(sig, dtype=np.float64)
    if x.ndim == 1:
        x = np.stack([x, x])
    p = float(np.max(np.abs(x)) + 1e-9)
    x = x / p
    if drive > 0:  # gentle saturation: raises density/loudness of crowd beds without hard clipping
        x = np.tanh(drive * x) / np.tanh(drive)
    x = x * db(peak_db)
    if trim:
        # drop the inaudible reverb tail (below -52 dB) so short effects stay short
        loud = np.where(np.max(np.abs(x), axis=0) > db(peak_db - 52))[0]
        if len(loud):
            end = min(x.shape[1], int(loud[-1]) + int(0.06 * SR))
            x = x[:, :end]
            fade_out = max(fade_out, 0.05)
    n = x.shape[1]
    fo = int(fade_out * SR)
    if fo > 0 and n > fo:
        x[:, -fo:] *= np.linspace(1, 0, fo)
    xi = x.T.astype(np.float32)
    tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    tmp.close()
    wavfile.write(tmp.name, SR, xi)
    out = os.path.join(OUT_DIR, name)
    args = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", tmp.name]
    if not stereo:
        args += ["-ac", "1"]
    args += ["-c:a", "libmp3lame", "-b:a", bitrate, "-ar", str(SR), out]
    r = _run(args)
    os.unlink(tmp.name)
    if r.returncode != 0:
        raise RuntimeError(r.stderr)
    print(f"  {name}: {n / SR:4.1f}s  {os.path.getsize(out) / 1024:5.0f} KB")


# ----------------------------------------------------------------------------
# Sound effects
# ----------------------------------------------------------------------------
def _end_fade(x, ms=70):
    x = x.copy()
    m = min(int(ms / 1000 * SR), x.shape[1] // 2)
    if m > 0:
        x[:, -m:] *= np.linspace(1, 0, m) ** 1.5
    return x


def room(sig, rt60=0.35, wet=0.25, seed=5):
    x = np.stack([sig, sig]) if np.asarray(sig).ndim == 1 else sig
    x = _end_fade(x)
    ir = make_ir(rt60, pre=0.004, seed=seed)
    n = x.shape[1]
    y = np.stack([sg.fftconvolve(x[c], ir[c]) for c in range(2)])
    pad = y.shape[1] - n
    out = np.pad(x, ((0, 0), (0, pad)))
    out += y * wet
    return out


def crowd_voices(dur, voices=40, pitch=1.0, excite=0.5, seed=0, vowels=("a", "o", "e"),
                 pulses=None, contour=None, gain_env=None, burst_rate=(1.2, 3.0), hiss=0.5):
    """Many overlapping synthetic voices + noise bed = convincing stadium crowd."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = np.zeros(n)
    for v in range(voices):
        rg = np.random.default_rng(seed * 997 + v)
        female = rg.random() < 0.35
        f0 = rg.uniform(105, 205) * (1.85 if female else 1.0) * pitch
        vowel = vowels[int(rg.integers(len(vowels)))]
        shift = rg.uniform(0.92, 1.18) * (1.12 if female else 1.0)
        w = int(rg.uniform(0.16, 0.42) * SR)
        win = np.hanning(w)
        pulse = np.zeros(n)
        if pulses is None:
            cnt = max(1, int(dur * rg.uniform(*burst_rate)))
            for _ in range(cnt):
                pulse[int(rg.uniform(0, 1) * (n - 1))] = rg.uniform(0.5, 1.0)
        else:
            for (pt, pw, pa) in pulses:
                c = int((pt + rg.normal(0, 0.022)) * SR)
                if 0 <= c < n:
                    pulse[c] = pa * rg.uniform(0.7, 1.0)
            w = int(0.2 * SR)
            win = np.hanning(w)
        env = sg.fftconvolve(pulse, win)[:n]
        env = np.clip(env, 0, 1.2)
        mod = 1 + 0.05 * np.sin(2 * np.pi * rg.uniform(0.3, 1.3) * t + rg.uniform(0, 6.28))
        mod += excite * 0.08 * np.sin(2 * np.pi * rg.uniform(2, 6) * t)
        if contour is not None:
            mod = mod * contour
        ph = 2 * np.pi * f0 * np.cumsum(mod) / SR + rg.uniform(0, 6.28)
        kmax = int(min(22, 3800 / f0))
        voice = np.zeros(n)
        for k in range(1, kmax + 1):
            gk = formant_gain(np.array([k * f0]), vowel, shift)[0]
            if gk < 0.03:
                continue
            voice += gk * np.sin(k * ph) / (k ** 0.45)
        y += voice * env * rg.uniform(0.5, 1.0)
    y /= max(1.0, np.sqrt(voices))
    # noise bed gives the dense, diffuse "wash"
    bed = bp(pink(n, seed + 77), 220, 3600, 2)
    bed_env = 0.55 + 0.45 * lp(np.abs(white(n, seed + 78)), 3)
    bed_env /= np.max(bed_env)
    y = y * 1.0 + bed * bed_env * (0.9 + excite) * 0.9
    y += hp(pink(n, seed + 79), 3000) * hiss * 0.06 * (0.4 + excite)
    if gain_env is not None:
        y *= gain_env
    return y


def stadium(sig, wet=0.33, rt=2.1, seed=4, fade=True):
    x = np.stack([sig, sig]) if np.asarray(sig).ndim == 1 else sig
    if fade:
        x = _end_fade(x)
    ir = make_ir(rt, pre=0.03, seed=seed, bright=0.7)
    y = np.stack([sg.fftconvolve(x[c], ir[c]) for c in range(2)])
    out = np.pad(x, ((0, 0), (0, y.shape[1] - x.shape[1])))
    return out + y * wet


def bell_env(n, rise, fall, peak_pos=None):
    t = np.arange(n) / SR
    d = n / SR
    pk = rise if peak_pos is None else peak_pos
    e = np.where(t < pk, np.sin(np.clip(t / max(pk, 1e-3), 0, 1) * np.pi / 2) ** 1.6,
                 np.exp(-(t - pk) / fall))
    e *= np.clip((d - t) / 0.25, 0, 1)
    return e


def whistle_tone(dur, f=2850.0, trill=True, seed=0, level=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    warble = 1 + 0.012 * np.sin(2 * np.pi * 4.6 * t) + 0.004 * np.sin(2 * np.pi * 11 * t + 1)
    f1 = f * warble
    ph1 = 2 * np.pi * np.cumsum(f1) / SR
    ph2 = 2 * np.pi * np.cumsum(f1 * 1.0135) / SR
    pea = 0.74 + 0.26 * np.sin(2 * np.pi * 31 * t) if trill else np.ones(n)
    y = np.sin(ph1) + 0.8 * np.sin(ph2) + 0.22 * np.sin(2 * ph1) + 0.06 * np.sin(3 * ph1)
    y *= pea
    breath = bp(white(n, 123 + seed), 2200, 5600) * 0.34 * pea
    y += breath
    env = np.minimum(1.0, t / 0.014) ** 1.2 * np.clip((dur - t) / 0.05, 0, 1)
    return y * env * 0.5 * level


def sfx_whistle():
    y = whistle_tone(0.72)
    return room(y, 0.4, 0.22)


def sfx_whistle_triple():
    n = int(2.9 * SR)
    out = np.zeros(n)
    for i, (t0, d) in enumerate([(0.0, 0.42), (0.62, 0.42), (1.25, 1.35)]):
        s = whistle_tone(d, f=2850 + 25 * i, seed=i)
        a = int(t0 * SR)
        out[a:a + len(s)] += s
    return room(out, 0.55, 0.26)


def sfx_kick():
    n = int(0.42 * SR)
    t = np.arange(n) / SR
    fs = 70 + 140 * np.exp(-t / 0.035)
    thump = np.sin(2 * np.pi * np.cumsum(fs) / SR) * np.exp(-t / 0.075)
    slap = bp(white(n, 31), 900, 3600) * np.exp(-t / 0.016)
    air = np.sin(2 * np.pi * 235 * t) * np.exp(-t / 0.045) * 0.28
    y = thump * 1.0 + slap * 0.75 + air + lp(white(n, 32), 350) * np.exp(-t / 0.03) * 0.5
    y *= np.minimum(1.0, t / 0.0008)
    return room(y, 0.22, 0.12)


def sfx_pass():
    n = int(0.28 * SR)
    t = np.arange(n) / SR
    fs = 60 + 90 * np.exp(-t / 0.03)
    thump = np.sin(2 * np.pi * np.cumsum(fs) / SR) * np.exp(-t / 0.06)
    slap = bp(white(n, 41), 700, 2400) * np.exp(-t / 0.014)
    y = thump * 0.9 + slap * 0.45 + lp(white(n, 42), 300) * np.exp(-t / 0.03) * 0.4
    y *= np.minimum(1.0, t / 0.001)
    return room(y, 0.2, 0.1)


def sfx_bounce():
    n = int(0.75 * SR)
    y = np.zeros(n)
    for i, (t0, a) in enumerate([(0.0, 1.0), (0.2, 0.5), (0.36, 0.25), (0.47, 0.12)]):
        m = int(0.18 * SR)
        t = np.arange(m) / SR
        fs = 55 + 70 * np.exp(-t / 0.03)
        th = np.sin(2 * np.pi * np.cumsum(fs) / SR) * np.exp(-t / 0.05)
        sl = bp(white(m, 50 + i), 500, 1800) * np.exp(-t / 0.012) * 0.5
        s = (th + sl) * a
        k = int(t0 * SR)
        y[k:k + m] += s
    return room(y, 0.25, 0.1)


def sfx_post():
    n = int(1.5 * SR)
    t = np.arange(n) / SR
    y = np.zeros(n)
    for fc, tau, a in [(640, 0.55, 1.0), (1385, 0.42, 0.7), (2230, 0.3, 0.45), (3420, 0.2, 0.28), (4900, 0.12, 0.16)]:
        y += a * np.sin(2 * np.pi * fc * t) * np.exp(-t / tau)
    y += np.sin(2 * np.pi * 85 * t) * np.exp(-t / 0.06) * 0.9
    y += bp(white(n, 61), 1500, 7000) * np.exp(-t / 0.01) * 0.6
    y *= np.minimum(1.0, t / 0.0006)
    return room(y, 0.8, 0.28)


def sfx_net():
    n = int(1.0 * SR)
    t = np.arange(n) / SR
    rip = 1 + 0.9 * np.sin(2 * np.pi * (22 * np.exp(-t / 0.6)) * t)
    rustle = bp(white(n, 71), 1600, 8000) * np.exp(-t / 0.27) * np.clip(rip, 0.1, 2) * 0.9
    thump = np.sin(2 * np.pi * 88 * t) * np.exp(-t / 0.07) * 0.9
    cord = np.sin(2 * np.pi * (520 + 60 * np.exp(-t / 0.1)) * t) * np.exp(-t / 0.12) * 0.12
    y = rustle + thump + cord + lp(white(n, 72), 600) * np.exp(-t / 0.05) * 0.5
    y *= np.minimum(1.0, t / 0.001)
    return room(y, 0.5, 0.18)


def sfx_glove():
    n = int(0.28 * SR)
    t = np.arange(n) / SR
    y = bp(white(n, 81), 500, 2600) * np.exp(-t / 0.028) * 0.9
    y += np.sin(2 * np.pi * (150 + 90 * np.exp(-t / 0.03)) * t) * np.exp(-t / 0.05) * 0.8
    y += hp(white(n, 82), 5000) * np.exp(-t / 0.01) * 0.2
    return room(y, 0.25, 0.1)


def sfx_tackle():
    n = int(0.4 * SR)
    t = np.arange(n) / SR
    y = np.sin(2 * np.pi * (60 + 70 * np.exp(-t / 0.04)) * t) * np.exp(-t / 0.09) * 1.0
    y += lp(white(n, 91), 1600) * np.exp(-t / 0.05) * 0.8
    y += bp(white(n, 92), 3000, 9000) * np.exp(-t / 0.12) * np.minimum(1, t / 0.03) * 0.22  # grass scuff
    return room(y, 0.3, 0.1)


def sfx_card():
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    sweep = bp(white(n, 95), 2500, 9000) * np.sin(np.clip(t / 0.12, 0, 1) * np.pi) * np.exp(-t / 0.1)
    snap = hp(white(n, 96), 3000) * np.exp(-((t - 0.12) / 0.006) ** 2) * 1.4
    return sweep * 0.5 + snap


def sfx_coin():
    n = int(1.6 * SR)
    t = np.arange(n) / SR
    spin = np.clip(1 - t / 0.95, 0, 1)
    amod = 0.55 + 0.45 * np.sin(2 * np.pi * np.cumsum(7 + 36 * spin ** 1.5) / SR)
    y = np.zeros(n)
    for fc, a in [(3300, 1.0), (5100, 0.55), (7600, 0.3), (9900, 0.14)]:
        y += a * np.sin(2 * np.pi * fc * t)
    y *= amod * np.exp(-t / 0.7) * np.minimum(1, t / 0.003) * (t < 1.05)
    y *= 0.35
    k = int(1.12 * SR)
    m = int(0.16 * SR)
    tt = np.arange(m) / SR
    slap = bp(white(m, 101), 500, 3000) * np.exp(-tt / 0.02) + np.sin(2 * np.pi * 130 * tt) * np.exp(-tt / 0.04) * 0.6
    y[k:k + m] += slap * 0.9
    return room(y, 0.35, 0.18)


def sfx_pa_chime():
    notes = [(659.3, 0.0), (523.3, 0.45), (783.99, 0.9)]
    n = int(3.0 * SR)
    y = np.zeros(n)
    for f, t0 in notes:
        m = int(1.8 * SR)
        t = np.arange(m) / SR
        s = np.zeros(m)
        for r, a, tau in [(1, 1.0, 0.9), (2.0, 0.35, 0.5), (3.01, 0.2, 0.3), (4.2, 0.08, 0.2)]:
            s += a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / tau)
        s *= np.minimum(1, t / 0.006)
        k = int(t0 * SR)
        y[k:k + m] += s
    y = bp(y, 260, 7000)
    return stadium(y, 0.45, 1.8, seed=8)


def sfx_tunnel_steps():
    n = int(4.2 * SR)
    y = np.zeros(n)
    rg = np.random.default_rng(111)
    t0 = 0.05
    for i in range(14):
        m = int(0.12 * SR)
        t = np.arange(m) / SR
        s = lp(white(m, 120 + i), 1800) * np.exp(-t / 0.018) * 1.0
        s += np.sin(2 * np.pi * (95 + rg.uniform(-10, 10)) * t) * np.exp(-t / 0.03) * 0.7
        s += hp(white(m, 160 + i), 4000) * np.exp(-t / 0.006) * 0.35
        k = int(t0 * SR)
        y[k:k + m] += s * (0.7 + 0.3 * rg.random()) * (0.55 + 0.45 * min(1, i / 5))
        t0 += 0.29 + rg.uniform(-0.015, 0.015)
    return stadium(y, 0.9, 1.5, seed=9)


def sfx_drumroll(dur=3.2):
    y = snare_roll(dur, 0.18, 1.0, rate=24)
    return stadium(y, 0.3, 1.6, seed=10)


def sfx_cymbal():
    return stadium(cymbal(3.6, 1.0), 0.25, 1.6, seed=11)


def sfx_fireworks_launch():
    n = int(1.1 * SR)
    t = np.arange(n) / SR
    sweep = np.zeros(n)
    noise = white(n, 131)
    for i, (lo, hi) in enumerate([(500, 1500), (1200, 3200), (2500, 6500), (4500, 11000)]):
        band = bp(noise, lo, hi)
        c = np.clip((t - i * 0.2) / 0.3, 0, 1) * np.exp(-np.clip(t - 0.45 - i * 0.12, 0, None) / 0.25)
        sweep += band * c * 0.7
    sweep *= np.clip(t / 0.05, 0, 1) * np.clip((1.1 - t) / 0.1, 0, 1)
    fizz = hp(white(n, 132), 5000) * (np.random.default_rng(133).random(n) > 0.985) * 0.9
    return stadium(sweep + fizz * 0.5, 0.3, 1.6, seed=12)


def sfx_fireworks_burst():
    n = int(2.6 * SR)
    t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * (48 + 60 * np.exp(-t / 0.08)) * t) * np.exp(-t / 0.28)
    boom += lp(white(n, 141), 1400) * np.exp(-t / 0.18) * 1.1
    crack = hp(white(n, 142), 2500) * np.exp(-t / 0.03) * 0.9
    rg = np.random.default_rng(143)
    sparkle = np.zeros(n)
    for _ in range(70):
        k = int(rg.uniform(0.08, 2.0) ** 1.1 * SR)
        m = int(0.012 * SR)
        if k + m < n:
            sparkle[k:k + m] += hp(white(m, int(rg.integers(1e6))), 3500) * rg.uniform(0.15, 0.55) * np.exp(-k / SR / 1.0)
    y = boom * 1.0 + crack + sparkle * 0.9
    y *= np.minimum(1, t / 0.0008)
    return stadium(y, 0.55, 2.4, seed=13)


def sfx_confetti():
    n = int(1.6 * SR)
    t = np.arange(n) / SR
    pop = (bp(white(n, 151), 300, 2600) * np.exp(-t / 0.03) * 1.3 +
           np.sin(2 * np.pi * (110 + 80 * np.exp(-t / 0.03)) * t) * np.exp(-t / 0.05) * 0.8)
    rg = np.random.default_rng(152)
    flutter = hp(white(n, 153), 2800) * (0.4 + 0.6 * lp(np.abs(white(n, 154)), 40)) * np.exp(-t / 0.55) * np.clip(t / 0.05, 0, 1) * 0.25
    return stadium(pop + flutter, 0.4, 1.8, seed=14)


def sfx_pyro():
    n = int(1.8 * SR)
    t = np.arange(n) / SR
    roar = lp(white(n, 161), 1500) * (1 - np.exp(-t / 0.05)) * np.exp(-t / 0.7)
    hiss = hp(white(n, 162), 3500) * np.exp(-t / 0.5) * (1 - np.exp(-t / 0.04)) * 0.35
    flutter = 1 + 0.35 * lp(white(n, 163), 18)
    return stadium((roar + hiss) * flutter, 0.35, 1.6, seed=15)


def sfx_trophy_lift():
    n = int(3.2 * SR)
    t = np.arange(n) / SR
    y = np.zeros(n)
    for fc, tau, a in [(880, 2.2, 1.0), (1745, 1.8, 0.55), (2662, 1.4, 0.4), (3590, 1.0, 0.28), (5320, 0.7, 0.18), (7430, 0.5, 0.1)]:
        y += a * np.sin(2 * np.pi * fc * t) * np.exp(-t / tau)
    y *= np.minimum(1, t / 0.004)
    rg = np.random.default_rng(171)
    for _ in range(40):
        k = int(rg.uniform(0.05, 2.3) * SR)
        f = rg.uniform(3500, 10500)
        m = int(0.3 * SR)
        tt = np.arange(m) / SR
        if k + m < n:
            y[k:k + m] += 0.09 * np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.07)
    clank = bp(white(n, 172), 1500, 6000) * np.exp(-t / 0.02) * 0.6
    return stadium(y + clank, 0.5, 2.2, seed=16)


def sfx_trophy_reveal():
    n = int(4.5 * SR)
    t = np.arange(n) / SR
    y = np.zeros(n)
    noise = white(n, 181)
    rise = np.zeros(n)
    for i, (lo, hi) in enumerate([(200, 700), (600, 2200), (1800, 6000), (4500, 12000)]):
        c = np.clip((t - i * 0.4) / 1.2, 0, 1) ** 1.8 * (t < 2.4)
        rise += bp(noise, lo, hi) * c
    y += rise * 0.5
    k = int(2.4 * SR)
    b = bass_drum(1.0, True)
    y[k:k + len(b)] += b[:n - k] * 1.4
    cy = cymbal(2.0, 1.0)
    m = min(len(cy), n - k)
    y[k:k + m] += cy[:m] * 0.9
    sub = np.sin(2 * np.pi * 42 * t) * np.exp(-np.clip(t - 2.4, 0, None) / 0.9) * (t >= 2.4)
    y += sub * 1.1
    return stadium(y, 0.4, 2.4, seed=17)


def sfx_horn():
    n = int(1.5 * SR)
    t = np.arange(n) / SR
    y = np.zeros(n)
    for f in (233.1, 293.7, 349.2):
        ph = 2 * np.pi * f * np.cumsum(1 + 0.002 * np.sin(2 * np.pi * 6 * t)) / SR
        for k in range(1, 14):
            y += np.sin(k * ph) / k ** 0.9 * 0.5
    y = lp(y, 3200)
    y *= np.minimum(1, t / 0.04) * np.exp(-np.clip(t - 0.9, 0, None) / 0.18)
    return stadium(y, 0.35, 1.8, seed=18)


def _fade_loop(y, xf):
    """Make y loop seamlessly by cross-fading the tail into the head."""
    n = len(y) - xf
    out = y[:n].copy()
    out[:xf] = out[:xf] * np.linspace(0, 1, xf) + y[n:n + xf] * np.linspace(1, 0, xf)
    return out


def sfx_ambience():
    dur = 12.0
    xf = int(1.2 * SR)
    total = dur + 1.2
    y = crowd_voices(total, voices=34, pitch=1.0, excite=0.25, seed=21, burst_rate=(0.5, 1.4), hiss=0.4)
    n = len(y)
    t = np.arange(n) / SR
    # occasional shouts / fan whistles
    rg = np.random.default_rng(22)
    for _ in range(5):
        k = int(rg.uniform(0.5, total - 1.5) * SR)
        f = rg.uniform(2600, 3400)
        m = int(rg.uniform(0.25, 0.6) * SR)
        tt = np.arange(m) / SR
        y[k:k + m] += 0.05 * np.sin(2 * np.pi * f * tt * (1 + 0.02 * np.sin(2 * np.pi * 5 * tt))) * np.sin(np.pi * tt / (m / SR))
    y = _fade_loop(y, xf)
    st = stadium(y, 0.3, 2.4, seed=23, fade=False)
    return wrap_tail(st, len(y))  # reverb tail folded to the start => seamless loop


def sfx_cheer():
    dur = 3.4
    n = int(dur * SR)
    env = bell_env(n, 0.55, 1.1, 0.8)
    y = crowd_voices(dur, voices=46, pitch=1.12, excite=0.75, seed=31, burst_rate=(2.0, 4.0), gain_env=env)
    return stadium(y, 0.38, 2.2, seed=32)


def sfx_roar_big():
    dur = 6.0
    n = int(dur * SR)
    env = bell_env(n, 0.7, 2.0, 1.0)
    y = crowd_voices(dur, voices=64, pitch=1.08, excite=1.0, seed=41, burst_rate=(2.5, 4.5), gain_env=env, vowels=("a", "o"))
    rg = np.random.default_rng(42)
    t = np.arange(n) / SR
    for _ in range(9):
        k = int(rg.uniform(0.4, 4.0) * SR)
        f = rg.uniform(2700, 3600)
        m = int(rg.uniform(0.3, 0.8) * SR)
        tt = np.arange(m) / SR
        y[k:k + m] += 0.06 * np.sin(2 * np.pi * f * tt) * np.sin(np.pi * tt / (m / SR)) * env[k:k + m]
    return stadium(y, 0.42, 2.6, seed=43)


def sfx_gasp():
    dur = 2.0
    n = int(dur * SR)
    t = np.arange(n) / SR
    contour = 1 + 0.28 * np.sin(np.pi * np.clip(t / 1.4, 0, 1)) * (t < 1.4)
    env = bell_env(n, 0.45, 0.5, 0.55)
    pulses = [(0.25 + 0.05 * i, 0.3, 1.0) for i in range(4)]
    y = crowd_voices(dur, voices=34, pitch=1.0, excite=0.3, seed=51, vowels=("o", "a"), contour=contour, pulses=pulses, gain_env=env)
    return stadium(y, 0.35, 2.0, seed=52)


def sfx_boo():
    dur = 2.8
    n = int(dur * SR)
    t = np.arange(n) / SR
    contour = 1 - 0.14 * np.clip(t / 2.4, 0, 1)
    env = bell_env(n, 0.5, 1.2, 0.7)
    pulses = [(0.2 + 0.02 * i, 0.4, 1.0) for i in range(6)] + [(0.9 + 0.03 * i, 0.4, 0.8) for i in range(5)]
    y = crowd_voices(dur, voices=44, pitch=0.78, excite=0.2, seed=61, vowels=("u", "o"), contour=contour, pulses=pulses, gain_env=env, hiss=0.15)
    return stadium(y, 0.35, 2.1, seed=62)


def sfx_applause():
    dur = 5.0
    n = int(dur * SR)
    t = np.arange(n) / SR
    rg = np.random.default_rng(71)
    y = np.zeros(n)
    dens = np.clip(t / 0.8, 0, 1) * np.exp(-np.clip(t - 2.6, 0, None) / 1.1)
    count = 2600
    for _ in range(count):
        k = int(rg.uniform(0, dur) * SR)
        if rg.random() > dens[min(k, n - 1)]:
            continue
        m = int(rg.uniform(0.005, 0.012) * SR)
        tt = np.arange(m) / SR
        fc = rg.uniform(1200, 3600)
        c = bp(white(m, int(rg.integers(1e6))), fc * 0.7, min(fc * 1.7, 15000), 1) * np.exp(-tt / 0.004)
        if k + m < n:
            y[k:k + m] += c * rg.uniform(0.2, 1.0)
    y += lp(pink(n, 72), 900) * 0.0
    y += crowd_voices(dur, voices=14, pitch=1.1, excite=0.5, seed=73, gain_env=dens * 0.55)
    return stadium(y, 0.3, 2.0, seed=74)


def sfx_chant():
    dur = 8.0
    step = 0.25
    pattern = [1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1]  # 16 steps = one phrase
    pulses = []
    for rep in range(2):
        for i, p in enumerate(pattern):
            if p:
                pulses.append((rep * 16 * step + i * step + 0.05, 0.2, 1.0))
    n = int(dur * SR)
    y = crowd_voices(dur, voices=52, pitch=1.0, excite=0.6, seed=81, vowels=("o", "a"), pulses=pulses)
    # claps and stomps on the beat
    for rep in range(2):
        for i, p in enumerate(pattern):
            k = int((rep * 16 * step + i * step) * SR)
            if p:
                m = int(0.09 * SR)
                tt = np.arange(m) / SR
                clap = bp(white(m, 90 + i + rep * 16), 900, 5200, 1) * np.exp(-tt / 0.02)
                y[k:k + m] += clap * 0.42
            if i % 4 == 0:
                m = int(0.3 * SR)
                tt = np.arange(m) / SR
                stomp = np.sin(2 * np.pi * 62 * tt) * np.exp(-tt / 0.07) + lp(white(m, 200 + i), 250) * np.exp(-tt / 0.03)
                y[k:k + m] += stomp * 0.55
    return stadium(y, 0.38, 2.2, seed=82)


def sfx_goal_fanfare():
    dur = 3.6
    n = int(dur * SR)
    env = bell_env(n, 0.22, 1.4, 0.45)
    y = crowd_voices(dur, voices=58, pitch=1.12, excite=1.0, seed=91, burst_rate=(2.5, 4.5), gain_env=env, vowels=("a", "o"))
    horn = sfx_horn()[0]
    k = int(0.05 * SR)
    m = min(len(horn), n - k)
    y[k:k + m] += horn[:m] * 0.22
    return stadium(y, 0.36, 2.3, seed=92)


SFX_JOBS = {
    "ball-impact.mp3": (sfx_kick, {}),
    "ball-pass.mp3": (sfx_pass, {}),
    "ball-bounce.mp3": (sfx_bounce, {}),
    "post-hit.mp3": (sfx_post, {}),
    "net-hit.mp3": (sfx_net, {"drive": 3.5, "peak_db": -1.5}),
    "glove-save.mp3": (sfx_glove, {}),
    "tackle.mp3": (sfx_tackle, {}),
    "card-flick.mp3": (sfx_card, {}),
    "referee-whistle.mp3": (sfx_whistle, {"peak_db": -1.0, "drive": 1.8}),
    "whistle-triple.mp3": (sfx_whistle_triple, {"peak_db": -1.0, "drive": 1.8}),
    "coin-toss.mp3": (sfx_coin, {}),
    "pa-chime.mp3": (sfx_pa_chime, {"stereo": True}),
    "tunnel-steps.mp3": (sfx_tunnel_steps, {"stereo": True}),
    "drumroll.mp3": (sfx_drumroll, {"stereo": True}),
    "cymbal-crash.mp3": (sfx_cymbal, {"stereo": True}),
    "fireworks-launch.mp3": (sfx_fireworks_launch, {"stereo": True}),
    "fireworks-burst.mp3": (sfx_fireworks_burst, {"stereo": True}),
    "confetti-cannon.mp3": (sfx_confetti, {"stereo": True}),
    "pyro-flame.mp3": (sfx_pyro, {"stereo": True}),
    "trophy-lift.mp3": (sfx_trophy_lift, {"stereo": True}),
    "trophy-reveal.mp3": (sfx_trophy_reveal, {"stereo": True}),
    "stadium-horn.mp3": (sfx_horn, {"stereo": True}),
    "stadium-ambience.mp3": (sfx_ambience, {"stereo": True, "bitrate": "112k", "fade_out": 0, "trim": False, "drive": 2.6, "peak_db": -9.5}),
    "crowd-cheer.mp3": (sfx_cheer, {"stereo": True, "bitrate": "112k", "drive": 3.0, "peak_db": -6.0}),
    "crowd-roar-big.mp3": (sfx_roar_big, {"stereo": True, "bitrate": "112k", "drive": 3.2}),
    "crowd-gasp.mp3": (sfx_gasp, {"stereo": True, "drive": 2.6}),
    "crowd-boo.mp3": (sfx_boo, {"stereo": True, "drive": 2.6}),
    "crowd-applause.mp3": (sfx_applause, {"stereo": True, "bitrate": "112k", "drive": 2.4}),
    "crowd-chant.mp3": (sfx_chant, {"stereo": True, "bitrate": "112k", "drive": 2.6}),
    "goal-fanfare.mp3": (sfx_goal_fanfare, {"stereo": True, "bitrate": "112k", "drive": 3.0, "peak_db": -5.5}),
}


def build_sfx(names=None):
    for fname, (fn, kw) in SFX_JOBS.items():
        if names and fname.replace(".mp3", "") not in names and fname not in names:
            continue
        finalize_sfx(fn(), fname, **kw)


# ----------------------------------------------------------------------------
# Music: tiny score engine
# ----------------------------------------------------------------------------
def riser(dur, vel=0.8, seed=5):
    n = int((dur + 0.1) * SR)
    t = np.arange(n) / SR
    noise = white(n, seed)
    y = np.zeros(n)
    for i, (lo, hi) in enumerate([(150, 600), (500, 2000), (1600, 5500), (4000, 12000)]):
        c = np.clip((t - i * dur * 0.18) / (dur * 0.6), 0, 1) ** 1.6
        y += bp(noise, lo, hi) * c
    y *= np.clip(t / dur, 0, 1) ** 1.5 * np.clip((dur + 0.1 - t) / 0.1, 0, 1)
    return y * vel * 0.4


class Track:
    def __init__(self, bpm, bars, tail=3.5, loop=True):
        self.bpm, self.bars, self.loop = bpm, bars, loop
        self.spb = 60.0 / bpm
        self.dur = bars * 4 * self.spb
        self.tail = tail
        self.bus = {k: Bus(self.dur, tail) for k in ("orch", "perc", "solo", "low")}
        self.rg = np.random.default_rng(int(bpm * 100 + bars))

    def tm(self, bar, beat=0.0):
        return (bar * 4 + beat) * self.spb

    def secs(self, beats):
        return round(beats * self.spb, 3)

    def v(self, vel):
        return float(np.clip(vel * self.rg.uniform(0.92, 1.06), 0.05, 1.0))

    def add(self, bus, sig, bar, beat=0.0, pan=0.0, gain=1.0, jit=0.005):
        t = self.tm(bar, beat) + self.rg.normal(0, jit)
        self.bus[bus].put(sig, max(0.0, t), pan, gain)

    def mix(self, gains=None, wets=None, rts=None):
        gains = {"orch": 1.0, "perc": 1.0, "solo": 1.0, "low": 1.0, **(gains or {})}
        wets = {"orch": 0.42, "perc": 0.22, "solo": 0.30, "low": 0.08, **(wets or {})}
        rts = {"orch": 2.8, "perc": 1.9, "solo": 2.1, "low": 1.2, **(rts or {})}
        n = int(self.dur * SR)
        out = np.zeros((2, n if self.loop else n + int(self.tail * SR)))
        for i, (name, bus) in enumerate(self.bus.items()):
            b = bus.buf
            if self.loop:
                main = wrap_tail(b, n)
            else:
                main = b
            ir = make_ir(rts[name], pre=0.02 + 0.004 * i, seed=100 + i)
            sig = apply_reverb(main, ir, wets[name], wrap=self.loop)
            out[:, :sig.shape[1]] += sig * gains[name]
        if not self.loop:
            m = int(1.2 * SR)
            out[:, -m:] *= np.linspace(1, 0, m)
        return out


def chord_pad(tr, fn, notes, bar, beats, gain=0.25, vel=0.6, bus="orch", spread=0.5, **kw):
    for i, m in enumerate(notes):
        pan = (i / max(1, len(notes) - 1) - 0.5) * 2 * spread
        tr.add(bus, fn(mtof(m), tr.secs(beats), tr.v(vel), **kw), bar, 0, pan, gain, jit=0.012)


def melody(tr, fn, line, bar, gain=0.4, vel=0.7, bus="solo", pan=0.0, trans=0, **kw):
    for (m, b0, bl) in line:
        tr.add(bus, fn(mtof(m + trans), tr.secs(bl * 0.98), tr.v(vel), **kw), bar, b0, pan, gain, jit=0.006)


# ---------------------------- 1. sunset (menu) ------------------------------
def track_sunset():
    tr = Track(76, 16)
    prog = [(45, [57, 60, 64]), (41, [53, 57, 60]), (48, [55, 60, 64]), (43, [55, 59, 62]),
            (45, [57, 60, 64]), (41, [53, 57, 60]), (38, [50, 57, 62]), (40, [52, 56, 59]),
            (45, [57, 60, 64]), (41, [53, 57, 60]), (48, [55, 60, 64]), (43, [55, 59, 62]),
            (41, [53, 57, 60]), (43, [55, 59, 62]), (45, [57, 60, 64]), (40, [52, 56, 59])]
    mel = {
        8: [(76, 0, 2), (74, 2, 1), (72, 3, 1)], 9: [(69, 0, 2), (72, 2, 2)],
        10: [(76, 0, 1.5), (79, 1.5, .5), (76, 2, 2)], 11: [(74, 0, 2), (71, 2, 2)],
        12: [(72, 0, 2), (69, 2, 1), (72, 3, 1)], 13: [(71, 0, 2), (74, 2, 2)],
        14: [(76, 0, 3), (74, 3, 1)], 15: [(71, 0, 2), (68, 2, 2)]}
    for b, (bass, c) in enumerate(prog):
        c0, c1, c2 = c
        if b < 4:   # sparse intro: quarter-note broken chords
            for i, m in enumerate([c0 - 12, c2 - 12, c1, c2]):
                tr.add("solo", piano(mtof(m), tr.secs(1.6), tr.v(.48 + .05 * i)), b, i, -0.25 + 0.15 * i, 0.55)
        else:       # flowing eighth-note arpeggio
            pat = [c0 - 12, c1 - 12, c2 - 12, c0, c1, c0, c2 - 12, c1 - 12]
            for i, m in enumerate(pat):
                tr.add("solo", piano(mtof(m), tr.secs(1.1), tr.v(.5 + .06 * (i % 4 == 0))), b, i * .5, -0.3 + 0.08 * i, 0.5)
        tr.add("orch", strings(mtof(bass), tr.secs(3.9), 0.55, 0.55, 0.6, 3), b, 0, -0.15, 0.55)
        if b >= 4:
            chord_pad(tr, strings, [c0 - 12, c1 - 12, c2 - 12, c0], b, 3.95, 0.2, 0.5, att=0.7, rel=0.7)
            tr.add("low", bass_note(mtof(bass - 12), tr.secs(3.8), .55, False), b, 0, 0, 0.5)
        if b in mel:
            melody(tr, brass, mel[b], b, 0.5, 0.62, "orch", 0.15, soft=True)
            melody(tr, strings, [(m + 12, s, d) for m, s, d in mel[b]], b, 0.16, 0.55, "orch", -0.2, att=0.25, rel=0.4, voices=3)
        if b >= 12:
            tr.add("perc", bass_drum(.5, True), b, 0, 0, 0.6)
            tr.add("perc", bass_drum(.38, False), b, 2, 0, 0.45)
    tr.add("perc", timpani(mtof(45), 3.0, .7), 8, 0, 0, 0.8)
    tr.add("perc", cymbal(3.0, .45), 8, 0, 0, 0.35)
    tr.add("perc", timpani_roll(mtof(40), 3.0, .25, .85), 15, 1, 0, 0.7)
    return tr.mix({"orch": 1.0, "solo": 0.9}, {"orch": 0.45, "solo": 0.32})


# ---------------------------- 2. pasture (menu) -----------------------------
def track_pasture():
    tr = Track(74, 16)
    G, D, Em, C = (43, [55, 59, 62]), (38, [57, 62, 66]), (40, [55, 59, 64]), (48, [55, 60, 64])
    prog = [G, D, Em, C, G, D, C, D, Em, C, G, D, C, D, G, D]
    fl = {
        "G": [(79, 0, 1.5), (78, 1.5, .5), (76, 2, 2)], "D": [(74, 0, 1), (78, 1, 1), (81, 2, 2)],
        "Em": [(83, 0, 1.5), (81, 1.5, .5), (79, 2, 2)], "C": [(76, 0, 1), (79, 1, 1), (84, 2, 2)]}
    fl2 = {
        "G": [(79, 0, 1), (81, 1, 1), (83, 2, 2)], "D": [(81, 0, 1), (78, 1, 1), (74, 2, 2)],
        "Em": [(79, 0, 1), (83, 1, 1), (86, 2, 2)], "C": [(84, 0, 1.5), (83, 1.5, .5), (79, 2, 2)]}
    names = ["G", "D", "Em", "C", "G", "D", "C", "D", "Em", "C", "G", "D", "C", "D", "G", "D"]
    end = {12: [(76, 0, 2), (79, 2, 2)], 13: [(78, 0, 2), (81, 2, 2)], 14: [(83, 0, 3), (79, 3, 1)], 15: [(78, 0, 2), (74, 2, 2)]}
    for b, (bass, c) in enumerate(prog):
        c0, c1, c2 = c
        seq = [bass, c1, c2, c0 + 12, c2, c1, c2, c1]
        for i, m in enumerate(seq):
            tr.add("solo", pluck(mtof(m), 1.8, tr.v(.62 if i % 4 == 0 else .5)), b, i * .5, -0.25 + 0.03 * i, 0.55)
        if b >= 4:
            chord_pad(tr, strings, [c0 - 12, c1 - 12, c2 - 12], b, 3.95, 0.17, 0.45, att=0.9, rel=0.8, voices=3)
            line = end.get(b) or (fl[names[b]] if b < 8 else fl2[names[b]])
            melody(tr, flute, line, b, 0.5, 0.62, "solo", 0.2)
        if b >= 8:
            tr.add("orch", strings(mtof(bass), tr.secs(3.9), .5, .6, .7, 3), b, 0, 0, 0.45)
            tr.add("perc", bass_drum(.4, False), b, 0, 0, 0.4)
            tr.add("perc", bass_drum(.3, False), b, 2, 0, 0.3)
            tr.add("perc", brush(.4, b), b, 1, 0.2, 0.5)
            tr.add("perc", brush(.4, b + 1), b, 3, 0.2, 0.5)
        if b >= 12:
            for i in range(8):
                tr.add("perc", hat(.32, False, b * 8 + i), b, i * .5, 0.3, 0.45)
    return tr.mix({"solo": 1.0, "orch": 0.9}, {"solo": 0.3, "orch": 0.4})


# ---------------------------- 3. moo-groove (menu) --------------------------
def track_groove():
    tr = Track(100, 16)
    base = [(38, [53, 57, 60, 64]), (46, [57, 62, 65, 69]), (43, [58, 62, 65, 69]), (48, [58, 64, 67, 70])]
    prog = base * 4
    prog[15] = (45, [55, 61, 64, 67])
    motif = [
        [(74, .5, 1), (72, 1.5, .5), (69, 2, 1.5), (72, 3.5, .5)], [(70, .5, 1), (72, 1.5, .5), (74, 2, 1), (77, 3, 1)],
        [(74, .5, 1), (70, 1.5, .5), (67, 2, 1.5), (70, 3.5, .5)], [(72, .5, 1), (70, 1.5, .5), (67, 2, 1), (64, 3, 1)]]
    for b, (r, c) in enumerate(prog):
        nxt = prog[(b + 1) % 16][0]
        third = 3 if b % 4 in (0, 2) else 4
        walk = [r, r + third, r + 7, nxt - 1 if nxt > r else nxt + 1]
        for i, n in enumerate(walk):
            while n > 52:
                n -= 12
            tr.add("low", bass_note(mtof(n), tr.secs(.92), .8 if i == 0 else .65, True), b, i, -0.05, 0.9)
        # piano comping, Charleston rhythm
        for beat, ln in ((0, 1.5), (2.5, 1.0)):
            for j, m in enumerate(c):
                tr.add("solo", piano(mtof(m), tr.secs(ln), tr.v(.5)), b, beat + j * 0.012, -0.3 + 0.1 * j, 0.42)
        # drums
        tr.add("perc", bass_drum(.5, False), b, 0, 0, 0.7)
        tr.add("perc", bass_drum(.4, False), b, 2.5 if b % 2 else 2, 0, 0.6)
        tr.add("perc", brush(.8, b), b, 1, 0.15, 0.8)
        tr.add("perc", brush(.8, b + 7), b, 3, 0.15, 0.8)
        for i in range(4):
            tr.add("perc", hat(.4, False, b * 4 + i), b, i, 0.25, 0.5)
            tr.add("perc", hat(.22, False, b * 4 + i + 40), b, i + 0.66, 0.25, 0.5)
        if 4 <= b < 8 or b >= 12:
            melody(tr, brass, motif[b % 4], b, 0.5, 0.6, "solo", 0.15, soft=True)
        if 8 <= b < 12:
            melody(tr, flute, motif[b % 4], b, 0.5, 0.6, "solo", 0.15, trans=12)
            chord_pad(tr, strings, [c[0] - 5, c[1] - 5, c[2] - 5], b, 3.9, 0.17, 0.5, att=0.5, rel=0.5, voices=3)
    tr.add("perc", cymbal(2.6, .5), 4, 0, 0, 0.3)
    tr.add("perc", cymbal(2.6, .6), 12, 0, 0, 0.35)
    return tr.mix({"low": 1.0}, {"solo": 0.26, "perc": 0.18, "orch": 0.35})


# ---------------------------- 4. cup-march (tournament) ---------------------
def track_march():
    tr = Track(112, 16)
    D, Gc, A, Bm = (38, [50, 54, 57]), (43, [55, 59, 62]), (45, [57, 61, 64]), (47, [54, 59, 62])
    prog = [D, Gc, A, D, Bm, Gc, A, A, D, Gc, A, Bm, Gc, D, A, A]
    lines = {
        0: [(74, 0, 1), (78, 1, 1), (81, 2, 2)], 1: [(79, 0, 1), (83, 1, 1), (79, 2, 2)], 2: [(81, 0, 1), (85, 1, 1), (81, 2, 2)],
        3: [(78, 0, 1.5), (81, 1.5, .5), (86, 2, 2)], 4: [(83, 0, 1.5), (78, 1.5, .5), (74, 2, 2)], 5: [(79, 0, 1), (83, 1, 1), (86, 2, 2)],
        6: [(85, 0, 1.5), (81, 1.5, .5), (76, 2, 2)], 7: [(81, 0, 1), (85, 1, 1), (88, 2, 1), (85, 3, 1)],
        8: [(86, 0, 2), (81, 2, 2)], 9: [(83, 0, 2), (79, 2, 2)], 10: [(85, 0, 2), (81, 2, 2)], 11: [(83, 0, 1.5), (86, 1.5, .5), (90, 2, 2)],
        12: [(86, 0, 1.5), (83, 1.5, .5), (79, 2, 2)], 13: [(86, 0, 1), (90, 1, 1), (93, 2, 2)], 14: [(88, 0, 1), (85, 1, 1), (81, 2, 2)], 15: [(81, 0, 1), (85, 1, 1), (88, 2, 2)]}
    for b, (r, c) in enumerate(prog):
        # marching snare
        hits = [1, 0, 1, 1, 1, 0, 1, 0]
        for i, h in enumerate(hits):
            if h and b >= 0:
                tr.add("perc", snare(tr.v(.7 if i % 2 == 0 else .5), True, i + 1), b, i * .5, 0.25, 0.7)
        tr.add("perc", bass_drum(.8, False), b, 0, 0, 0.75)
        tr.add("perc", bass_drum(.7, False), b, 2, 0, 0.7)
        tr.add("perc", timpani(mtof(r + 12), 1.8, tr.v(.8)), b, 0, -0.2, 0.7)
        tr.add("perc", timpani(mtof(r + 19), 1.2, tr.v(.65)), b, 2, 0.2, 0.55)
        # brass chorale + low brass
        chord_pad(tr, brass, [c[0] - 12, c[1] - 12, c[2] - 12], b, 3.7, 0.38, 0.72, "orch", 0.55, soft=True)
        tr.add("low", bass_note(mtof(r), tr.secs(1.8), .8, False), b, 0, 0, 0.7)
        tr.add("low", bass_note(mtof(r), tr.secs(1.8), .75, False), b, 2, 0, 0.65)
        melody(tr, brass, lines[b], b, 0.55, 0.9 if b >= 8 else 0.78, "orch", 0.0)
        if b >= 4:
            for i in range(8):  # driving string eighths
                tr.add("orch", strings(mtof(c[i % 3] + 12), tr.secs(.42), .6, 0.01, 0.12, 2), b, i * .5, -0.35 + 0.1 * (i % 6), 0.22)
    tr.add("perc", cymbal(3.0, .8), 0, 0, 0, 0.5)
    tr.add("perc", cymbal(3.0, .9), 8, 0, 0, 0.55)
    tr.add("perc", snare_roll(2.0, .3, .95), 7, 2, 0, 0.6)
    tr.add("perc", snare_roll(2.0, .3, .95), 15, 2, 0, 0.6)
    return tr.mix({"orch": 1.0, "perc": 0.95}, {"orch": 0.36, "perc": 0.26})


# ---------------------------- 5. grand-finale (final) -----------------------
def track_finale():
    tr = Track(84, 12)
    prog = [(38, [50, 53, 57]), (46, [53, 58, 62]), (41, [53, 57, 60]), (48, [55, 60, 64]),
            (38, [50, 53, 57]), (46, [53, 58, 62]), (43, [50, 55, 58]), (45, [52, 57, 61]),
            (38, [50, 53, 57]), (46, [53, 58, 62]), (48, [55, 60, 64]), (38, [50, 53, 57])]
    mel = {4: [(74, 0, 2), (81, 2, 2)], 5: [(82, 0, 2), (81, 2, 1), (77, 3, 1)], 6: [(79, 0, 2), (77, 2, 1), (74, 3, 1)],
           7: [(73, 0, 1), (76, 1, 1), (81, 2, 2)], 8: [(86, 0, 2), (81, 2, 2)], 9: [(82, 0, 2), (77, 2, 2)],
           10: [(79, 0, 2), (84, 2, 2)], 11: [(81, 0, 3), (77, 3, 1)]}
    for b, (r, c) in enumerate(prog):
        # string ostinato (intro builds to full)
        for i in range(8):
            m = [c[0], c[1], c[2], c[1]][i % 4] + (12 if i % 2 else 0)
            tr.add("orch", strings(mtof(m), tr.secs(.4), .6, 0.01, 0.1, 2), b, i * .5, -0.3 + 0.08 * i, 0.2 if b < 4 else 0.28)
        tr.add("orch", strings(mtof(r), tr.secs(3.95), .6, .5, .7, 4), b, 0, 0, 0.55)
        tr.add("low", bass_note(mtof(r - 12), tr.secs(3.9), .7, False), b, 0, 0, 0.6)
        if b >= 2:
            chord_pad(tr, choir, [c[0], c[1], c[2], c[0] + 12], b, 3.95, 0.25, 0.7 if b < 8 else 0.85, "orch", 0.45, vowel="a", att=0.7, rel=0.8, voices=3)
        tr.add("perc", timpani(mtof(r + 12), 2.0, tr.v(.85)), b, 0, -0.2, 0.75)
        tr.add("perc", timpani(mtof(r + 12), 1.4, tr.v(.7)), b, 2.5, 0.2, 0.6)
        if b >= 4:
            chord_pad(tr, brass, [c[0] - 12, c[1] - 12, c[2] - 12], b, 3.8, 0.4, 0.78 if b < 8 else 0.92, "orch", 0.5, soft=False)
            tr.add("perc", bass_drum(.85, True), b, 0, 0, 0.7)
        if b in mel:
            melody(tr, choir, mel[b], b, 0.34, 0.9, "orch", 0.0, vowel="o", att=0.15, rel=0.5, voices=3)
            melody(tr, strings, [(m + 12, s, d) for m, s, d in mel[b]], b, 0.26, 0.8, "orch", -0.2, att=0.12, rel=0.4, voices=3)
            if b >= 8:
                melody(tr, brass, mel[b], b, 0.5, 0.95, "orch", 0.15)
    for b in (4, 8):
        tr.add("perc", cymbal(3.4, .95, b), b, 0, 0, 0.6)
    tr.add("perc", snare_roll(2.6, .25, .95), 7, 1, 0, 0.6)
    tr.add("perc", riser(2.6, .7), 7, 1, 0, 0.6)
    tr.add("perc", timpani_roll(mtof(50), 3.0, .3, .95), 3, 1, 0, 0.6)
    return tr.mix({"orch": 1.0, "perc": 0.95}, {"orch": 0.45, "perc": 0.28}, {"orch": 3.0})


# ---------------------------- 6. rush (match) -------------------------------
def track_rush():
    tr = Track(140, 16)
    em, cc, gg, dd, bb = (40, [52, 55, 59]), (48, [55, 60, 64]), (43, [55, 59, 62]), (38, [50, 54, 57]), (47, [51, 59, 63])
    prog = [em, cc, gg, dd] * 3 + [em, cc, dd, bb]
    mel = {8: [(76, 0, 1), (79, 1, 1), (83, 2, 2)], 9: [(79, 0, 1), (84, 1, 1), (88, 2, 2)], 10: [(83, 0, 1), (79, 1, 1), (86, 2, 2)],
           11: [(81, 0, 1), (78, 1, 1), (74, 2, 2)], 12: [(88, 0, 1), (86, 1, 1), (83, 2, 2)], 13: [(84, 0, 1), (79, 1, 1), (76, 2, 2)],
           14: [(86, 0, 1), (81, 1, 1), (78, 2, 2)], 15: [(83, 0, 2), (78, 2, 2)]}
    for b, (r, c) in enumerate(prog):
        # staccato 16th-note string ostinato
        for i in range(16):
            m = [r + 12, r + 12, c[2], r + 12][i % 4] + (12 if i % 8 == 7 else 0)
            tr.add("orch", strings(mtof(m), tr.secs(.27), .65, 0.004, 0.06, 2), b, i * .25, -0.4 + 0.05 * (i % 16), 0.3 if b < 4 else 0.36)
        tr.add("low", bass_note(mtof(r), tr.secs(.9), .85, False), b, 0, 0, 0.75)
        tr.add("low", bass_note(mtof(r), tr.secs(.9), .8, False), b, 2.5, 0, 0.7)
        if b >= 2:
            for beat in range(4):
                tr.add("perc", bass_drum(.8, False), b, beat, 0, 0.7)
            for i in range(8):
                tr.add("perc", hat(.45, False, b * 8 + i), b, i * .5, 0.3, 0.5)
        if b >= 4:
            for beat in (1, 3):
                tr.add("perc", snare(tr.v(.85), True, b), b, beat, 0.1, 0.8)
            tr.add("orch", brass(mtof(r + 12), tr.secs(.9), tr.v(.95)), b, 0, 0, 0.5)
            tr.add("orch", brass(mtof(r + 12), tr.secs(.9), tr.v(.9)), b, 2.5, 0, 0.45)
        if b in mel:
            melody(tr, brass, mel[b], b, 0.5, 0.95, "orch", 0.0)
            melody(tr, strings, [(m, s, d) for m, s, d in mel[b]], b, 0.2, 0.8, "orch", -0.2, att=0.05, rel=0.3, voices=2)
        if b % 4 == 0:
            tr.add("perc", cymbal(2.6, .75, b), b, 0, 0, 0.45)
        if b % 4 == 3:
            tr.add("perc", timpani_roll(mtof(r + 12), 1.4, .4, .95, 16), b, 2, 0, 0.5)
    tr.add("perc", riser(3.0, .8), 6, 2, 0, 0.6)
    return tr.mix({"orch": 1.0, "perc": 1.0}, {"orch": 0.3, "perc": 0.2}, {"orch": 2.2, "perc": 1.5})


# ---------------------------- 7. ceremony-opening ---------------------------
CEREMONY_OPEN_CUES = {"reveal": 4.8, "theme": 4.8, "end": 24.0}


def track_ceremony_open():
    tr = Track(100, 10, tail=4.5, loop=False)
    prog = {2: (38, [50, 54, 57]), 3: (35, [47, 54, 59]), 4: (43, [50, 55, 59]), 5: (45, [52, 57, 61]),
            6: (38, [50, 54, 57]), 7: (43, [50, 55, 59]), 8: (45, [52, 57, 61]), 9: (38, [50, 54, 57])}
    mel = {2: [(81, 0, 1.5), (78, 1.5, .5), (74, 2, 2)], 3: [(83, 0, 1.5), (81, 1.5, .5), (78, 2, 2)], 4: [(79, 0, 1.5), (83, 1.5, .5), (86, 2, 2)],
           5: [(85, 0, 1.5), (81, 1.5, .5), (88, 2, 2)], 6: [(86, 0, 2), (81, 2, 2)], 7: [(83, 0, 2), (79, 2, 2)],
           8: [(85, 0, 1), (88, 1, 1), (85, 2, 2)], 9: [(86, 0, 4)]}
    # bars 0-1: dark drone, tremolo build
    for f in (38, 45):
        tr.add("orch", strings(mtof(f), tr.secs(8.0), .5, 2.5, 1.0, 4), 0, 0, 0, 0.55)
    tr.add("orch", strings(mtof(62), tr.secs(8.0), .45, 3.0, 1.0, 3), 0, 0, 0.2, 0.25)
    tr.add("perc", riser(4.6, .85, 12), 0, 0.2, 0, 0.7)
    tr.add("perc", timpani_roll(mtof(50), 2.4, .15, .9, 12), 1, 1.6, 0, 0.7)
    tr.add("perc", snare_roll(1.8, .2, .9), 1, 2.2, 0, 0.55)
    # reveal
    tr.add("perc", cymbal(4.0, 1.0, 21), 2, 0, 0, 0.75)
    tr.add("perc", bass_drum(1.0, True), 2, 0, 0, 0.9)
    tr.add("perc", timpani(mtof(50), 3.0, 1.0), 2, 0, 0, 0.9)
    for b, (r, c) in prog.items():
        chord_pad(tr, brass, [c[0] - 12, c[1] - 12, c[2] - 12, c[0]], b, 3.8, 0.38, 0.9, "orch", 0.55)
        tr.add("orch", strings(mtof(r), tr.secs(3.95), .7, .35, .6, 4), b, 0, 0, 0.55)
        chord_pad(tr, strings, [c[0], c[1], c[2], c[0] + 12], b, 3.95, 0.24, 0.75, "orch", 0.5, att=0.3, rel=0.6)
        if b >= 4:
            chord_pad(tr, choir, [c[0], c[1], c[2], c[0] + 12], b, 3.95, 0.3, 0.85, "orch", 0.5, vowel="a", att=0.6, rel=0.8, voices=3)
        tr.add("low", bass_note(mtof(r - 12), tr.secs(3.9), .8, False), b, 0, 0, 0.6)
        tr.add("perc", timpani(mtof(r + 12), 2.0, tr.v(.85)), b, 0, -0.2, 0.7)
        tr.add("perc", timpani(mtof(r + 12), 1.4, tr.v(.7)), b, 2, 0.2, 0.55)
        if b >= 4:
            for i, h in enumerate([1, 0, 1, 1, 1, 0, 1, 0]):
                if h:
                    tr.add("perc", snare(tr.v(.6 if i % 2 else .75), True, i + b), b, i * .5, 0.25, 0.5)
            tr.add("perc", bass_drum(.8, False), b, 0, 0, 0.6)
            tr.add("perc", bass_drum(.7, False), b, 2, 0, 0.55)
        if b in mel:
            melody(tr, brass, mel[b], b, 0.55, 0.95, "orch", 0.0)
            melody(tr, strings, [(m, s, d) for m, s, d in mel[b]], b, 0.28, 0.85, "orch", -0.25, att=0.1, rel=0.4, voices=3)
    tr.add("perc", cymbal(3.6, .95, 33), 6, 0, 0, 0.5)
    tr.add("perc", snare_roll(1.8, .3, .95), 8, 2, 0, 0.6)
    tr.add("perc", cymbal(5.0, 1.0, 44), 9, 0, 0, 0.75)
    tr.add("perc", bass_drum(1.0, True), 9, 0, 0, 0.9)
    tr.add("perc", timpani(mtof(50), 3.0, 1.0), 9, 0, 0, 0.9)
    return tr.mix({"orch": 1.0, "perc": 0.95}, {"orch": 0.42, "perc": 0.3}, {"orch": 3.2})


# ---------------------------- 8. ceremony-closing ---------------------------
CEREMONY_CLOSE_CUES = {"theme": 10.9, "peak": 21.8, "end": 30.0}


def track_ceremony_close():
    tr = Track(88, 11, tail=4.5, loop=False)
    F, Dm, Bb, Cc = (41, [53, 57, 60]), (38, [50, 53, 57]), (46, [53, 58, 62]), (48, [55, 60, 64])
    prog = [F, Dm, Bb, Cc, F, Dm, Bb, Cc, F, Bb, F]
    mel = {4: [(77, 0, 1.5), (79, 1.5, .5), (81, 2, 2)], 5: [(86, 0, 1.5), (84, 1.5, .5), (81, 2, 2)], 6: [(82, 0, 1.5), (84, 1.5, .5), (86, 2, 2)],
           7: [(88, 0, 1), (86, 1, 1), (84, 2, 2)], 8: [(89, 0, 2), (86, 2, 2)], 9: [(86, 0, 2), (82, 2, 2)], 10: [(89, 0, 4)]}
    for b, (r, c) in enumerate(prog):
        if b < 4:   # tender opening: piano + strings
            for i, m in enumerate([c[0] - 12, c[1] - 12, c[2] - 12, c[0], c[2] - 12, c[1]]):
                tr.add("solo", piano(mtof(m), tr.secs(2.0), tr.v(.5)), b, i * .66, -0.3 + 0.1 * i, 0.5)
            chord_pad(tr, strings, [c[0] - 12, c[1] - 12, c[2] - 12], b, 3.95, 0.2 + 0.03 * b, 0.5, "orch", 0.5, att=0.9, rel=0.8, voices=3)
        else:
            for i in range(8):
                m = [c[0] - 12, c[1] - 12, c[2] - 12, c[0], c[2] - 12, c[1], c[2], c[1]][i]
                tr.add("solo", piano(mtof(m), tr.secs(1.0), tr.v(.5)), b, i * .5, -0.3 + 0.08 * i, 0.38)
            chord_pad(tr, strings, [c[0], c[1], c[2], c[0] + 12], b, 3.95, 0.26, 0.8, "orch", 0.5, att=0.25, rel=0.6)
            chord_pad(tr, choir, [c[0], c[1], c[2], c[0] + 12], b, 3.95, 0.3, 0.9, "orch", 0.5, vowel="a", att=0.6, rel=0.8, voices=3)
            chord_pad(tr, brass, [c[0] - 12, c[1] - 12, c[2] - 12], b, 3.8, 0.34, 0.85 if b < 8 else 1.0, "orch", 0.5, soft=(b < 6))
            tr.add("perc", timpani(mtof(r + 12), 2.0, tr.v(.85)), b, 0, -0.2, 0.7)
            tr.add("perc", timpani(mtof(r + 12), 1.4, tr.v(.7)), b, 2.5, 0.2, 0.55)
            tr.add("perc", bass_drum(.85, True if b % 2 == 0 else False), b, 0, 0, 0.65)
        tr.add("orch", strings(mtof(r), tr.secs(3.95), .6, .6, .7, 4), b, 0, 0, 0.55)
        tr.add("low", bass_note(mtof(r - 12), tr.secs(3.9), .7, False), b, 0, 0, 0.55)
        if b in mel:
            melody(tr, choir, mel[b], b, 0.34, 0.95, "orch", 0.0, vowel="o", att=0.12, rel=0.5, voices=3)
            melody(tr, brass, mel[b], b, 0.5, 0.95, "orch", 0.12, soft=(b < 6))
            melody(tr, strings, [(m + 12, s, d) for m, s, d in mel[b]], b, 0.22, 0.8, "orch", -0.2, att=0.1, rel=0.4, voices=3)
    tr.add("perc", timpani_roll(mtof(53), 3.2, .2, .95, 12), 3, 0.5, 0, 0.7)
    tr.add("perc", cymbal(4.0, 1.0, 55), 4, 0, 0, 0.7)
    tr.add("perc", cymbal(3.6, .9, 56), 8, 0, 0, 0.6)
    tr.add("perc", snare_roll(2.2, .25, .95), 7, 1.5, 0, 0.55)
    tr.add("perc", cymbal(5.0, 1.0, 57), 10, 0, 0, 0.75)
    tr.add("perc", bass_drum(1.0, True), 10, 0, 0, 0.95)
    tr.add("perc", timpani(mtof(53), 3.0, 1.0), 10, 0, 0, 0.9)
    return tr.mix({"orch": 1.0, "perc": 0.95}, {"orch": 0.42, "perc": 0.3, "solo": 0.3}, {"orch": 3.2})


MUSIC_JOBS = {
    "sunset.mp3": (track_sunset, -14.2),
    "pasture.mp3": (track_pasture, -14.2),
    "moo-groove.mp3": (track_groove, -14.2),
    "cup-march.mp3": (track_march, -14.0),
    "grand-finale.mp3": (track_finale, -14.0),
    "rush.mp3": (track_rush, -14.0),
    "ceremony-opening.mp3": (track_ceremony_open, -14.0),
    "ceremony-closing.mp3": (track_ceremony_close, -14.0),
}


def build_music(names=None):
    for fname, (fn, lufs) in MUSIC_JOBS.items():
        if names and fname.replace(".mp3", "") not in names and fname not in names:
            continue
        print("rendering", fname, flush=True)
        finalize_music(fn(), fname, target_lufs=lufs)


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "all"
    rest = sys.argv[2:]
    if mode in ("music", "all"):
        build_music(rest or None)
    if mode in ("sfx", "all"):
        build_sfx(rest or None)
