const entry = document.getElementById('entry');
const audio = document.getElementById('audio');
const playBtn = document.getElementById('play');
const muteBtn = document.getElementById('mute');
const volumeSlider = document.getElementById('volume');
const volumeValue = document.getElementById('volumeValue');
const timeEl = document.getElementById('time');
const bar = document.getElementById('bar');
const progress = document.getElementById('progress');
const discordCopy = document.getElementById('discordCopy');
const discordText = document.getElementById('discordText');
const card = document.getElementById('card');
const typed = document.getElementById('typed');
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d', { alpha: true });

const phrases = [
  'dark profile · glitch aesthetic · H4TE666',
  'github · telegram · steam · discord',
  'purple noise // spectre teleport vibe',
  'bio page loaded successfully'
];

const DEFAULT_VOLUME = 0.22;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const mobileQuery = window.matchMedia('(max-width: 720px)');
const tiltQuery = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 841px)');

let phraseIndex = 0;
let charIndex = 0;
let deleting = false;
let currentVolume = DEFAULT_VOLUME;
let lastVolume = DEFAULT_VOLUME;
let isMuted = false;
let audioCtx = null;
let sourceNode = null;
let gainNode = null;
let webAudioReady = false;
let particles = [];
let particleFrame = null;
let tiltFrame = null;
let lastMouseEvent = null;

function storageGet(key) {
  try { return localStorage.getItem(key); } catch (_) { return null; }
}

function storageSet(key, value) {
  try { localStorage.setItem(key, value); } catch (_) {}
}

function clampVolume(value) {
  if (value === null || value === undefined || value === '') return DEFAULT_VOLUME;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_VOLUME;
  return Math.min(Math.max(parsed, 0), 1);
}

function updateVolumeEngine() {
  // Native HTMLAudioElement volume is the most reliable on Vercel/static hosting.
  // WebAudio can randomly break playback after deploys on some browsers, so we avoid it.
  const safeVolume = clampVolume(currentVolume);
  audio.volume = safeVolume;
  audio.muted = Boolean(isMuted || safeVolume === 0);
}


function updateVolumeUI() {
  const percent = Math.round(currentVolume * 100);
  volumeSlider.value = String(percent);
  volumeValue.textContent = `${percent}%`;
  muteBtn.textContent = isMuted || currentVolume === 0 ? 'muted' : 'sound';
  muteBtn.setAttribute('aria-pressed', String(isMuted || currentVolume === 0));
}

function setVolumeFromPercent(percent, save = true) {
  currentVolume = clampVolume(Number(percent) / 100);

  if (currentVolume > 0) {
    lastVolume = currentVolume;
    isMuted = false;
  } else {
    isMuted = true;
  }

  if (save) {
    storageSet('bio-volume', String(currentVolume));
    storageSet('bio-muted', String(isMuted));
  }

  updateVolumeEngine();
  updateVolumeUI();
}

async function initAudioGraph() {
  // Kept as a no-op so older code paths still work.
  // Playback now uses the normal <audio> element to avoid silent audio bugs.
  updateVolumeEngine();
}


function loadSavedVolume() {
  const savedVolume = storageGet('bio-volume');
  currentVolume = savedVolume === null ? DEFAULT_VOLUME : clampVolume(savedVolume);
  if (currentVolume <= 0) currentVolume = DEFAULT_VOLUME;
  lastVolume = currentVolume;

  // Do not restore old muted state after deploys: it caused sites to look broken.
  isMuted = false;
  storageSet('bio-muted', 'false');

  updateVolumeEngine();
  updateVolumeUI();
}


loadSavedVolume();

function typeLoop() {
  if (reduceMotion.matches) {
    typed.textContent = phrases[0];
    return;
  }

  const current = phrases[phraseIndex];
  typed.textContent = current.slice(0, charIndex) + (Date.now() % 1000 < 500 ? '|' : '');

  if (!deleting && charIndex < current.length) charIndex++;
  else if (!deleting && charIndex >= current.length) setTimeout(() => { deleting = true; }, 950);
  else if (deleting && charIndex > 0) charIndex--;
  else {
    deleting = false;
    phraseIndex = (phraseIndex + 1) % phrases.length;
  }

  setTimeout(typeLoop, deleting ? 34 : 62);
}

typeLoop();

function fmt(sec) {
  if (!Number.isFinite(sec)) return '00:00';
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function updateTime() {
  const dur = audio.duration || 0;
  const cur = audio.currentTime || 0;
  timeEl.textContent = `${fmt(cur)} / ${fmt(dur)}`;
  progress.style.width = dur ? `${(cur / dur) * 100}%` : '0%';
}

async function startAudio() {
  try {
    await initAudioGraph();

    if (currentVolume <= 0) {
      currentVolume = lastVolume || DEFAULT_VOLUME;
      isMuted = false;
      updateVolumeUI();
    }

    updateVolumeEngine();
    audio.load?.();
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.then === 'function') await playPromise;
    playBtn.textContent = 'Ⅱ';
  } catch (err) {
    console.warn('Audio play blocked or failed:', err);
    playBtn.textContent = '▶';
  }
}


