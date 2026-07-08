let enabled = true;
let ctx: AudioContext | null = null;

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function setSoundEnabled(v: boolean) {
  enabled = v;
}

function tone(freq: number, dur = 0.08, type: OscillatorType = "sine", vol = 0.08, delay = 0) {
  if (!enabled) return;
  const ac = getCtx();
  if (!ac) return;
  const o = ac.createOscillator();
  const g = ac.createGain();
  const start = ac.currentTime + delay;
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(vol, start + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(ac.destination);
  o.start(start);
  o.stop(start + dur + 0.03);
}

function noiseBurst(dur = 0.45, vol = 0.25, delay = 0) {
  if (!enabled) return;
  const ac = getCtx();
  if (!ac) return;
  const start = ac.currentTime + delay;
  const buffer = ac.createBuffer(1, Math.max(1, Math.floor(ac.sampleRate * dur)), ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const fade = 1 - i / data.length;
    data[i] = (Math.random() * 2 - 1) * fade;
  }
  const src = ac.createBufferSource();
  const filter = ac.createBiquadFilter();
  const g = ac.createGain();
  src.buffer = buffer;
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1800, start);
  filter.frequency.exponentialRampToValueAtTime(120, start + dur);
  g.gain.setValueAtTime(vol, start);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  src.connect(filter).connect(g).connect(ac.destination);
  src.start(start);
  src.stop(start + dur + 0.02);
}

export const sounds = {
  prime: () => {
    if (enabled) getCtx();
  },
  reveal: () => tone(560, 0.07, "sine", 0.08),
  flag: () => tone(760, 0.09, "triangle", 0.1),
  win: () => {
    [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, 0.22, "triangle", 0.16, i * 0.075));
    [523, 659, 784, 1047].forEach((f) => tone(f, 0.7, "sine", 0.055, 0.5));
    noiseBurst(0.22, 0.08, 0.12);
  },
  explosion: () => {
    noiseBurst(0.72, 0.42);
    tone(92, 0.58, "sawtooth", 0.26);
    tone(48, 0.78, "sine", 0.28);
    [240, 170, 105, 72].forEach((f, i) => tone(f, 0.24, "square", 0.12, i * 0.055));
  },
  lose: () => sounds.explosion(),
  click: () => tone(420, 0.05, "sine", 0.06),
};