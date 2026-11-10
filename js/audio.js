// Music: one track plays at a time and tracks cross-fade.
// 'menu' plays on the main menu, 'battle' during brawls, ambushes and wars.

const TRACKS = {
  menu: 'menu-music',
  battle: 'battle-music',
};
const FADE_MS = 900;

let volume = 0.6;
let muted = false;
let current = null; // track key that should be playing, or null for silence
const fades = new Map();
let unlockBound = false;

function el(key) {
  return document.getElementById(TRACKS[key]);
}

function fade(audio, to, ms, onDone) {
  cancelAnimationFrame(fades.get(audio));
  const from = audio.volume;
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / ms);
    audio.volume = Math.max(0, Math.min(1, from + (to - from) * t));
    if (t < 1) fades.set(audio, requestAnimationFrame(step));
    else {
      fades.delete(audio);
      if (onDone) onDone();
    }
  };
  fades.set(audio, requestAnimationFrame(step));
}

function startCurrent() {
  const audio = current && el(current);
  if (!audio) return;
  audio.muted = muted;
  if (!audio.paused) {
    fade(audio, volume, FADE_MS / 2);
    return;
  }
  audio.volume = 0;
  audio.play().then(() => fade(audio, volume, FADE_MS)).catch(() => bindUnlock());
}

// Browsers block autoplay until the first click or key press.
function bindUnlock() {
  if (unlockBound) return;
  unlockBound = true;
  const unlock = () => {
    unlockBound = false;
    document.removeEventListener('click', unlock);
    document.removeEventListener('keydown', unlock);
    startCurrent();
  };
  document.addEventListener('click', unlock);
  document.addEventListener('keydown', unlock);
}

/** Switch to a track ('menu', 'battle') or to silence (null), cross-fading. */
export function playMusic(key) {
  if (key === current) return;
  current = key;
  for (const k of Object.keys(TRACKS)) {
    if (k === key) continue;
    const audio = el(k);
    if (audio && !audio.paused) fade(audio, 0, FADE_MS, () => { if (current !== k) audio.pause(); });
  }
  startCurrent();
}

export function setMusicVolume(v) {
  volume = Math.max(0, Math.min(1, v));
  const audio = current && el(current);
  if (audio && !audio.paused) {
    cancelAnimationFrame(fades.get(audio));
    audio.volume = volume;
  }
}

export function setAllMuted(m) {
  muted = m;
  for (const k of Object.keys(TRACKS)) {
    const audio = el(k);
    if (audio) audio.muted = m;
  }
  if (!m) startCurrent();
}

export function getMusicVolume() {
  return volume;
}
