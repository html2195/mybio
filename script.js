const entry = document.getElementById('entry');
const card = document.getElementById('card');
const music = document.getElementById('musicAudio');
const rain = document.getElementById('rainAudio');

const playBtn = document.getElementById('play');
const playIcon = document.getElementById('playIcon');
const muteBtn = document.getElementById('mute');
const rainToggle = document.getElementById('rainToggle');
const rewindBtn = document.getElementById('rewind');
const forwardBtn = document.getElementById('forward');
const volumeSlider = document.getElementById('volume');
const volumeValue = document.getElementById('volumeValue');
const timeEl = document.getElementById('time');
const bar = document.getElementById('bar');
const progress = document.getElementById('progress');
const progressThumb = document.getElementById('progressThumb');
const discordCopy = document.getElementById('discordCopy');
const discordText = document.getElementById('discordText');
const searchTyping = document.getElementById('searchTyping');

const DEPRESSION_URL = 'https://ru.wikipedia.org/wiki/%D0%94%D0%B5%D0%BF%D1%80%D0%B5%D1%81%D1%81%D0%B8%D1%8F';

function openDepressionTab(event) {
  event.preventDefault();
  event.stopPropagation();
  window.open(DEPRESSION_URL, '_blank', 'noopener,noreferrer');
}

const MUSIC_BASE_VOLUME = 0.22;
const RAIN_BASE_VOLUME = 0.09;
const DEFAULT_MASTER = 0.48;
const SEEK_STEP = 10;

let masterVolume = DEFAULT_MASTER;
let lastMasterVolume = DEFAULT_MASTER;
let started = false;
let isMuted = false;
let rainEnabled = true;
let isSeeking = false;
let lastSearchPhrase = '';
let searchQueue = [];
let searchPhrase = '';
let searchChar = 0;
let searchDeleting = false;

const searchPhrases = [
  'A New Series of Melancholy',
  'The rain is beautiful, and will I be by her side?',
  'How many days are there in a year?',
  'Will I be successful?',
  'Should I write to her today?',
  'Yulia? Alisa? Nastya? Katya? Natasha? Olya? And yet, it’s me.',
  'Why am I a bastard in the eyes of girls?'
];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function shuffle(list) {
  const array = [...list];

  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  if (array[0] === lastSearchPhrase && array.length > 1) {
    [array[0], array[1]] = [array[1], array[0]];
  }

  return array;
}

function nextSearchPhrase() {
  if (searchQueue.length === 0) {
    searchQueue = shuffle(searchPhrases);
  }

  const next = searchQueue.shift();
  lastSearchPhrase = next;
  return next;
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function setVolumes() {
  const activeMaster = isMuted ? 0 : masterVolume;

  music.volume = clamp(activeMaster * MUSIC_BASE_VOLUME, 0, 1);
  rain.volume = rainEnabled ? clamp(activeMaster * RAIN_BASE_VOLUME, 0, 1) : 0;

  volumeSlider.value = Math.round(masterVolume * 100);
  volumeValue.textContent = `${Math.round(masterVolume * 100)}%`;
  muteBtn.textContent = isMuted || activeMaster === 0 ? 'muted' : 'sound';
  rainToggle.textContent = rainEnabled ? 'rain on' : 'rain off';
}

function updateTime() {
  const duration = music.duration || 0;
  const current = music.currentTime || 0;
  const percent = duration ? (current / duration) * 100 : 0;
  const safePercent = clamp(percent, 0, 100);

  progress.style.width = `${safePercent}%`;
  progressThumb.style.left = `${safePercent}%`;
  timeEl.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
}

async function safePlay(audio) {
  try {
    await audio.play();
    return true;
  } catch (error) {
    return false;
  }
}

async function playAmbience() {
  setVolumes();

  const musicStarted = await safePlay(music);
  const rainStarted = rainEnabled ? await safePlay(rain) : true;

  if (musicStarted || rainStarted) {
    playIcon.textContent = 'Ⅱ';
    started = true;
  } else {
    playIcon.textContent = '▶';
  }
}

function pauseAmbience() {
  music.pause();
  rain.pause();
  playIcon.textContent = '▶';
}

function togglePlay() {
  if (music.paused) {
    playAmbience();
  } else {
    pauseAmbience();
  }
}

function enterSite() {
  entry.classList.add('hidden');
  playAmbience();
}

function seekBy(seconds) {
  if (!music.duration) return;

  music.currentTime = clamp(music.currentTime + seconds, 0, music.duration);
  updateTime();
}

function seekFromPointer(clientX) {
  if (!music.duration) return;

  const rect = bar.getBoundingClientRect();
  const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
  music.currentTime = ratio * music.duration;
  updateTime();
}

function startSearchTyping() {
  if (!searchPhrase) {
    searchPhrase = nextSearchPhrase();
  }

  if (!searchDeleting) {
    searchChar += 1;
    searchTyping.textContent = searchPhrase.slice(0, searchChar);

    if (searchChar >= searchPhrase.length) {
      searchDeleting = true;
      setTimeout(startSearchTyping, 1800 + Math.random() * 800);
      return;
    }
  } else {
    searchChar -= 1;
    searchTyping.textContent = searchPhrase.slice(0, searchChar);

    if (searchChar <= 0) {
      searchDeleting = false;
      searchPhrase = nextSearchPhrase();
    }
  }

  const delay = searchDeleting ? 24 : 38 + Math.random() * 32;
  setTimeout(startSearchTyping, delay);
}

function copyDiscord() {
  const value = discordText.textContent.trim();
  const label = discordCopy.querySelector('em');

  navigator.clipboard?.writeText(value).then(() => {
    label.textContent = 'copied';
    setTimeout(() => {
      label.textContent = 'copy';
    }, 1300);
  }).catch(() => {
    label.textContent = 'copy';
  });
}

function setupTilt() {
  const canTilt = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!canTilt) return;

  card.addEventListener('pointermove', (event) => {
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    card.style.transform = `perspective(900px) rotateX(${(-y * 3.2).toFixed(2)}deg) rotateY(${(x * 4).toFixed(2)}deg)`;
  });

  card.addEventListener('pointerleave', () => {
    card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
  });
}

