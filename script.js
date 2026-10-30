/**
 * Ming Yu — Index
 *
 * Four things happen on this page:
 *   1. The name flips into place once, on load.
 *   2. The six empty tiles under it are a real guessing game. Solving it
 *      unlocks the notes section further down.
 *   3. Each project row flips its status square in as it scrolls into view.
 *   4. A marker in the top bar slides to the section you're reading.
 *
 * That's the whole script. Everything else is CSS.
 */

const ANSWER = 'WORDLE';
const LEN = ANSWER.length;
const STORE_KEY = 'mingyu.notes.unlocked';
const FLIP_MS = 500;
const STAGGER_MS = 90;
const ROW_STAGGER_MS = 80;

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Set before first paint so rows that will animate never flash in fully drawn.
const canReveal = !reducedMotion && 'IntersectionObserver' in window;
if (canReveal) document.documentElement.classList.add('has-reveal');

/* -------------------------------------------------------------------------
   Storage — never let a locked-down browser break the page
   ------------------------------------------------------------------------- */
function readUnlocked() {
  try {
    return localStorage.getItem(STORE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeUnlocked() {
  try {
    localStorage.setItem(STORE_KEY, '1');
  } catch {
    /* private mode, blocked cookies — the unlock just won't persist */
  }
}

/* -------------------------------------------------------------------------
   Tiles
   ------------------------------------------------------------------------- */
const FILLS = {
  ink: 'tile--ink',
  jade: 'tile--jade',
  marigold: 'tile--marigold',
  slate: 'tile--slate'
};

function clearFill(tile) {
  tile.classList.remove('is-filled', 'is-flipping', ...Object.values(FILLS));
}

/** Flip one tile to a fill state. Resolves when it has landed. */
function flipTile(tile, fill, delay) {
  return new Promise(resolve => {
    clearFill(tile);
    tile.classList.add(FILLS[fill]);

    if (reducedMotion) {
      tile.classList.add('is-filled');
      resolve();
      return;
    }

    window.setTimeout(() => {
      tile.addEventListener('animationend', function done() {
        tile.removeEventListener('animationend', done);
        tile.classList.remove('is-flipping');
        tile.classList.add('is-filled');
        resolve();
      });
      tile.classList.add('is-flipping');
    }, delay);
  });
}

function flipRow(tiles, fills) {
  return Promise.all(
    tiles.map((tile, i) => flipTile(tile, fills[i], i * STAGGER_MS))
  );
}

/* -------------------------------------------------------------------------
   The name — one orchestrated entrance, then stillness
   ------------------------------------------------------------------------- */
function revealName() {
  const tiles = Array.from(document.querySelectorAll('.tile--name'));
  if (!tiles.length) return;
  tiles.forEach((tile, i) => {
    flipTile(tile, 'ink', 200 + i * 70);
  });
}

/* -------------------------------------------------------------------------
   Scoring — standard rules, including repeated letters
   ------------------------------------------------------------------------- */
function scoreGuess(guess, answer) {
  const result = new Array(LEN).fill('slate');
  const unmatched = new Map();

  for (let i = 0; i < LEN; i++) {
    if (guess[i] === answer[i]) {
      result[i] = 'jade';
    } else {
      unmatched.set(answer[i], (unmatched.get(answer[i]) || 0) + 1);
    }
  }

  for (let i = 0; i < LEN; i++) {
    if (result[i] === 'jade') continue;
    const left = unmatched.get(guess[i]) || 0;
    if (left > 0) {
      result[i] = 'marigold';
      unmatched.set(guess[i], left - 1);
    }
  }

  return result;
}

/* -------------------------------------------------------------------------
   The puzzle
   ------------------------------------------------------------------------- */
class Puzzle {
  constructor(root) {
    this.root = root;
    this.row = root.querySelector('#puzzle-row');
    this.input = root.querySelector('#puzzle-input');
    this.status = root.querySelector('#puzzle-status');
    this.tiles = Array.from(this.row.querySelectorAll('.tile--slot'));

    this.busy = false;
    this.showingFeedback = false;
    this.solved = false;

    this.input.addEventListener('input', () => this.onInput());
    this.input.addEventListener('keydown', e => this.onKeydown(e));
    this.row.addEventListener('mousedown', e => {
      e.preventDefault();
      this.input.focus();
    });

    if (readUnlocked()) this.restoreSolved();
  }

  get value() {
    return this.input.value;
  }

  /* Mirror the input into the tiles, and mark where the next letter lands.
     On a full row the caret stays on the last tile so focus is always visible. */
  paint() {
    const chars = this.value.split('');
    const caret = Math.min(chars.length, LEN - 1);
    this.tiles.forEach((tile, i) => {
      tile.textContent = chars[i] || '';
      tile.classList.toggle('tile--active', i === caret && !this.solved);
    });
  }

  resetTiles() {
    this.tiles.forEach(clearFill);
    this.showingFeedback = false;
  }

  onInput() {
    if (this.busy || this.solved) return;

    // Letters only, uppercase, six at most.
    const cleaned = this.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, LEN);
    if (cleaned !== this.value) this.input.value = cleaned;

    // A previous guess is still coloured on screen — clear it as they retype.
    if (this.showingFeedback) this.resetTiles();

    this.paint();
  }

  onKeydown(e) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (this.busy || this.solved) return;

    if (this.value.length < LEN) {
      this.say(`Need ${LEN} letters (${this.value.length} so far).`);
      this.nudge();
      return;
    }
    this.submit();
  }

  nudge() {
    if (reducedMotion) return;
    this.row.classList.remove('is-wrong');
    void this.row.offsetWidth; // restart the animation
    this.row.classList.add('is-wrong');
    window.setTimeout(() => this.row.classList.remove('is-wrong'), 450);
  }

  say(text) {
    this.status.textContent = text;
    this.status.classList.remove('is-win');
  }

  async submit() {
    const guess = this.value;
    this.busy = true;
    this.say('');
    this.tiles.forEach(t => t.classList.remove('tile--active'));

    const fills = scoreGuess(guess, ANSWER);
    await flipRow(this.tiles, fills);

    this.busy = false;

    if (guess === ANSWER) {
      this.win();
    } else {
      this.showingFeedback = true;
      this.say('Not quite. Green means right spot; amber means right letter, wrong spot.');
      this.nudge();
    }
  }

  win() {
    this.solved = true;
    this.root.classList.add('is-solved');
    this.input.readOnly = true;
    this.tiles.forEach(t => t.classList.remove('tile--active'));

    this.status.classList.add('is-win');
    this.status.textContent = 'Got it. ';
    const link = document.createElement('a');
    link.href = '#about';
    link.textContent = 'Read the unlocked notes ↓';
    this.status.appendChild(link);

    writeUnlocked();
    unlockNote();
  }

  restoreSolved() {
    this.solved = true;
    this.root.classList.add('is-solved');
    this.input.value = ANSWER;
    this.input.readOnly = true;
    this.tiles.forEach((tile, i) => {
      tile.textContent = ANSWER[i];
      tile.classList.add(FILLS.jade, 'is-filled');
    });
    this.status.classList.add('is-win');
    this.status.textContent = 'Already solved. The hidden notes below are open.';
  }
}

/* -------------------------------------------------------------------------
   The reward
   ------------------------------------------------------------------------- */
function unlockNote() {
  const note = document.getElementById('note');
  const locked = document.getElementById('note-locked');
  const open = document.getElementById('note-open');
  if (!note || !locked || !open) return;

  note.dataset.locked = 'false';
  locked.hidden = true;
  open.hidden = false;
}

/* -------------------------------------------------------------------------
   Scrolling: rows that arrive, and a marker that knows where you are
   ------------------------------------------------------------------------- */
function revealRows() {
  if (!canReveal) return;

  const io = new IntersectionObserver(entries => {
    // Rows that arrive together (a fast scroll, a jump link) flip in reading order.
    const arriving = entries
      .filter(e => e.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

    arriving.forEach((e, i) => {
      e.target.style.setProperty('--reveal-delay', `${i * ROW_STAGGER_MS}ms`);
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });

    // Rows already above the viewport (a reload halfway down) just appear.
    entries
      .filter(e => !e.isIntersecting && e.boundingClientRect.bottom < 0)
      .forEach(e => {
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
  }, { rootMargin: '0px 0px -10% 0px' });

  document.querySelectorAll('.entry').forEach(row => io.observe(row));
}

function trackSection() {
  const nav = document.querySelector('.topbar__nav');
  if (!nav) return;

  const pairs = [...nav.querySelectorAll('a[href^="#"]')]
    .map(link => [link, document.getElementById(link.hash.slice(1))])
    .filter(([, section]) => section);
  if (!pairs.length) return;

  const marker = document.createElement('span');
  marker.className = 'topbar__marker';
  marker.setAttribute('aria-hidden', 'true');
  nav.appendChild(marker);

  let current = null;

  const place = () => {
    if (!current) {
      marker.classList.remove('is-on');
      return;
    }
    marker.style.setProperty('--marker-x', `${current.offsetLeft}px`);
    marker.style.setProperty('--marker-w', `${current.offsetWidth}px`);
    marker.classList.add('is-on');
  };

  // On narrow phones the nav scrolls sideways; keep the current link visible.
  const keepInView = link => {
    if (nav.scrollWidth <= nav.clientWidth) return;
    const left = link.offsetLeft - 8;
    const right = link.offsetLeft + link.offsetWidth + 8;
    const behavior = reducedMotion ? 'auto' : 'smooth';
    if (left < nav.scrollLeft) nav.scrollTo({ left, behavior });
    else if (right > nav.scrollLeft + nav.clientWidth) nav.scrollTo({ left: right - nav.clientWidth, behavior });
  };

  const update = () => {
    // A section is current once its top passes a line a third of the way down.
    // The stack strip between Games and About counts as Games, which reads right.
    const line = window.innerHeight * 0.35;
    const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    let next = null;
    for (const [link, section] of pairs) {
      if (section.getBoundingClientRect().top <= line) next = link;
    }
    if (atEnd) next = pairs[pairs.length - 1][0];
    if (next === current) return;

    if (current) current.removeAttribute('aria-current');
    current = next;
    if (current) {
      current.setAttribute('aria-current', 'location');
      keepInView(current);
    }
    place();
  };

  let queued = false;
  window.addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; update(); });
  }, { passive: true });
  window.addEventListener('resize', place);
  if (document.fonts) document.fonts.ready.then(place);

  // First placement lands without sliding in from the left edge.
  update();
  requestAnimationFrame(() => requestAnimationFrame(() => marker.classList.add('is-live')));
}

