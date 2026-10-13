/* ==========================================================================
   STARQUEST — KIDS TO-DO APP LOGIC
   ========================================================================== */

const AVATARS = ['🦄', '🦖', '🐼', '🦊', '🦁', '🐸', '🐙', '🚀', '🧚'];

const SURPRISE_QUESTS = [
  { text: 'Make my bed like a superhero', cat: 'home', icon: '🏠', stars: 2 },
  { text: 'Brush teeth for 2 full minutes', cat: 'health', icon: '🦷', stars: 1 },
  { text: 'Read 5 pages of a story book', cat: 'school', icon: '📚', stars: 3 },
  { text: 'Put all stray toys in the toy box', cat: 'home', icon: '🏠', stars: 2 },
  { text: 'Draw a picture of a friendly monster', cat: 'fun', icon: '🎨', stars: 2 },
  { text: 'Drink a big glass of water', cat: 'health', icon: '🦷', stars: 1 },
  { text: 'Practice counting or spelling words', cat: 'school', icon: '📚', stars: 3 },
  { text: 'Do 10 happy jumping jacks!', cat: 'health', icon: '🦷', stars: 1 }
];

const STICKERS = [
  { id: 's1', name: 'Happy Dino', emoji: '🦖', req: 3 },
  { id: 's2', name: 'Rocket Ship', emoji: '🚀', req: 7 },
  { id: 's3', name: 'Magic Unicorn', emoji: '🦄', req: 12 },
  { id: 's4', name: 'Rainbow', emoji: '🌈', req: 18 },
  { id: 's5', name: 'Super Robot', emoji: '🤖', req: 25 },
  { id: 's6', name: 'Golden Dragon', emoji: '🐉', req: 35 },
  { id: 's7', name: 'Alien Buddy', emoji: '🛸', req: 45 },
  { id: 's8', name: 'Galaxy Crown', emoji: '👑', req: 60 }
];

/* --- State Management --- */
let state = {
  kidName: 'Leo',
  avatarIndex: 0,
  stars: 4,
  soundOn: true,
  filter: 'all',
  selectedCat: 'home',
  selectedIcon: '🏠',
  selectedStars: 1,
  quests: [
    { id: 1, text: 'Brush my teeth & wash face', cat: 'health', icon: '🦷', stars: 1, done: true },
    { id: 2, text: 'Put toys back into the basket', cat: 'home', icon: '🏠', stars: 2, done: false },
    { id: 3, text: 'Read a fun picture book', cat: 'school', icon: '📚', stars: 3, done: false },
    { id: 4, text: 'Build a cool castle or drawing', cat: 'fun', icon: '🎨', stars: 2, done: false }
  ]
};

/* --- Load Saved Data --- */
function loadState() {
  const saved = localStorage.getItem('starquest_kids_todo');
  if (saved) {
    try {
      state = { ...state, ...JSON.parse(saved) };
    } catch (e) {
      console.error('Could not parse saved quests', e);
    }
  }
}

function saveState() {
  localStorage.setItem('starquest_kids_todo', JSON.stringify(state));
}

/* --- Web Audio API Sound Synthesizer (No external MP3s needed) --- */
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(type) {
  if (!state.soundOn) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const now = audioCtx.currentTime;

  if (type === 'complete') {
    // Cheerful ascending arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(0.18, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.25);
    });
  } else if (type === 'pop') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.1);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }
}

/* --- DOM Elements --- */
const avatarBtn = document.getElementById('avatar-btn');
const kidNameInput = document.getElementById('kid-name');
const rankBadge = document.getElementById('rank-badge');
const starCountEl = document.getElementById('star-count');
const starBankBox = document.getElementById('star-bank-box');
const soundToggleBtn = document.getElementById('sound-toggle');

const progressMessage = document.getElementById('progress-message');
const progressFraction = document.getElementById('progress-fraction');
const progressFill = document.getElementById('progress-fill');

const questForm = document.getElementById('quest-form');
const questInput = document.getElementById('quest-input');
const surpriseBtn = document.getElementById('surprise-btn');
const categoryPicker = document.getElementById('category-picker');
const starPicker = document.getElementById('star-picker');

