// WebAudio 程序化音效与氛围音乐，无外部音频文件。

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.ambientNodes = [];
    this.battleStarted = false;
    this.noiseBuf = null;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.8;
    this.master.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.9;
    this.sfxGain.connect(this.master);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.45;
    this.musicGain.connect(this.master);

    // 噪声缓冲
    const len = this.ctx.sampleRate * 2;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    this.startAmbient();
  }

  noiseSource() {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    return src;
  }

  // 深邃黑暗的氛围垫
  startAmbient() {
    const ctx = this.ctx;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 220;
    filter.Q.value = 2;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.05;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 60;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const oscs = [55, 55.6, 82.5, 110].map((f, i) => {
      const o = ctx.createOscillator();
      o.type = i < 2 ? "sawtooth" : "triangle";
      o.frequency.value = f;
      o.detune.value = (i - 1.5) * 9;
      const g = ctx.createGain();
      g.gain.value = i < 2 ? 0.05 : 0.035;
      o.connect(g);
      g.connect(filter);
      o.start();
      return o;
    });

    const noise = this.noiseSource();
    const nFilter = ctx.createBiquadFilter();
    nFilter.type = "lowpass";
    nFilter.frequency.value = 120;
    const nGain = ctx.createGain();
    nGain.gain.value = 0.02;
    noise.connect(nFilter);
    nFilter.connect(nGain);
    nGain.connect(filter);
    noise.start();

    filter.connect(this.musicGain);
    this.ambientNodes = [...oscs, lfo, noise, filter, lfoGain, nFilter, nGain];
  }

  // 战斗中轻量的鼓点脉冲
  startBattlePulse() {
    if (this.battleStarted) return;
    this.battleStarted = true;
    const ctx = this.ctx;
    const pulse = () => {
      if (!this.battleStarted) return;
      const now = ctx.currentTime;
      for (let i = 0; i < 4; i++) {
        const t = now + i * 0.28;
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.setValueAtTime(90, t);
        o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(i === 0 ? 0.22 : 0.1, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
        o.connect(g);
        g.connect(this.musicGain);
        o.start(t);
        o.stop(t + 0.18);
      }
      this.pulseTimer = setTimeout(pulse, 1120);
    };
    pulse();
  }

  stopBattlePulse() {
    this.battleStarted = false;
    if (this.pulseTimer) clearTimeout(this.pulseTimer);
  }

  // 标题界面的凄凉小调（类似魂系捏脸音乐的感觉）
  playTitleTheme() {
    const ctx = this.ctx;
    const notes = [261.63, 329.63, 392.0, 329.63, 293.66, 349.23, 440.0, 349.23];
    const playNote = (freq, time, dur, vel) => {
      const o = ctx.createOscillator();
      o.type = "triangle";
      o.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, time);
      g.gain.exponentialRampToValueAtTime(vel, time + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
      const delay = ctx.createDelay(1);
      delay.delayTime.value = 0.36;
      const fb = ctx.createGain();
      fb.gain.value = 0.3;
      delay.connect(fb);
      fb.connect(delay);
      const wet = ctx.createGain();
      wet.gain.value = 0.5;
      delay.connect(wet);
      o.connect(g);
      g.connect(this.musicGain);
      g.connect(delay);
      wet.connect(this.musicGain);
      o.start(time);
      o.stop(time + dur + 0.5);
    };
    const start = ctx.currentTime + 0.05;
    notes.forEach((n, i) => {
      playNote(n, start + i * 0.55, 1.5, i % 2 === 0 ? 0.09 : 0.06);
    });
  }

  playVictory() {
    const ctx = this.ctx;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = "triangle";
      o.frequency.value = f;
      const g = ctx.createGain();
      const t = ctx.currentTime + i * 0.16;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.12, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
      o.connect(g);
      g.connect(this.musicGain);
      o.start(t);
      o.stop(t + 1.5);
    });
  }

  playDeath() {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(180, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 1.1);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(900, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 1.0);
    o.connect(filter);
    filter.connect(g);
    g.connect(this.musicGain);
    o.start();
    o.stop(ctx.currentTime + 1.3);
  }

  sfx(kind, opts = {}) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const out = this.sfxGain;

    const env = (g, t, a, peak, d) => {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + a);
      g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    };

    switch (kind) {
      case "whoosh": {
        const src = this.noiseSource();
        const f = ctx.createBiquadFilter();
        f.type = "bandpass";
        f.Q.value = 1.2;
        f.frequency.setValueAtTime(500, now);
        f.frequency.exponentialRampToValueAtTime(2600, now + 0.18);
        const g = ctx.createGain();
        env(g, now, 0.03, 0.22, 0.16);
        src.connect(f); f.connect(g); g.connect(out);
        src.start(now); src.stop(now + 0.22);
        break;
      }
      case "hit": {
        const o = ctx.createOscillator();
        o.type = "triangle";
        o.frequency.setValueAtTime(160, now);
        o.frequency.exponentialRampToValueAtTime(70, now + 0.09);
        const g = ctx.createGain();
        env(g, now, 0.005, 0.4, 0.1);
        o.connect(g); g.connect(out);
        o.start(now); o.stop(now + 0.13);
        const n = this.noiseSource();
        const nf = ctx.createBiquadFilter();
        nf.type = "lowpass"; nf.frequency.value = 1400;
        const ng = ctx.createGain();
        env(ng, now, 0.004, 0.18, 0.05);
        n.connect(nf); nf.connect(ng); ng.connect(out);
        n.start(now); n.stop(now + 0.08);
        break;
      }
      case "heavyHit": {
        const o = ctx.createOscillator();
        o.type = "square";
        o.frequency.setValueAtTime(110, now);
        o.frequency.exponentialRampToValueAtTime(40, now + 0.2);
        const g = ctx.createGain();
        env(g, now, 0.005, 0.5, 0.2);
        o.connect(g); g.connect(out);
        o.start(now); o.stop(now + 0.25);
        break;
      }
      case "stagger": {
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.setValueAtTime(700, now);
        o.frequency.exponentialRampToValueAtTime(220, now + 0.22);
        const g = ctx.createGain();
        env(g, now, 0.01, 0.28, 0.25);
        o.connect(g); g.connect(out);
        o.start(now); o.stop(now + 0.3);
        break;
      }
      case "clash": {
        const o = ctx.createOscillator();
        o.type = "triangle";
        o.frequency.setValueAtTime(880, now);
        o.frequency.exponentialRampToValueAtTime(440, now + 0.25);
        const g = ctx.createGain();
        env(g, now, 0.002, 0.35, 0.28);
        o.connect(g); g.connect(out);
        o.start(now); o.stop(now + 0.3);
        const n = this.noiseSource();
        const nf = ctx.createBiquadFilter();
        nf.type = "highpass"; nf.frequency.value = 2000;
        const ng = ctx.createGain();
        env(ng, now, 0.002, 0.15, 0.2);
        n.connect(nf); nf.connect(ng); ng.connect(out);
        n.start(now); n.stop(now + 0.25);
        break;
      }
      case "flask": {
        for (let i = 0; i < 3; i++) {
          const o = ctx.createOscillator();
          o.type = "sine";
          const t = now + i * 0.09;
          o.frequency.setValueAtTime(300 + Math.random() * 200, t);
          o.frequency.exponentialRampToValueAtTime(120 + Math.random() * 60, t + 0.08);
          const g = ctx.createGain();
          env(g, t, 0.01, 0.16, 0.08);
          o.connect(g); g.connect(out);
          o.start(t); o.stop(t + 0.1);
        }
        break;
      }
      case "heal": {
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.setValueAtTime(520, now);
        o.frequency.exponentialRampToValueAtTime(780, now + 0.25);
        const g = ctx.createGain();
        env(g, now, 0.02, 0.18, 0.3);
        o.connect(g); g.connect(out);
        o.start(now); o.stop(now + 0.35);
        break;
      }
      case "dodge": {
        const n = this.noiseSource();
        const f = ctx.createBiquadFilter();
        f.type = "bandpass"; f.Q.value = 0.8;
        f.frequency.setValueAtTime(900, now);
        f.frequency.exponentialRampToValueAtTime(200, now + 0.2);
        const g = ctx.createGain();
        env(g, now, 0.01, 0.2, 0.2);
        n.connect(f); f.connect(g); g.connect(out);
        n.start(now); n.stop(now + 0.25);
        break;
      }
      case "jump": {
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.setValueAtTime(180, now);
        o.frequency.exponentialRampToValueAtTime(360, now + 0.15);
        const g = ctx.createGain();
        env(g, now, 0.02, 0.08, 0.15);
        o.connect(g); g.connect(out);
        o.start(now); o.stop(now + 0.2);
        break;
      }
      case "land": {
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.setValueAtTime(120, now);
        o.frequency.exponentialRampToValueAtTime(50, now + 0.12);
        const g = ctx.createGain();
        env(g, now, 0.004, 0.3, 0.12);
        o.connect(g); g.connect(out);
        o.start(now); o.stop(now + 0.15);
        break;
      }
      case "roar": {
        const o = ctx.createOscillator();
        o.type = "sawtooth";
        o.frequency.setValueAtTime(70, now);
        o.frequency.exponentialRampToValueAtTime(140, now + 0.3);
        o.frequency.exponentialRampToValueAtTime(55, now + 0.7);
        const f = ctx.createBiquadFilter();
        f.type = "lowpass"; f.frequency.value = 500;
        f.Q.value = 4;
        const g = ctx.createGain();
        env(g, now, 0.04, 0.5, 0.8);
        o.connect(f); f.connect(g); g.connect(out);
        o.start(now); o.stop(now + 0.9);
        break;
      }
      case "meteor": {
        const n = this.noiseSource();
        const f = ctx.createBiquadFilter();
        f.type = "bandpass"; f.Q.value = 2;
        f.frequency.setValueAtTime(300, now);
        f.frequency.exponentialRampToValueAtTime(2600, now + 0.5);
        const g = ctx.createGain();
        env(g, now, 0.05, 0.25, 0.5);
        n.connect(f); f.connect(g); g.connect(out);
        n.start(now); n.stop(now + 0.6);
        break;
      }
      case "wave": {
        const o = ctx.createOscillator();
        o.type = "sawtooth";
        o.frequency.setValueAtTime(60, now);
        o.frequency.exponentialRampToValueAtTime(180, now + 0.4);
        const f = ctx.createBiquadFilter();
        f.type = "lowpass";
        f.frequency.setValueAtTime(300, now);
        f.frequency.exponentialRampToValueAtTime(1600, now + 0.4);
        const g = ctx.createGain();
        env(g, now, 0.02, 0.35, 0.5);
        o.connect(f); f.connect(g); g.connect(out);
        o.start(now); o.stop(now + 0.55);
        break;
      }
      case "charge": {
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.setValueAtTime(220, now);
        o.frequency.exponentialRampToValueAtTime(880, now + 0.9);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(0.1, now + 0.9);
        o.connect(g); g.connect(out);
        o.start(now); o.stop(now + 1.0);
        break;
      }
      case "lock": {
        const o = ctx.createOscillator();
        o.type = "triangle";
        o.frequency.setValueAtTime(1180, now);
        o.frequency.exponentialRampToValueAtTime(980, now + 0.08);
        const g = ctx.createGain();
        env(g, now, 0.005, 0.12, 0.08);
        o.connect(g); g.connect(out);
        o.start(now); o.stop(now + 0.1);
        break;
      }
      case "ui": {
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.setValueAtTime(660, now);
        const g = ctx.createGain();
        env(g, now, 0.005, 0.08, 0.06);
        o.connect(g); g.connect(out);
        o.start(now); o.stop(now + 0.08);
        break;
      }
      case "select": {
        [523.25, 659.25].forEach((f, i) => {
          const o = ctx.createOscillator();
          o.type = "triangle";
          o.frequency.value = f;
          const g = ctx.createGain();
          const t = now + i * 0.08;
          env(g, t, 0.008, 0.12, 0.12);
          o.connect(g); g.connect(out);
          o.start(t); o.stop(t + 0.15);
        });
        break;
      }
      case "bossDown": {
        const o = ctx.createOscillator();
        o.type = "triangle";
        o.frequency.setValueAtTime(400, now);
        o.frequency.exponentialRampToValueAtTime(90, now + 0.5);
        const g = ctx.createGain();
        env(g, now, 0.02, 0.4, 0.5);
        o.connect(g); g.connect(out);
        o.start(now); o.stop(now + 0.6);
        break;
      }
      case "swordDraw": {
        const n = this.noiseSource();
        const f = ctx.createBiquadFilter();
        f.type = "highpass"; f.frequency.value = 1800;
        const g = ctx.createGain();
        env(g, now, 0.02, 0.14, 0.3);
        n.connect(f); f.connect(g); g.connect(out);
        n.start(now); n.stop(now + 0.35);
        break;
      }
      default:
        break;
    }
  }
}

export const audio = new AudioEngine();
