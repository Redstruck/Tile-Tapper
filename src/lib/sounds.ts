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
  return ctx;
}

export function setSoundEnabled(v: boolean) {
  enabled = v;
}

function tone(freq: number, dur = 0.08, type: OscillatorType = "sine", vol = 0.08) {
  if (!enabled) return;
  const ac = getCtx();
  if (!ac) return;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = vol;
  o.connect(g).connect(ac.destination);
  o.start();
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
  o.stop(ac.currentTime + dur);
}

export const sounds = {
  reveal: () => tone(520, 0.05, "sine", 0.05),
  flag: () => tone(700, 0.07, "triangle", 0.07),
  win: () => {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.18, "triangle", 0.1), i * 90));
  },
  lose: () => {
    [300, 220, 160].forEach((f, i) => setTimeout(() => tone(f, 0.2, "sawtooth", 0.1), i * 110));
  },
  click: () => tone(380, 0.04, "sine", 0.04),
};