const filterTabs = document.getElementById('filter-tabs');
const clearDoneBtn = document.getElementById('clear-done-btn');
const questListEl = document.getElementById('quest-list');
const emptyStateEl = document.getElementById('empty-state');
const stickerGridEl = document.getElementById('sticker-grid');

/* --- Rendering Functions --- */
function getRankTitle(stars) {
  if (stars >= 50) return '👑 Galaxy Legend';
  if (stars >= 30) return '🚀 Cosmic Captain';
  if (stars >= 15) return '🌟 Super Star Hero';
  if (stars >= 5) return '🧭 Adventure Scout';
  return '🌱 Rookie Explorer';
}

function renderHeaderAndStats() {
  avatarBtn.textContent = AVATARS[state.avatarIndex % AVATARS.length];
  kidNameInput.value = state.kidName;
  starCountEl.textContent = state.stars;
  rankBadge.textContent = getRankTitle(state.stars);
  soundToggleBtn.textContent = state.soundOn ? '🔊' : '🔇';

  // Progress Calculation
  const total = state.quests.length;
  const doneCount = state.quests.filter(q => q.done).length;
  const pct = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  progressFraction.textContent = `${doneCount} / ${total} Done`;
  progressFill.style.width = `${pct}%`;

  if (total === 0) {
    progressMessage.textContent = 'Add a quest to start your adventure! 🌈';
  } else if (pct === 100) {
    progressMessage.textContent = 'AMAZING! You finished every single quest! 🏆🎉';
  } else if (pct >= 50) {
    progressMessage.textContent = 'Halfway there! Keep going, superstar! 🔥';
  } else {
    progressMessage.textContent = "Let's crush today's quests! 🚀";
  }
}

function renderQuests() {
  questListEl.innerHTML = '';

  const filtered = state.quests.filter(q => {
    if (state.filter === 'todo') return !q.done;
    if (state.filter === 'done') return q.done;
    return true;
  });

  if (filtered.length === 0) {
    emptyStateEl.classList.remove('hidden');
  } else {
    emptyStateEl.classList.add('hidden');
  }

  filtered.forEach(quest => {
    const li = document.createElement('li');
    li.className = `quest-item ${quest.done ? 'completed' : ''}`;
    li.dataset.cat = quest.cat;

    const starsStr = '⭐'.repeat(quest.stars);

    li.innerHTML = `
      <div class="quest-left" role="button" tabindex="0" aria-label="Toggle quest completion">
        <div class="check-circle">${quest.done ? '✔' : ''}</div>
        <span class="quest-icon">${quest.icon}</span>
        <div class="quest-details">
          <span class="quest-title">${escapeHTML(quest.text)}</span>
          <span class="quest-stars">${starsStr} (+${quest.stars} ${quest.stars > 1 ? 'Stars' : 'Star'})</span>
        </div>
      </div>
      <button class="delete-btn" title="Delete Quest" aria-label="Delete Quest">🗑️</button>
    `;

    // Toggle Complete Event
    const leftArea = li.querySelector('.quest-left');
    leftArea.addEventListener('click', (e) => toggleQuest(quest.id, e));

    // Delete Quest Event
    const delBtn = li.querySelector('.delete-btn');
    delBtn.addEventListener('click', () => deleteQuest(quest.id));

    questListEl.appendChild(li);
  });
}

function renderStickers() {
  stickerGridEl.innerHTML = '';
  STICKERS.forEach(sticker => {
    const unlocked = state.stars >= sticker.req;
    const div = document.createElement('div');
    div.className = `sticker-slot ${unlocked ? 'unlocked' : ''}`;
    div.innerHTML = `
      <span class="sticker-Slot-emoji">${sticker.emoji}</span>
      <span class="sticker-name">${sticker.name}</span>
      <span class="sticker-req">${unlocked ? '✨ Unlocked!' : `🔒 ${sticker.req} Stars`}</span>
    `;
    stickerGridEl.appendChild(div);
  });
}

function renderAll() {
  renderHeaderAndStats();
  renderQuests();
  renderStickers();
}

