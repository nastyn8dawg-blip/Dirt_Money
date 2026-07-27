let audioContext = null;

export const SOUND_MAP = {
  click: [220, 0.025],
  success: [440, 0.06],
  warning: [130, 0.09],
  harvest: [330, 0.08],
  sale: [520, 0.08],
  cash: [520, 0.08],
  credit: [155, 0.1],
  contractComplete: [470, 0.09],
  contractFailed: [110, 0.12],
  storm: [95, 0.14],
  repair: [260, 0.07],
  reputation: [390, 0.08],
  popup: [300, 0.05],
  event: [180, 0.1]
};

function getContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  audioContext = audioContext || new AudioContext();
  return audioContext;
}

export function playSound(name, settings = {}) {
  if (settings.soundMuted) return;
  if (typeof window === "undefined") return;
  const volume = Math.max(0, Math.min(1, Number(settings.soundVolume ?? 0.35)));
  if (volume <= 0) return;

  window.setTimeout(() => playTone(name, volume), 0);
}

export function soundCueAvailable(name) {
  return Boolean(SOUND_MAP[name]);
}

function playTone(name, volume) {
  try {
    const context = getContext();
    if (!context) return;

    const [frequency, duration] = SOUND_MAP[name] ?? SOUND_MAP.click;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.value = volume * 0.08;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  } catch {
    // Browsers may block or omit Web Audio. Sound is polish, never a gameplay dependency.
  }
}
