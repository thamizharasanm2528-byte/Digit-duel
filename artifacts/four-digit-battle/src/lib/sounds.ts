// Procedural sound effects via Web Audio API — no audio files needed.
// AudioContext is created lazily after the first user interaction to satisfy
// browser autoplay policy.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!ctx) ctx = new AudioContext();
    // Resume if suspended (can happen after page visibility changes)
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  } catch {
    return null; // silently ignore in environments without Web Audio
  }
}

/** Short crisp tick — played every second during the last 10 seconds */
export function playTick(urgent = false): void {
  const ac = getCtx();
  if (!ac) return;

  const osc  = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);

  osc.type = "square";
  // Urgent ticks are higher-pitched for more tension
  osc.frequency.setValueAtTime(urgent ? 1200 : 900, ac.currentTime);
  gain.gain.setValueAtTime(urgent ? 0.18 : 0.12, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.07);

  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + 0.07);
}

/** Descending buzzer — played when the timer hits zero */
export function playBuzzer(): void {
  const ac = getCtx();
  if (!ac) return;

  // Layer two oscillators for a richer alarm sound
  const freqs = [220, 165];
  freqs.forEach((freq, i) => {
    const osc  = ac!.createOscillator();
    const gain = ac!.createGain();
    osc.connect(gain);
    gain.connect(ac!.destination);

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, ac!.currentTime + i * 0.05);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, ac!.currentTime + 0.65);

    gain.gain.setValueAtTime(0.22, ac!.currentTime + i * 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac!.currentTime + 0.7);

    osc.start(ac!.currentTime + i * 0.05);
    osc.stop(ac!.currentTime + 0.75);
  });
}

/** Short positive ding — played on a correct 4-Found guess */
export function playWin(): void {
  const ac = getCtx();
  if (!ac) return;

  const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    const osc  = ac!.createOscillator();
    const gain = ac!.createGain();
    osc.connect(gain);
    gain.connect(ac!.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ac!.currentTime + i * 0.1);
    gain.gain.setValueAtTime(0.2, ac!.currentTime + i * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac!.currentTime + i * 0.1 + 0.25);

    osc.start(ac!.currentTime + i * 0.1);
    osc.stop(ac!.currentTime + i * 0.1 + 0.3);
  });
}
