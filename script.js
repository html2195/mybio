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

const phrases = [
  'dark profile · glitch aesthetic · H4TE666',
  'github · telegram · steam · discord',
  'purple noise // spectre teleport vibe',
  'bio page loaded successfully'
];
let phraseIndex = 0;
let charIndex = 0;
let deleting = false;

const DEFAULT_VOLUME = 0.22;
let lastVolume = DEFAULT_VOLUME;

function clampVolume(value) {
  if (value === null || value === undefined || value === '') return DEFAULT_VOLUME;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_VOLUME;
  return Math.min(Math.max(parsed, 0), 1);
}

function updateVolumeUI() {
  const percent = Math.round(audio.volume * 100);
  volumeSlider.value = String(percent);
  volumeValue.textContent = `${percent}%`;
  muteBtn.textContent = audio.muted || audio.volume === 0 ? 'muted' : 'sound';
}

function setVolumeFromPercent(percent, save = true) {
  const volume = clampVolume(Number(percent) / 100);
  audio.volume = volume;
  audio.muted = volume === 0;
  if (volume > 0) lastVolume = volume;
  if (save) localStorage.setItem('bio-volume', String(volume));
  updateVolumeUI();
}

const savedVolume = clampVolume(localStorage.getItem('bio-volume'));
setVolumeFromPercent(Math.round(savedVolume * 100), false);

function typeLoop() {
  const current = phrases[phraseIndex];
  typed.textContent = current.slice(0, charIndex) + (Date.now() % 1000 < 500 ? '|' : '');
  if (!deleting && charIndex < current.length) charIndex++;
  else if (!deleting && charIndex >= current.length) setTimeout(() => deleting = true, 950);
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
    await audio.play();
    playBtn.textContent = 'Ⅱ';
  } catch (e) {
    playBtn.textContent = '▶';
  }
}

entry.addEventListener('click', async () => {
  entry.classList.add('hidden');
  await startAudio();
});

playBtn.addEventListener('click', async () => {
  if (audio.paused) await startAudio();
  else {
    audio.pause();
    playBtn.textContent = '▶';
  }
});

audio.addEventListener('play', () => playBtn.textContent = 'Ⅱ');
audio.addEventListener('pause', () => playBtn.textContent = '▶');
audio.addEventListener('loadedmetadata', updateTime);
audio.addEventListener('timeupdate', updateTime);

bar.addEventListener('click', (e) => {
  const rect = bar.getBoundingClientRect();
  const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
  if (audio.duration) audio.currentTime = (x / rect.width) * audio.duration;
});

muteBtn.addEventListener('click', () => {
  if (audio.muted || audio.volume === 0) {
    audio.muted = false;
    if (audio.volume === 0) audio.volume = lastVolume || DEFAULT_VOLUME;
  } else {
    audio.muted = true;
  }
  updateVolumeUI();
});

volumeSlider.addEventListener('input', () => {
  setVolumeFromPercent(volumeSlider.value);
});

discordCopy.addEventListener('click', async () => {
  const value = discordCopy.dataset.copy;
  try {
    await navigator.clipboard.writeText(value);
    discordText.textContent = 'copied';
  } catch (e) {
    discordText.textContent = value;
  }
  setTimeout(() => discordText.textContent = 'copy', 1500);
});

window.addEventListener('mousemove', (e) => {
  if (window.matchMedia('(max-width: 720px)').matches) return;
  const rect = card.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const cx = rect.width / 2;
  const cy = rect.height / 2;
  const rx = ((y - cy) / cy) * -5;
  const ry = ((x - cx) / cx) * 6;
  if (x >= 0 && y >= 0 && x <= rect.width && y <= rect.height) {
    card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  } else {
    card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
  }
});

const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let particles = [];
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(innerWidth * dpr);
  canvas.height = Math.floor(innerHeight * dpr);
  canvas.style.width = innerWidth + 'px';
  canvas.style.height = innerHeight + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const count = Math.min(110, Math.floor(innerWidth * innerHeight / 13000));
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * innerWidth,
    y: Math.random() * innerHeight,
    r: Math.random() * 1.9 + .35,
    vx: (Math.random() - .5) * .28,
    vy: (Math.random() - .5) * .28,
    a: Math.random() * .45 + .12
  }));
}
function draw() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  for (const p of particles) {
    p.x += p.vx; p.y += p.vy;
    if (p.x < -20) p.x = innerWidth + 20;
    if (p.x > innerWidth + 20) p.x = -20;
    if (p.y < -20) p.y = innerHeight + 20;
    if (p.y > innerHeight + 20) p.y = -20;
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 8);
    g.addColorStop(0, `rgba(255,43,214,${p.a})`);
    g.addColorStop(.45, `rgba(141,53,255,${p.a * .4})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * 8, 0, Math.PI * 2);
    ctx.fill();
  }
  requestAnimationFrame(draw);
}
resize();
draw();
addEventListener('resize', resize);

document.addEventListener('visibilitychange', () => {
  if (document.hidden) card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
});
