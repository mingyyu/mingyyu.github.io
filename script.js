/**
 * Ming Yu — Index
 *
 * Two things happen on this page:
 *   1. The name flips into place once, on load.
 *   2. The six empty tiles under it are a real guessing game. Solving it
 *      unlocks the notes section further down.
 *
 * That's the whole script. Everything else is CSS.
 */

const ANSWER = 'WORDLE';
const LEN = ANSWER.length;
const STORE_KEY = 'mingyu.notes.unlocked';
const FLIP_MS = 500;
const STAGGER_MS = 90;

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
      this.say(`${LEN} letters. You have ${this.value.length}.`);
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
      this.say('Not it. Green is right and in place, amber is right but misplaced.');
      this.nudge();
    }
  }

  win() {
    this.solved = true;
    this.root.classList.add('is-solved');
    this.input.readOnly = true;
    this.tiles.forEach(t => t.classList.remove('tile--active'));

    this.status.classList.add('is-win');
    this.status.textContent = 'Correct. ';
    const link = document.createElement('a');
    link.href = '#about';
    link.textContent = 'The notes are unlocked ↓';
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
    this.status.textContent = 'Solved. The notes below are open.';
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
   Boot
   ------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  revealName();

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