volumeSlider.addEventListener('input', () => {
  masterVolume = clamp(Number(volumeSlider.value) / 100, 0, 1);

  if (masterVolume > 0) {
    lastMasterVolume = masterVolume;
    isMuted = false;
  }

  setVolumes();
});

playBtn.addEventListener('click', togglePlay);
rewindBtn.addEventListener('click', () => seekBy(-SEEK_STEP));
forwardBtn.addEventListener('click', () => seekBy(SEEK_STEP));

rainToggle.addEventListener('click', () => {
  rainEnabled = !rainEnabled;

  if (!rainEnabled) {
    rain.pause();
  } else if (started && !music.paused) {
    safePlay(rain);
  }

  setVolumes();
});

muteBtn.addEventListener('click', () => {
  if (isMuted || masterVolume === 0) {
    isMuted = false;
    masterVolume = lastMasterVolume || DEFAULT_MASTER;
  } else {
    lastMasterVolume = masterVolume || DEFAULT_MASTER;
    isMuted = true;
  }

  setVolumes();
});

bar.addEventListener('pointerdown', (event) => {
  isSeeking = true;
  bar.setPointerCapture(event.pointerId);
  seekFromPointer(event.clientX);
});

bar.addEventListener('pointermove', (event) => {
  if (!isSeeking) return;
  seekFromPointer(event.clientX);
});

bar.addEventListener('pointerup', (event) => {
  isSeeking = false;
  bar.releasePointerCapture(event.pointerId);
});

bar.addEventListener('keydown', (event) => {
  if (!music.duration) return;

  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    seekBy(-5);
  }

  if (event.key === 'ArrowRight') {
    event.preventDefault();
    seekBy(5);
  }

  if (event.key === 'Home') {
    event.preventDefault();
    music.currentTime = 0;
    updateTime();
  }

  if (event.key === 'End') {
    event.preventDefault();
    music.currentTime = music.duration;
    updateTime();
  }
});

music.addEventListener('loadedmetadata', updateTime);
music.addEventListener('timeupdate', updateTime);
music.addEventListener('play', () => {
  playIcon.textContent = 'Ⅱ';
});
music.addEventListener('pause', () => {
  playIcon.textContent = '▶';
});

document.querySelector('.mini-close')?.addEventListener('click', openDepressionTab);
document.querySelector('.win-control--close')?.addEventListener('click', openDepressionTab);
entry.addEventListener('click', enterSite);
discordCopy.addEventListener('click', copyDiscord);

setVolumes();
updateTime();
startSearchTyping();
setupTilt();