/* -------------------------------------------------------------------------
   Boot
   ------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  revealName();
  revealRows();
  trackSection();

  const root = document.getElementById('puzzle');
  if (!root) return;
  const puzzle = new Puzzle(root);

  // "Take me to the tiles"
  const jump = document.getElementById('note-jump');
  if (jump) {
    jump.addEventListener('click', () => {
      root.scrollIntoView({
        behavior: reducedMotion ? 'auto' : 'smooth',
        block: 'center'
      });
      window.setTimeout(() => puzzle.input.focus({ preventScroll: true }), reducedMotion ? 0 : 500);
    });
  }

  // Start typing anywhere while the puzzle is on screen and it picks it up.
  let puzzleVisible = false;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      ([entry]) => { puzzleVisible = entry.isIntersecting; },
      { threshold: 0.4 }
    ).observe(root);
  }

  document.addEventListener('keydown', e => {
    if (!puzzleVisible || puzzle.solved) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (document.activeElement !== document.body) return;
    if (!/^[a-zA-Z]$/.test(e.key)) return;

    puzzle.input.focus({ preventScroll: true });
    // The keypress that got us here still needs to land.
    e.preventDefault();
    puzzle.input.value = (puzzle.input.value + e.key).slice(0, LEN);
    puzzle.onInput();
  });
});
