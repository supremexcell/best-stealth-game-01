// Synthesised sound only: every effect is a WebAudio oscillator or noise
// buffer built in code. No audio files, no network. The context is created
// lazily on the first user gesture; until then every call is a safe no-op,
// so headless screenshots never throw.
export function createAudio() {
  let ctx = null;
  let master = null;
  let padNodes = null;
  let muted = false;

  function ensure() {
    if (ctx) return true;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;
      ctx = new AudioCtx();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
      return true;
    } catch {
      return false;
    }
  }

  function tone(freq, dur, type, gainValue, when = 0, slideTo = null) {
    if (muted || !ensure() || ctx.state === 'suspended') return;
    try {
      const t0 = ctx.currentTime + when;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(gainValue, t0 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(master);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    } catch {
      // Audio must never break the game.
    }
  }

  function noiseBurst(dur, gainValue, filterFreq) {
    if (muted || !ensure() || ctx.state === 'suspended') return;
    try {
      const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
      const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = filterFreq;
      const gain = ctx.createGain();
      gain.gain.value = gainValue;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      src.start();
    } catch {
      // Audio must never break the game.
    }
  }

  return {
    unlock() {
      if (ensure() && ctx.state === 'suspended') ctx.resume().catch(() => {});
    },
    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.5;
      return muted;
    },
    isMuted() {
      return muted;
    },
    // Soft floor tick; louder when running, softer when sneaking.
    footstep(sneaking) {
      noiseBurst(0.05, sneaking ? 0.04 : 0.09, sneaking ? 500 : 900);
    },
    coinClink() {
      tone(2093, 0.18, 'sine', 0.16);
      tone(2637, 0.28, 'sine', 0.12, 0.05);
    },
    coinThrow() {
      tone(1200, 0.12, 'sine', 0.05, 0, 2400);
    },
    pickup() {
      tone(880, 0.12, 'sine', 0.14);
      tone(1318, 0.2, 'sine', 0.14, 0.08);
      tone(1760, 0.26, 'sine', 0.1, 0.16);
    },
    alert() {
      tone(220, 0.35, 'sawtooth', 0.14, 0, 440);
      tone(330, 0.3, 'sawtooth', 0.1, 0.12, 660);
    },
    caught() {
      tone(196, 0.5, 'sawtooth', 0.16, 0, 98);
      noiseBurst(0.25, 0.12, 400);
    },
    levelClear() {
      [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.3, 'triangle', 0.12, i * 0.11));
    },
    win() {
      [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.45, 'triangle', 0.11, i * 0.13));
    },
    // A quiet two-note pad that hums under the game once unlocked.
    startAmbient() {
      if (!ensure() || padNodes) return;
      try {
        const g = ctx.createGain();
        g.gain.value = 0.035;
        g.connect(master);
        const oscs = [110, 164.81, 220].map((f) => {
          const o = ctx.createOscillator();
          o.type = 'sine';
          o.frequency.value = f;
          o.connect(g);
          o.start();
          return o;
        });
        padNodes = { gain: g, oscs };
      } catch {
        // Ambient is decoration; silence is fine.
      }
    },
  };
}