entry.addEventListener('click', async () => {
  entry.classList.add('hidden');
  await startAudio();
}, { once: true });

playBtn.addEventListener('click', async () => {
  if (audio.paused) await startAudio();
  else {
    audio.pause();
    playBtn.textContent = '▶';
  }
});

audio.addEventListener('play', () => { playBtn.textContent = 'Ⅱ'; });
audio.addEventListener('pause', () => { playBtn.textContent = '▶'; });
audio.addEventListener('loadedmetadata', updateTime);
audio.addEventListener('timeupdate', updateTime);

function seekAudio(clientX) {
  const rect = bar.getBoundingClientRect();
  const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
  if (audio.duration) audio.currentTime = (x / rect.width) * audio.duration;
}

bar.addEventListener('click', (e) => seekAudio(e.clientX));
bar.addEventListener('pointerdown', (e) => {
  seekAudio(e.clientX);
  bar.setPointerCapture?.(e.pointerId);
});
bar.addEventListener('pointermove', (e) => {
  if (e.buttons === 1) seekAudio(e.clientX);
});

muteBtn.addEventListener('click', () => {
  if (isMuted || currentVolume === 0) {
    isMuted = false;
    if (currentVolume === 0) currentVolume = lastVolume || DEFAULT_VOLUME;
  } else {
    isMuted = true;
  }

  storageSet('bio-volume', String(currentVolume));
  storageSet('bio-muted', String(isMuted));
  updateVolumeEngine();
  updateVolumeUI();
});

function handleVolumeInput() {
  setVolumeFromPercent(volumeSlider.value);
}

volumeSlider.addEventListener('input', handleVolumeInput);
volumeSlider.addEventListener('change', handleVolumeInput);
volumeSlider.addEventListener('pointerdown', (e) => e.stopPropagation());
volumeSlider.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });

discordCopy.addEventListener('click', async () => {
  const value = discordCopy.dataset.copy;
  try {
    await navigator.clipboard.writeText(value);
    discordText.textContent = 'copied';
  } catch (_) {
    discordText.textContent = value;
  }
  setTimeout(() => { discordText.textContent = 'copy'; }, 1500);
});

function applyTilt() {
  tiltFrame = null;
  if (!lastMouseEvent || !tiltQuery.matches) return;

  const rect = card.getBoundingClientRect();
  const x = lastMouseEvent.clientX - rect.left;
  const y = lastMouseEvent.clientY - rect.top;
  const cx = rect.width / 2;
  const cy = rect.height / 2;

  if (x >= 0 && y >= 0 && x <= rect.width && y <= rect.height) {
    const rx = ((y - cy) / cy) * -5;
    const ry = ((x - cx) / cx) * 6;
    card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  } else {
    card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
  }
}

window.addEventListener('mousemove', (e) => {
  if (!tiltQuery.matches) return;
  lastMouseEvent = e;
  if (!tiltFrame) tiltFrame = requestAnimationFrame(applyTilt);
}, { passive: true });

function resizeParticles() {
  const dpr = Math.min(window.devicePixelRatio || 1, mobileQuery.matches ? 1.5 : 2);
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  if (reduceMotion.matches) {
    particles = [];
    return;
  }

  const density = mobileQuery.matches ? 26000 : 14000;
  const maxCount = mobileQuery.matches ? 48 : 105;
  const count = Math.min(maxCount, Math.floor((width * height) / density));
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 1.9 + 0.35,
    vx: (Math.random() - 0.5) * (mobileQuery.matches ? 0.18 : 0.28),
    vy: (Math.random() - 0.5) * (mobileQuery.matches ? 0.18 : 0.28),
    a: Math.random() * 0.45 + 0.12
  }));
}

function drawParticles() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  ctx.clearRect(0, 0, width, height);

  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;

    if (p.x < -20) p.x = width + 20;
    if (p.x > width + 20) p.x = -20;
    if (p.y < -20) p.y = height + 20;
    if (p.y > height + 20) p.y = -20;

    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 8);
    g.addColorStop(0, `rgba(255,43,214,${p.a})`);
    g.addColorStop(0.45, `rgba(141,53,255,${p.a * 0.4})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * 8, 0, Math.PI * 2);
    ctx.fill();
  }

  particleFrame = requestAnimationFrame(drawParticles);
}

function startParticles() {
  if (particleFrame || reduceMotion.matches) return;
  particleFrame = requestAnimationFrame(drawParticles);
}

function stopParticles() {
  if (particleFrame) cancelAnimationFrame(particleFrame);
  particleFrame = null;
}

resizeParticles();
startParticles();

window.addEventListener('resize', () => {
  resizeParticles();
}, { passive: true });

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopParticles();
    card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
  } else {
    resizeParticles();
    startParticles();
  }
});