/* --- Actions & Handlers --- */
function toggleQuest(id, event) {
  const quest = state.quests.find(q => q.id === id);
  if (!quest) return;

  quest.done = !quest.done;

  if (quest.done) {
    state.stars += quest.stars;
    playTone('complete');
    spawnFloatingStar(event.clientX, event.clientY, quest.stars);
    burstConfetti();
    starBankBox.classList.add('pop');
    setTimeout(() => starBankBox.classList.remove('pop'), 350);
  } else {
    state.stars = Math.max(0, state.stars - quest.stars);
    playTone('pop');
  }

  saveState();
  renderAll();
}

function deleteQuest(id) {
  playTone('pop');
  state.quests = state.quests.filter(q => q.id !== id);
  saveState();
  renderAll();
}

function spawnFloatingStar(x, y, amount) {
  const el = document.createElement('div');
  el.className = 'floating-star';
  el.textContent = `+${amount} ⭐`;
  el.style.left = `${x || window.innerWidth / 2}px`;
  el.style.top = `${y || window.innerHeight / 2}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 950);
}

function escapeHTML(str) {
  const p = document.createElement('p');
  p.textContent = str;
  return p.innerHTML;
}

/* --- Event Listeners --- */
avatarBtn.addEventListener('click', () => {
  playTone('pop');
  state.avatarIndex = (state.avatarIndex + 1) % AVATARS.length;
  saveState();
  renderHeaderAndStats();
});

kidNameInput.addEventListener('input', (e) => {
  state.kidName = e.target.value.trim() || 'Captain';
  saveState();
});

soundToggleBtn.addEventListener('click', () => {
  state.soundOn = !state.soundOn;
  playTone('pop');
  saveState();
  renderHeaderAndStats();
});

categoryPicker.addEventListener('click', (e) => {
  const btn = e.target.closest('.cat-pill');
  if (!btn) return;
  playTone('pop');
  document.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.selectedCat = btn.dataset.cat;
  state.selectedIcon = btn.dataset.icon;
});

starPicker.addEventListener('click', (e) => {
  const btn = e.target.closest('.star-pill');
  if (!btn) return;
  playTone('pop');
  document.querySelectorAll('.star-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.selectedStars = parseInt(btn.dataset.stars, 10);
});

questForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = questInput.value.trim();
  if (!text) return;

  playTone('pop');
  state.quests.unshift({
    id: Date.now(),
    text,
    cat: state.selectedCat,
    icon: state.selectedIcon,
    stars: state.selectedStars,
    done: false
  });

  questInput.value = '';
  saveState();
  renderAll();
});

surpriseBtn.addEventListener('click', () => {
  playTone('pop');
  const randomQuest = SURPRISE_QUESTS[Math.floor(Math.random() * SURPRISE_QUESTS.length)];
  state.quests.unshift({
    id: Date.now(),
    text: randomQuest.text,
    cat: randomQuest.cat,
    icon: randomQuest.icon,
    stars: randomQuest.stars,
    done: false
  });
  saveState();
  renderAll();
});

filterTabs.addEventListener('click', (e) => {
  const btn = e.target.closest('.tab-btn');
  if (!btn) return;
  playTone('pop');
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.filter = btn.dataset.filter;
  renderQuests();
});

clearDoneBtn.addEventListener('click', () => {
  playTone('pop');
  state.quests = state.quests.filter(q => !q.done);
  saveState();
  renderAll();
});

/* --- Lightweight Confetti Engine --- */
const canvas = document.getElementById('confetti-canvas');
const ctx = canvas.getContext('2d');
let particles = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function burstConfetti() {
  const colors = ['#ff6b8b', '#4cc9f0', '#ffbe0b', '#06d6a0', '#9b5de5'];
  for (let i = 0; i < 45; i++) {
    particles.push({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      vx: (Math.random() - 0.5) * 14,
      vy: (Math.random() - 0.8) * 14,
      size: Math.random() * 8 + 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      life: 75
    });
  }
}

function updateConfetti() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach((p, index) => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.35; // gravity
    p.rotation += 6;
    p.life -= 1;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    ctx.restore();

    if (p.life <= 0) particles.splice(index, 1);
  });
  requestAnimationFrame(updateConfetti);
}
updateConfetti();

/* --- Initialize App --- */
loadState();
renderAll();
