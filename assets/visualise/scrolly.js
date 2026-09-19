/**
 * Visualise — the scroll-driven stage
 *
 * A stage draws one frame at a time. A frame is a plain object that says
 * where every tile, box, dot and note sits, measured in grid cells; the stage
 * turns cells into pixels and CSS transitions do the in-betweening.
 *
 * Scroll position picks the frame. Each step of prose names the frames it
 * covers (data-from / data-to), and the reader's progress through that step
 * scrubs between them — so scrolling back rewinds.
 *
 * Scenes are built ahead of time by editing one state and snapping copies of
 * it (see Scene). Nothing is computed while scrolling but pixel positions.
 */
(function () {
  'use strict';

  const TILE = 0.82;              // tile edge, as a fraction of one grid cell
  const INSET = (1 - TILE) / 2;   // gap between a tile and its cell edge
  const PAD = 0.1;                // how far a box sits outside the tiles it wraps
  const DOT = 0.2;                // ledger dot edge, in cells
  const MAX_CELL = 72;            // px — past this, tiles stop growing
  const LEAVE_MS = 420;
  const PX_PER_FRAME = 26;        // scroll distance each frame is given

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const stacked = window.matchMedia('(max-width: 56rem)');

  const clone = (o) => JSON.parse(JSON.stringify(o));

  /* -----------------------------------------------------------------------
     Scene — build frames by editing one state and snapping it
     ----------------------------------------------------------------------- */
  class Scene {
    constructor(bounds) {
      this.s = { bounds, tiles: {}, boxes: {}, dots: {}, notes: {}, line: null, call: '', count: 0 };
      this.frames = [];
      this.marks = {};
    }

    tile(id, props) {
      const t = this.s.tiles[id] || (this.s.tiles[id] = { v: '', x: 0, y: 0, s: 'plain', r: false });
      Object.assign(t, props);
      return this;
    }

    box(id, props) {
      const b = this.s.boxes[id] || (this.s.boxes[id] = { x: 0, y: 0, w: 1, h: 1, s: 'wish', label: '' });
      Object.assign(b, props);
      return this;
    }

    unbox(id) {
      delete this.s.boxes[id];
      return this;
    }

    dot(id, props) {
      this.s.dots[id] = Object.assign({ s: 'on' }, props);
      return this;
    }

    undot(prefix) {
      for (const k of Object.keys(this.s.dots)) if (k.startsWith(prefix)) delete this.s.dots[k];
      return this;
    }

    note(id, props) {
      const n = this.s.notes[id] || (this.s.notes[id] = { x: 0, y: 0, text: '', a: 'l' });
      Object.assign(n, props);
      return this;
    }

    unnote(prefix) {
      for (const k of Object.keys(this.s.notes)) if (k.startsWith(prefix)) delete this.s.notes[k];
      return this;
    }

    set(props) {
      Object.assign(this.s, props);
      return this;
    }

    /** Clear every comparison ring. */
    rings() {
      for (const t of Object.values(this.s.tiles)) t.r = false;
      return this;
    }

    snap(mark) {
      if (mark) this.marks[mark] = this.frames.length;
      this.frames.push(clone(this.s));
      return this;
    }

    /** Name the frame that was just snapped. */
    mark(name) {
      this.marks[name] = this.frames.length - 1;
      return this;
    }

    get last() {
      return this.frames[this.frames.length - 1];
    }
  }

  /* -----------------------------------------------------------------------
     Stage — turns a frame into positioned elements
     ----------------------------------------------------------------------- */
  class Stage {
    constructor(root) {
      this.root = root;
      this.canvas = root.querySelector('[data-canvas]');
      this.callEl = root.querySelector('[data-call]');
      this.countEl = root.querySelector('[data-count]');
      this.code = root.querySelector('[data-code]');
      this.lines = this.code ? Array.from(this.code.querySelectorAll('[data-k]')) : [];
      this.els = new Map();
      this.current = null;
      this.lastLine = '';
      this.measure();
    }

    measure() {
      this.w = this.canvas.clientWidth;
      this.h = this.canvas.clientHeight;
    }

    /** Find or create the element for a key. Fresh ones skip their entrance transition. */
    el(key, cls) {
      let rec = this.els.get(key);
      if (rec) {
        if (rec.timer) {
          clearTimeout(rec.timer);
          rec.timer = 0;
        }
        rec.fresh = false;
        return rec;
      }
      const node = document.createElement('span');
      if (cls === 'vb') {
        const label = document.createElement('span');
        label.className = 'vb__label';
        node.appendChild(label);
      }
      this.canvas.appendChild(node);
      rec = { node, fresh: true, timer: 0 };
      this.els.set(key, rec);
      return rec;
    }

    render(f) {
      if (!f) return;
      this.current = f;
      if (!this.w || !this.h) this.measure();

      const { x0, y0, x1, y1 } = f.bounds;
      const cell = Math.max(4, Math.min(this.w / (x1 - x0), this.h / (y1 - y0), MAX_CELL));
      const ox = (this.w - (x1 - x0) * cell) / 2 - x0 * cell;
      const oy = (this.h - (y1 - y0) * cell) / 2 - y0 * cell;
      const px = (x) => ox + x * cell;
      const py = (y) => oy + y * cell;

      this.canvas.style.setProperty('--cell', cell + 'px');

      const seen = new Set();
      const entering = [];
      const place = (key, cls, extra, apply) => {
        seen.add(key);
        const rec = this.el(key, cls);
        rec.node.className = cls + ' ' + extra + (rec.fresh ? ' is-entering' : '');
        apply(rec.node);
        if (rec.fresh) entering.push(rec.node);
      };

      // Boxes first, so tiles paint over them
      for (const [id, b] of Object.entries(f.boxes)) {
        place('b:' + id, 'vb', 'vb--' + b.s, (n) => {
          n.style.width = (b.w - 2 * INSET + 2 * PAD) * cell + 'px';
          n.style.height = (b.h - 2 * INSET + 2 * PAD) * cell + 'px';
          n.style.transform = `translate(${px(b.x + INSET - PAD)}px, ${py(b.y + INSET - PAD)}px)`;
          const label = b.label || '';
          if (n.firstChild.textContent !== label) n.firstChild.textContent = label;
        });
      }

      const size = cell * TILE;
      const font = Math.max(10, size * 0.42);
      for (const [id, t] of Object.entries(f.tiles)) {
        place('t:' + id, 'vt', 'vt--' + t.s + (t.r ? ' is-ring' : ''), (n) => {
          n.style.width = size + 'px';
          n.style.height = size + 'px';
          n.style.fontSize = font + 'px';
          n.style.transform = `translate(${px(t.x + INSET)}px, ${py(t.y + INSET)}px)`;
          const txt = String(t.v);
          if (n.textContent !== txt) n.textContent = txt;
        });
      }

      const dot = Math.max(3, cell * DOT);
      for (const [id, d] of Object.entries(f.dots)) {
        place('d:' + id, 'vd', 'vd--' + d.s, (n) => {
          n.style.width = dot + 'px';
          n.style.height = dot + 'px';
          n.style.transform = `translate(${px(d.x) - dot / 2}px, ${py(d.y) - dot / 2}px)`;
        });
      }

      for (const [id, note] of Object.entries(f.notes)) {
        place('n:' + id, 'vn', 'vn--' + note.a, (n) => {
          n.style.transform = `translate(${px(note.x)}px, ${py(note.y)}px)`;
          if (n.textContent !== note.text) n.textContent = note.text;
        });
      }

      // Anything not in this frame fades, then goes
      for (const [key, rec] of this.els) {
        if (seen.has(key) || rec.timer) continue;
        rec.node.classList.add('is-leaving');
        rec.timer = setTimeout(() => {
          rec.node.remove();
          this.els.delete(key);
        }, reduceMotion.matches ? 0 : LEAVE_MS);
      }

      if (entering.length) {
        void this.canvas.offsetWidth; // commit starting styles before transitions switch on
        requestAnimationFrame(() => entering.forEach((n) => n.classList.remove('is-entering')));
      }

      if (this.callEl) this.callEl.textContent = f.call || ' ';
      if (this.countEl) this.countEl.textContent = f.count;
      this.highlight(f.line);
    }

    /** Re-render the current frame at a new size without animating. */
    refit() {
      this.measure();
      if (!this.current) return;
      this.canvas.classList.add('is-instant');
      this.render(this.current);
      void this.canvas.offsetWidth;
      requestAnimationFrame(() => this.canvas.classList.remove('is-instant'));
    }

    highlight(line) {
      if (!this.lines.length) return;
      const keys = line == null ? [] : [].concat(line);
      const sig = keys.join('|');
      if (sig === this.lastLine) return;
      this.lastLine = sig;

      let first = null;
      for (const l of this.lines) {
        const on = keys.includes(l.dataset.k);
        l.classList.toggle('is-on', on);
        if (on && !first) first = l;
      }
      if (first && this.code.scrollHeight > this.code.clientHeight + 2) {
        const top = first.offsetTop - (this.code.clientHeight - first.offsetHeight) / 2;
        this.code.scrollTo({ top, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      }
    }
  }

  /* -----------------------------------------------------------------------
     Scrolly — maps the reader's place in the prose to a frame
     ----------------------------------------------------------------------- */
  class Scrolly {
    constructor(section, scene) {
      this.section = section;
      this.stageEl = section.querySelector('[data-stage]');
      this.stage = new Stage(this.stageEl);
      this.frames = scene.frames;
      this.steps = Array.from(section.querySelectorAll('[data-from]')).map((el) => {
        const from = scene.marks[el.dataset.from];
        const to = scene.marks[el.dataset.to || el.dataset.from];
        if (from == null || to == null) {
          console.warn('[visualise] unknown mark:', el.dataset.from, el.dataset.to);
        }
        return { el, from: from ?? 0, to: to ?? from ?? 0 };
      });
      this.index = -1;
      this.active = null;
      this.size();
      this.show(this.steps.length ? this.steps[0].from : 0);
    }

    /**
     * Give each step enough scroll to play its frames at a readable pace.
     * On phones the stage sits on top, so a step's text can only hold still
     * beneath it if it fits in what's left of the screen.
     */
    size() {
      const vh = window.innerHeight;
      const tight = stacked.matches;
      let room = Infinity;
      if (tight) {
        const bar = document.querySelector('.topbar');
        const top = (bar ? bar.offsetHeight : 56) + this.stageEl.offsetHeight + 8;
        this.section.style.setProperty('--stuck-top', top + 'px');
        room = vh - top - 12;
      }
      for (const st of this.steps) {
        const n = Math.abs(st.to - st.from);
        const min = Math.max(vh * (tight ? 0.48 : 0.6), n * (tight ? PX_PER_FRAME * 0.85 : PX_PER_FRAME));
        st.el.style.minHeight = Math.round(min) + 'px';
        const body = st.el.firstElementChild;
        st.el.classList.toggle('is-fit', !tight || (body && body.offsetHeight <= room));
      }
    }

    readingLine() {
      if (stacked.matches) return this.stageEl.getBoundingClientRect().bottom + 24;
      return window.innerHeight * 0.42;
    }

    update() {
      if (!this.steps.length) return;
      const r = this.section.getBoundingClientRect();
      if (r.bottom < -400 || r.top > window.innerHeight + 400) return;

      const line = this.readingLine();
      let i = -1;
      let box = null;
      for (let k = 0; k < this.steps.length; k++) {
        const b = this.steps[k].el.getBoundingClientRect();
        if (b.top <= line) {
          i = k;
          box = b;
        } else break;
      }

      let frame;
      let activeEl = null;
      if (i < 0) {
        frame = this.steps[0].from;
      } else {
        const st = this.steps[i];
        // Play through the first 80% of the step; hold the last frame for the rest
        const p = Math.min(1, Math.max(0, (line - box.top) / (box.height * 0.8)));
        frame = Math.round(st.from + (st.to - st.from) * p);
        activeEl = st.el;
      }

      this.show(frame);
      if (activeEl !== this.active) {
        if (this.active) this.active.classList.remove('is-active');
        if (activeEl) activeEl.classList.add('is-active');
        this.active = activeEl;
      }
    }

    show(i) {
      const idx = Math.max(0, Math.min(this.frames.length - 1, i));
      if (idx === this.index) return;
      this.index = idx;
      this.stage.render(this.frames[idx]);
    }
  }

  /* -----------------------------------------------------------------------
     Wiring
     ----------------------------------------------------------------------- */
  const scrollies = [];
  let queued = false;

  function tick() {
    queued = false;
    for (const s of scrollies) s.update();
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(tick);
  }

  function mount(section, scene) {
    const s = new Scrolly(section, scene);
    scrollies.push(s);
    if ('ResizeObserver' in window) {
      new ResizeObserver(() => {
        s.stage.refit();
        schedule();
      }).observe(s.stage.canvas);
    }
    schedule();
    return s;
  }

  // Phones fire resize whenever the address bar slides; only a width change moves the layout
  let lastW = window.innerWidth;
  let lastH = window.innerHeight;
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (w === lastW && Math.abs(h - lastH) < 140) return schedule();
    lastW = w;
    lastH = h;
    for (const s of scrollies) {
      s.size();
      s.stage.refit();
    }
    schedule();
  });

  window.Visualise = { Scene, mount };
})();
