export function createAudioFeedback() {
  let context;
  let ready = false;

  async function unlock() {
    context ||= new AudioContext();
    await context.resume();
    ready = context.state === "running";
  }

  function tone(frequency, duration, volume) {
    if (!ready) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  }

  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });

  return {
    play(event) {
      if (event.type === "pickup") tone(620, 0.09, 0.08);
      if (event.type === "complete") { tone(520, 0.12, 0.09); window.setTimeout(() => tone(780, 0.2, 0.09), 110); }
    }
  };
}
