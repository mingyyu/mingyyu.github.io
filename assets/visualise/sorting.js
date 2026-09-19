/**
 * Sorting by wishful thinking — the scenes, the cost figures, and the coda.
 *
 * Every scene is a real run of the algorithm on the same eight numbers.
 * Each comparison the code makes is one ring on the stage and one dot in the
 * ledger, so the counts on screen are the counts the code would produce.
 *
 * Grid conventions (in cells): x runs along the list, y runs down the
 * recursion — one row per level of depth. Tiles are keyed by value, so a
 * tile keeps its identity from the first frame to the last.
 */
(function () {
  'use strict';

  const V = window.Visualise;
  if (!V) return;

  const INPUT = [5, 2, 7, 4, 1, 8, 3, 6];
  const N = INPUT.length;
  const LIFT = -0.36;             // how far a tile "in hand" floats above its row

  const asc = (xs) => [...xs].sort((a, b) => a - b);
  const L = (xs) => (xs.length ? `llist(${xs.join(', ')})` : 'None');
  const id = (v) => 'n' + v;

  /* -----------------------------------------------------------------------
     Shared furniture
     ----------------------------------------------------------------------- */

  /** Depth numbers down the left edge, and a header over the ledger. */
  function furniture(sc, rows, Y, LX) {
    sc.unnote('depth');
    sc.note('depth', { x: -1.55, y: -0.55, text: 'depth', a: 'l' });
    for (let r = 0; r < rows; r++) sc.note('depth' + r, { x: -0.3, y: Y(r) + 0.5, text: String(r), a: 'r' });
    sc.note('ledger', { x: LX - 0.02, y: -0.55, text: 'compares', a: 'l' });
  }

  /** One dot per comparison, on the row of the call that made it. */
  function makeLedger(sc, LX, Y, sub = false) {
    const P = 0.3;
    const rowsY = sub ? [0.32, 0.68] : [0.5];
    const counts = {};
    return {
      tick(row, lane = 0) {
        const k = row + ':' + lane;
        const i = counts[k] || 0;
        counts[k] = i + 1;
        sc.dot(`d${row}-${lane}-${i}`, { x: LX + 0.1 + i * P, y: Y(row) + rowsY[lane] });
        sc.s.count++;
      },
      /** Hollow dots up to a row's ceiling: the comparisons it could have made. */
      ghost(row, upTo) {
        for (let i = counts[row + ':0'] || 0; i < upTo; i++) {
          sc.dot(`g${row}-${i}`, { x: LX + 0.1 + i * P, y: Y(row) + 0.5, s: 'ghost' });
        }
      },
      reset() {
        for (const k of Object.keys(counts)) delete counts[k];
        sc.undot('d');
        sc.undot('g');
      },
    };
  }

  /**
   * insert(x, xs), animated. x starts at `col`, lifted; xs sits sorted to its
   * right. Each smaller head slides left under x — that is pair(head(xs), …).
   */
  function walkInsert(sc, x, xs, col, y, tick) {
    sc.rings().tile(id(x), { s: 'hand', x: col, y: y + LIFT });
    sc.set({ line: 'ins-if', call: `insert(${x}, ${L(xs)})` }).snap();
    let pos = col;
    for (let k = 0; ; k++) {
      const rest = xs.slice(k);
      if (!rest.length) {
        sc.rings().tile(id(x), { x: pos, y, s: 'done' });
        sc.set({ line: 'ins-base', call: `insert(${x}, None) → llist(${x})` }).snap();
        return;
      }
      const hd = rest[0];
      sc.rings().tile(id(hd), { r: true });
      tick();
      sc.set({ line: 'ins-cmp', call: `insert(${x}, ${L(rest)})` }).snap();
      if (x <= hd) {
        sc.rings().tile(id(x), { x: pos, y, s: 'done' });
        sc.set({ line: 'ins-front' }).snap();
        return;
      }
      sc.rings().tile(id(hd), { x: pos }).tile(id(x), { x: pos + 1 });
      sc.set({ line: 'ins-else' }).snap();
      pos++;
    }
  }

  /* -----------------------------------------------------------------------
     Insertion sort — split off the head, compare on the way back up
     ----------------------------------------------------------------------- */
  function insertion() {
    const Y = (r) => r * 1.3;
    const LX = 8.7;
    const near = { x0: -0.45, y0: -1.0, x1: 8.45, y1: 2.35 };
    const full = { x0: -1.6, y0: -1.05, x1: LX + 2.7, y1: Y(N - 1) + 1.2 };
    const sc = new V.Scene(near);
    const led = makeLedger(sc, LX, Y);

    // Act one: a single call, and a wish
    INPUT.forEach((v, i) => sc.tile(id(v), { v, x: i, y: 0 }));
    sc.set({ line: 'is-if', call: `insertion_sort(${L(INPUT)})` }).snap('i-start');

    const [h, ...t] = INPUT;
    sc.tile(id(h), { s: 'hand' });
    sc.box('wish', { x: 1, y: 0, w: t.length, h: 1, s: 'wish', label: 'insertion_sort(tail(xs))' });
    sc.set({ line: 'is-rec', call: `insert(${h}, insertion_sort(${L(t)}))` }).snap('i-wish');

    const st = asc(t);
    st.forEach((v, k) => sc.tile(id(v), { x: 1 + k, s: 'hidden' }));
    sc.box('wish', { s: 'sealed' }).snap('i-sealed');

    st.forEach((v) => sc.tile(id(v), { s: 'done' }));
    sc.box('wish', { s: 'wish' }).set({ call: `insert(${h}, ${L(st)})` }).snap('i-trust');

    sc.unbox('wish');
    walkInsert(sc, h, st, 0, 0, () => sc.s.count++);
    sc.last.call = `→ ${L(asc(INPUT))}`;
    sc.mark('i-inserted');

    // Act two: open every box
    sc.set({ bounds: full, count: 0, line: 'is-if', call: `insertion_sort(${L(INPUT)})` });
    INPUT.forEach((v, i) => sc.tile(id(v), { x: i, y: Y(0), s: 'plain', r: false }));
    furniture(sc, N, Y, LX);
    sc.snap('i-open');

    for (let r = 0; r < N; r++) {
      const tail = INPUT.slice(r + 1);
      sc.tile(id(INPUT[r]), { s: 'wait' });
      tail.forEach((v) => sc.tile(id(v), { y: Y(r + 1) }));
      if (tail.length) {
        sc.box('h' + r, { x: r + 1, y: Y(r), w: tail.length, h: 1, s: 'wish', label: '' });
        sc.set({ line: 'is-rec', call: `insertion_sort(${L(tail)})` });
      } else {
        sc.note('none', { x: r + 1.12, y: Y(r) + 0.5, text: 'None', a: 'l' });
        sc.set({ line: 'is-base', call: 'insertion_sort(None) → None' });
      }
      sc.snap('i-d' + r);
    }

    let sorted = [];
    for (let r = N - 1; r >= 0; r--) {
      const x = INPUT[r];
      // The call below returns; its answer rises into this row's box
      sc.unbox('h' + r).unnote('none');
      sorted.forEach((v, k) => sc.tile(id(v), { x: r + 1 + k, y: Y(r) }));
      sc.set({ line: 'is-rec', call: `insert(${x}, ${L(sorted)})` }).snap();
      walkInsert(sc, x, sorted, r, Y(r), () => led.tick(r));
      sorted = asc([x, ...sorted]);
      sc.last.call = `→ ${L(sorted)}`;
      sc.mark('i-u' + r);
    }

    for (let r = 0; r < N; r++) led.ghost(r, N - 1 - r);
    sc.set({ line: null, call: `${sc.s.count} comparisons, out of a possible ${(N * (N - 1)) / 2}` });
    sc.snap('i-cost');
    return sc;
  }

  /* -----------------------------------------------------------------------
     Selection sort — find the smallest on the way down, pair on the way up
     ----------------------------------------------------------------------- */
  function selection() {
    const Y = (r) => r * 1.3;
    const LX = 8.7;
    const near = { x0: -0.45, y0: -1.0, x1: 8.45, y1: 2.35 };
    const full = { x0: -1.6, y0: -1.05, x1: LX + 2.7, y1: Y(N - 1) + 1.2 };
    const sc = new V.Scene(near);
    const led = makeLedger(sc, LX, Y);

    /** smallest(xs): reduce, keeping whichever of two is less. */
    function scan(list, tick) {
      let m = list[0];
      sc.rings().tile(id(m), { s: 'hand' });
      sc.set({ line: 'ss-small', call: `smallest(${L(list)})` }).snap();
      for (const v of list.slice(1)) {
        sc.rings().tile(id(v), { r: true });
        tick();
        sc.set({ line: 'sm-lambda' }).snap();
        if (v < m) {
          sc.rings().tile(id(m), { s: 'plain' }).tile(id(v), { s: 'hand' });
          m = v;
          sc.snap();
        }
      }
      sc.rings();
      return m;
    }

    // Act one
    INPUT.forEach((v, i) => sc.tile(id(v), { v, x: i, y: 0 }));
    sc.set({ line: 'ss-if', call: `selection_sort(${L(INPUT)})` }).snap('s-start');

    const m = scan(INPUT, () => sc.s.count++);
    sc.mark('s-found');

    const rest = INPUT.filter((v) => v !== m);
    sc.tile(id(m), { y: LIFT }).set({ call: `smallest(${L(INPUT)}) → ${m}` }).snap();
    sc.tile(id(m), { x: 0 });
    rest.forEach((v, k) => sc.tile(id(v), { x: 1 + k }));
    sc.box('wish', { x: 1, y: 0, w: rest.length, h: 1, s: 'wish', label: 'selection_sort(remove(x, xs))' });
    sc.set({ line: 'ss-rec', call: `pair(${m}, selection_sort(${L(rest)}))` }).snap();
    sc.tile(id(m), { y: 0 }).snap('s-wish');

    const rs = asc(rest);
    rs.forEach((v, k) => sc.tile(id(v), { x: 1 + k, s: 'hidden' }));
    sc.box('wish', { s: 'sealed' }).snap('s-sealed');
    rs.forEach((v) => sc.tile(id(v), { s: 'done' }));
    sc.box('wish', { s: 'wish' }).set({ call: `pair(${m}, ${L(rs)})` }).snap('s-trust');
    sc.unbox('wish').tile(id(m), { s: 'done' }).set({ call: `→ ${L(asc(INPUT))}` }).snap('s-paired');

    // Act two
    sc.set({ bounds: full, count: 0, line: 'ss-if', call: `selection_sort(${L(INPUT)})` });
    INPUT.forEach((v, i) => sc.tile(id(v), { x: i, y: Y(0), s: 'plain', r: false }));
    furniture(sc, N, Y, LX);
    sc.snap('s-open');

    let rem = INPUT.slice();
    for (let r = 0; r < N; r++) {
      const mm = scan(rem, () => led.tick(r));
      const left = rem.filter((v) => v !== mm);
      sc.tile(id(mm), { y: Y(r) + LIFT }).set({ call: `smallest(${L(rem)}) → ${mm}` }).snap();
      sc.tile(id(mm), { x: r });
      left.forEach((v, k) => sc.tile(id(v), { x: r + 1 + k, y: Y(r + 1) }));
      if (left.length) sc.box('h' + r, { x: r + 1, y: Y(r), w: left.length, h: 1, s: 'wish', label: '' });
      else sc.note('none', { x: r + 1.12, y: Y(r) + 0.5, text: 'None', a: 'l' });
      sc.set({ line: 'ss-rec', call: `pair(${mm}, selection_sort(${L(left)}))` }).snap();
      sc.tile(id(mm), { y: Y(r), s: 'wait' }).snap('s-d' + r);
      rem = left;
    }
    sc.set({ line: 'ss-base', call: 'selection_sort(None) → None' }).snap('s-bottom');

    const all = asc(INPUT);
    let out = [];
    for (let r = N - 1; r >= 0; r--) {
      sc.unbox('h' + r).unnote('none');
      out.forEach((v, k) => sc.tile(id(v), { x: r + 1 + k, y: Y(r) }));
      sc.tile(id(all[r]), { s: 'done' });
      sc.set({ line: 'ss-rec', call: `pair(${all[r]}, ${L(out)})` });
      out = [all[r], ...out];
      sc.snap('s-u' + r);
    }
    sc.set({ line: null, call: `${sc.s.count} comparisons, for any input of eight` }).snap('s-cost');
    return sc;
  }

  /* -----------------------------------------------------------------------
     Merge sort — cut in half, compare on the way back up
     ----------------------------------------------------------------------- */
  function merge() {
    // Slots carry small gaps at every level of halving, so tiles never shift
    // sideways as they move between rows.
    const SX = [0, 1.15, 2.5, 3.65, 5.25, 6.4, 7.75, 8.9];
    const RIGHT = SX[N - 1] + 1;
    const Y = (d) => d * 1.75;
    const LX = RIGHT + 0.75;
    const near = { x0: -0.45, y0: -0.6, x1: RIGHT + 0.45, y1: Y(1) + 2.0 };
    const full = { x0: -1.6, y0: -1.05, x1: LX + 2.7, y1: Y(3) + 1.2 };
    const span = (a, b, d) => ({ x: SX[a], y: Y(d), w: SX[b - 1] + 1 - SX[a], h: 1 });
    const sc = new V.Scene(near);
    const led = makeLedger(sc, LX, Y);

    /** merge(xs, ys): two sorted rows at depth d+1 zip into row d from slot a. */
    function zip(left, right, a, d, tick) {
      let i = 0;
      let j = 0;
      let k = a;
      const out = [];
      while (i < left.length && j < right.length) {
        const x = left[i];
        const y = right[j];
        sc.rings().tile(id(x), { r: true }).tile(id(y), { r: true });
        tick(d);
        sc.set({ line: 'mg-cmp', call: `merge(${L(left.slice(i))}, ${L(right.slice(j))})` }).snap();
        const takeLeft = x < y;
        const v = takeLeft ? x : y;
        if (takeLeft) i++;
        else j++;
        sc.rings().tile(id(v), { x: SX[k++], y: Y(d), s: 'done' });
        sc.set({ line: takeLeft ? 'mg-left' : 'mg-right' }).snap();
        out.push(v);
      }
      const leftOver = i < left.length;
      const rest = leftOver ? left.slice(i) : right.slice(j);
      if (rest.length) {
        rest.forEach((v) => {
          sc.tile(id(v), { x: SX[k++], y: Y(d), s: 'done' });
          out.push(v);
        });
        sc.set({
          line: leftOver ? 'mg-xs' : 'mg-ys',
          call: leftOver ? `merge(${L(rest)}, None)` : `merge(None, ${L(rest)})`,
        }).snap();
      }
      return out;
    }

    // Act one: two wishes and a merge
    INPUT.forEach((v, i) => sc.tile(id(v), { v, x: SX[i], y: 0 }));
    sc.set({ line: 'ms-if', call: `merge_sort(${L(INPUT)})` }).snap('m-start');

    const lv = INPUT.slice(0, N / 2);
    const rv = INPUT.slice(N / 2);
    INPUT.forEach((v) => sc.tile(id(v), { y: Y(1) }));
    sc.box('L', { ...span(0, N / 2, 1), s: 'wish', label: 'merge_sort(take(xs, mid))' });
    sc.box('R', { ...span(N / 2, N, 1), s: 'wish', label: 'merge_sort(drop(xs, mid))' });
    sc.set({ line: ['ms-mid', 'ms-rec', 'ms-rec2'], call: `merge(merge_sort(${L(lv)}), merge_sort(${L(rv)}))` });
    sc.snap('m-split');

    const ls = asc(lv);
    const rs = asc(rv);
    ls.forEach((v, k) => sc.tile(id(v), { x: SX[k], s: 'hidden' }));
    rs.forEach((v, k) => sc.tile(id(v), { x: SX[N / 2 + k], s: 'hidden' }));
    sc.box('L', { s: 'sealed' }).box('R', { s: 'sealed' }).snap('m-sealed');

    [...ls, ...rs].forEach((v) => sc.tile(id(v), { s: 'done' }));
    sc.box('L', { s: 'wish' }).box('R', { s: 'wish' });
    sc.set({ line: ['ms-rec', 'ms-rec2'], call: `merge(${L(ls)}, ${L(rs)})` }).snap('m-trust');

    zip(ls, rs, 0, 0, () => sc.s.count++);
    sc.unbox('L').unbox('R').set({ line: null, call: `→ ${L(asc(INPUT))}` }).snap('m-merged');

    // Act two: every box opened, in the order Python actually runs them
    sc.set({ bounds: full, count: 0, line: 'ms-if', call: `merge_sort(${L(INPUT)})` });
    INPUT.forEach((v, i) => sc.tile(id(v), { x: SX[i], y: Y(0), s: 'plain', r: false }));
    furniture(sc, 4, Y, LX);
    sc.box('c0-0', { ...span(0, N, 0), s: 'active', label: '' });
    sc.snap('m-open');

    function sortNode(vals, a, d) {
      const b = a + vals.length;
      const key = `c${d}-${a}`;
      if (vals.length === 1) {
        sc.tile(id(vals[0]), { s: 'done' }).box(key, { s: 'done' });
        sc.set({ line: 'ms-base', call: `merge_sort(${L(vals)}) → ${L(vals)}` }).snap(`m-ret-${d}-${a}`);
        return vals;
      }
      const m = Math.floor(vals.length / 2);
      const lo = vals.slice(0, m);
      const hi = vals.slice(m);

      // The left half goes down. The right half stays behind in xs, not yet cut off.
      lo.forEach((v) => sc.tile(id(v), { y: Y(d + 1) }));
      hi.forEach((v) => sc.tile(id(v), { s: 'dim' }));
      sc.box(key, { s: 'wait' }).box(`c${d + 1}-${a}`, { ...span(a, a + m, d + 1), s: 'active', label: '' });
      sc.set({ line: ['ms-mid', 'ms-rec'], call: `merge_sort(${L(lo)})` }).snap(`m-go-${d + 1}-${a}`);
      const sortedLo = sortNode(lo, a, d + 1);

      // Only once the left half is back does the right half start
      hi.forEach((v) => sc.tile(id(v), { y: Y(d + 1), s: 'plain' }));
      sc.box(key, { s: 'wait' }).box(`c${d + 1}-${a + m}`, { ...span(a + m, b, d + 1), s: 'active', label: '' });
      sc.set({ line: 'ms-rec2', call: `merge_sort(${L(hi)})` }).snap(`m-go-${d + 1}-${a + m}`);
      const sortedHi = sortNode(hi, a + m, d + 1);

      sc.box(key, { s: 'active' });
      const out = zip(sortedLo, sortedHi, a, d, (row) => led.tick(row));
      sc.unbox(`c${d + 1}-${a}`).unbox(`c${d + 1}-${a + m}`).box(key, { s: 'done' });
      sc.set({ line: null, call: `→ ${L(out)}` }).snap(`m-ret-${d}-${a}`);
      return out;
    }
    sortNode(INPUT, 0, 0);

    for (let d = 0; d < 3; d++) led.ghost(d, N - 2 ** d);
    sc.set({ line: null, call: `${sc.s.count} comparisons over log₂ 8 = 3 levels` }).snap('m-cost');
    return sc;
  }

  /* -----------------------------------------------------------------------
     Quicksort — split around a pivot on the way down, append on the way up
     ----------------------------------------------------------------------- */
  function quick() {
    const P = 1.12;
    const X = (i) => i * P;
    const RIGHT = X(N - 1) + 1;
    const Y = (d) => d * 1.6;
    const YW = (d) => d * 1.15;
    const LX = RIGHT + 0.75;
    const near = { x0: -0.45, y0: -0.6, x1: RIGHT + 0.45, y1: Y(1) + 2.0 };
    const full = { x0: -1.6, y0: -1.05, x1: LX + 2.7, y1: Y(3) + 1.2 };
    const worst = { x0: -1.6, y0: -1.05, x1: LX + 2.7, y1: YW(N - 1) + 1.2 };
    const span = (a, b, d, Yf) => ({ x: X(a), y: Yf(d), w: X(b - 1) + 1 - X(a), h: 1 });
    const sc = new V.Scene(near);

    // Act one: one partition, told element by element
    INPUT.forEach((v, i) => sc.tile(id(v), { v, x: X(i), y: 0 }));
    sc.set({ line: 'qs-if', call: `quicksort(${L(INPUT)})` }).snap('q-start');

    const [p, ...tail] = INPUT;
    sc.tile(id(p), { s: 'hand' }).set({ line: 'qs-p', call: `p = head(xs) = ${p}` }).snap('q-pivot');

    const sm = tail.filter((v) => v < p);
    const lg = tail.filter((v) => v >= p);
    let k = 0;
    for (const v of tail) {
      sc.rings().tile(id(v), { r: true });
      sc.s.count++;
      sc.set({ line: 'qs-small', call: `filter(lambda x: x < ${p}, ${L(tail)})` }).snap();
      if (v < p) sc.rings().tile(id(v), { x: X(k++), y: Y(1) }).snap();
    }
    sc.mark('q-pass1');
    k = sm.length + 1;
    for (const v of tail) {
      sc.rings().tile(id(v), { r: true });
      sc.s.count++;
      sc.set({ line: 'qs-large', call: `filter(lambda x: x >= ${p}, ${L(tail)})` }).snap();
      if (v >= p) sc.rings().tile(id(v), { x: X(k++), y: Y(1) }).snap();
    }
    sc.rings().tile(id(p), { x: X(sm.length), s: 'done' });
    sc.box('S', { ...span(0, sm.length, 1, Y), s: 'wish', label: 'quicksort(smaller)' });
    sc.box('G', { ...span(sm.length + 1, N, 1, Y), s: 'wish', label: 'quicksort(larger)' });
    sc.set({ line: ['qs-app', 'qs-app2'], call: `append(quicksort(${L(sm)}), pair(${p}, quicksort(${L(lg)})))` });
    sc.snap('q-split');

    const ss = asc(sm);
    const gs = asc(lg);
    ss.forEach((v, i) => sc.tile(id(v), { x: X(i), s: 'hidden' }));
    gs.forEach((v, i) => sc.tile(id(v), { x: X(sm.length + 1 + i), s: 'hidden' }));
    sc.box('S', { s: 'sealed' }).box('G', { s: 'sealed' }).snap('q-sealed');
    [...ss, ...gs].forEach((v) => sc.tile(id(v), { s: 'done' }));
    sc.box('S', { s: 'wish' }).box('G', { s: 'wish' });
    sc.set({ call: `append(${L(ss)}, pair(${p}, ${L(gs)}))` }).snap('q-trust');
    [...ss, ...gs].forEach((v) => sc.tile(id(v), { y: 0 }));
    sc.unbox('S').unbox('G').set({ call: `→ ${L(asc(INPUT))}` }).snap('q-joined');

    /** One quicksort call at depth d, owning columns a .. a+vals.length-1. */
    function qsNode(vals, a, d, Yf, led, tag) {
      if (!vals.length) return [];
      const key = `q${d}-${a}`;
      const b = a + vals.length;
      const [pv, ...rest] = vals;
      sc.box(key, { ...span(a, b, d, Yf), s: 'active', label: '' });
      sc.tile(id(pv), { s: 'hand' });
      sc.set({ line: 'qs-p', call: `quicksort(${L(vals)})` }).snap(`${tag}-go-${d}-${a}`);
      if (!rest.length) {
        sc.tile(id(pv), { s: 'done' }).box(key, { s: 'done' });
        sc.set({ line: ['qs-app', 'qs-app2'], call: `→ ${L(vals)}` }).snap(`${tag}-ret-${d}-${a}`);
        return vals;
      }
      const lo = rest.filter((v) => v < pv);
      const hi = rest.filter((v) => v >= pv);
      const c = a + lo.length; // where the pivot ends up, for good

      rest.forEach((v) => {
        sc.tile(id(v), { r: true });
        led.tick(d, 0);
      });
      sc.set({ line: 'qs-small', call: `filter(lambda x: x < ${pv}, …) → ${L(lo)}` }).snap();
      sc.rings();
      if (lo.length) {
        lo.forEach((v, i) => sc.tile(id(v), { x: X(a + i), y: Yf(d + 1) }));
        sc.box(`q${d + 1}-${a}`, { ...span(a, c, d + 1, Yf), s: 'wish', label: '' });
        sc.snap();
      }
      rest.forEach((v) => {
        sc.tile(id(v), { r: true });
        led.tick(d, 1);
      });
      sc.set({ line: 'qs-large', call: `filter(lambda x: x >= ${pv}, …) → ${L(hi)}` }).snap();
      sc.rings();
      hi.forEach((v, i) => sc.tile(id(v), { x: X(c + 1 + i), y: Yf(d + 1) }));
      if (hi.length) sc.box(`q${d + 1}-${c + 1}`, { ...span(c + 1, b, d + 1, Yf), s: 'wish', label: '' });
      sc.tile(id(pv), { x: X(c), s: 'done' }).box(key, { s: 'wait' });
      sc.set({ line: ['qs-app', 'qs-app2'], call: `append(quicksort(${L(lo)}), pair(${pv}, quicksort(${L(hi)})))` });
      sc.snap();

      const sLo = qsNode(lo, a, d + 1, Yf, led, tag);
      const sHi = qsNode(hi, c + 1, d + 1, Yf, led, tag);

      [...sLo, ...sHi].forEach((v) => sc.tile(id(v), { y: Yf(d) }));
      sc.unbox(`q${d + 1}-${a}`).unbox(`q${d + 1}-${c + 1}`).box(key, { s: 'done' });
      const out = [...sLo, pv, ...sHi];
      sc.set({ line: ['qs-app', 'qs-app2'], call: `→ ${L(out)}` }).snap(`${tag}-ret-${d}-${a}`);
      return out;
    }

    // Act two: every box opened
    sc.set({ bounds: full, count: 0, line: 'qs-if', call: `quicksort(${L(INPUT)})` });
    INPUT.forEach((v, i) => sc.tile(id(v), { x: X(i), y: Y(0), s: 'plain', r: false }));
    furniture(sc, 4, Y, LX);
    const led = makeLedger(sc, LX, Y, true);
    sc.snap('q-open');
    qsNode(INPUT, 0, 0, Y, led, 'q');
    sc.set({ line: null, call: `${sc.s.count} comparisons: two filters, each over the tail` }).snap('q-done');

    // Act three: the same code, handed a list that is already sorted
    led.reset();
    const sorted = asc(INPUT);
    sc.set({ bounds: worst, count: 0, line: 'qs-if', call: `quicksort(${L(sorted)})` });
    for (const key of Object.keys(sc.s.boxes)) sc.unbox(key);
    sorted.forEach((v, i) => sc.tile(id(v), { x: X(i), y: YW(0), s: 'plain', r: false }));
    furniture(sc, N, YW, LX);
    sc.snap('w-start');
    const ledW = makeLedger(sc, LX, YW, true);
    qsNode(sorted, 0, 0, YW, ledW, 'w');
    sc.set({ line: null, call: `${sc.s.count} comparisons, ${N} levels deep` }).snap('w-cost');
    return sc;
  }

  /* -----------------------------------------------------------------------
     Code panels — light syntax colour, applied once
     ----------------------------------------------------------------------- */
  function colourCode(root) {
    root.querySelectorAll('.cl').forEach((line) => {
      const src = line.textContent;
      const esc = src.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      line.innerHTML = esc
        .replace(/\bdef\s+([a-z_]+)/g, '<b class="tk-k">def</b> <b class="tk-f">$1</b>')
        .replace(/\b(if|elif|else|return|lambda|or|not|while)\b/g, '<b class="tk-k">$1</b>')
        .replace(/\bNone\b/g, '<b class="tk-c">None</b>');
    });
  }

  /* -----------------------------------------------------------------------
     What it costs — counting comparisons at every level of recursion
     ----------------------------------------------------------------------- */
  const ALGOS = [
    { key: 'insertion', name: 'Insertion sort', colour: '#17875C' },
    { key: 'selection', name: 'Selection sort', colour: '#2B3FC4' },
    { key: 'merge', name: 'Merge sort', colour: '#C1801A' },
    { key: 'quick', name: 'Quicksort', colour: '#A8325E' },
  ];

  /** Comparisons per level of recursion, counted the way the code above makes them. */
  const perLevel = {
    insertion(a) {
      const lv = new Array(a.length).fill(0);
      let sorted = [];
      for (let r = a.length - 1; r >= 0; r--) {
        const x = a[r];
        let c = 0;
        let i = 0;
        while (i < sorted.length) {
          c++;
          if (x <= sorted[i]) break;
          i++;
        }
        sorted.splice(i, 0, x);
        lv[r] = c;
      }
      return lv;
    },
    selection(a) {
      return a.map((_, r) => a.length - r - 1);
    },
    merge(a) {
      const lv = [];
      (function ms(xs, d) {
        if (xs.length <= 1) return xs;
        const m = xs.length >> 1;
        const l = ms(xs.slice(0, m), d + 1);
        const r = ms(xs.slice(m), d + 1);
        const out = [];
        let i = 0;
        let j = 0;
        let c = 0;
        while (i < l.length && j < r.length) {
          c++;
          out.push(l[i] < r[j] ? l[i++] : r[j++]);
        }
        lv[d] = (lv[d] || 0) + c;
        return out.concat(l.slice(i), r.slice(j));
      })(a, 0);
      return Array.from(lv, (v) => v || 0);
    },
    quick(a) {
      const lv = [];
      (function qs(xs, d) {
        if (!xs.length) return xs;
        const [p, ...t] = xs;
        lv[d] = (lv[d] || 0) + 2 * t.length;
        return [...qs(t.filter((x) => x < p), d + 1), p, ...qs(t.filter((x) => x >= p), d + 1)];
      })(a, 0);
      return Array.from(lv, (v) => v || 0);
    },
  };

  const sum = (xs) => xs.reduce((s, v) => s + v, 0);

  function rng(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeInput(n, order, seed = 1) {
    const xs = Array.from({ length: n }, (_, i) => i + 1);
    if (order === 'sorted') return xs;
    if (order === 'reversed') return xs.reverse();
    const rand = rng(seed * 7919 + n);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [xs[i], xs[j]] = [xs[j], xs[i]];
    }
    return xs;
  }

  const SVG = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs = {}, parent) {
    const node = document.createElementNS(SVG, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    if (parent) parent.appendChild(node);
    return node;
  }

  const fmt = (n) => Math.round(n).toLocaleString('en-GB');

  /* ---- The shape of the work: one row per level, one square per comparison ---- */
  function drawShapes(host, order) {
    const n = 32;
    const input = makeInput(n, order, 3);
    const pitch = 5;
    const sq = 4;
    const maxW = 2 * (n - 1) * pitch; // quicksort's widest possible row
    host.textContent = '';
    for (const algo of ALGOS) {
      const lv = perLevel[algo.key](input);
      const fig = document.createElement('div');
      fig.className = 'shape';
      const head = document.createElement('p');
      head.className = 'shape__head';
      const name = document.createElement('span');
      name.className = 'shape__name';
      name.textContent = algo.name;
      const total = document.createElement('span');
      total.className = 'shape__total';
      total.textContent = `${fmt(sum(lv))} comparisons, ${lv.length} levels`;
      head.append(name, total);

      // Every panel shares one scale, so area compares honestly; each is only as tall as it is deep
      const h = Math.max(1, lv.length) * pitch;
      const s = svg('svg', {
        class: 'shape__svg',
        viewBox: `0 0 ${maxW} ${h}`,
        role: 'img',
        'aria-label': `${algo.name}: ${sum(lv)} comparisons across ${lv.length} levels of recursion`,
      });
      const g = svg('g', { fill: algo.colour }, s);
      lv.forEach((c, row) => {
        for (let i = 0; i < c; i++) svg('rect', { x: i * pitch, y: row * pitch, width: sq, height: sq, rx: 0.6 }, g);
      });
      fig.append(head, s);
      host.appendChild(fig);
    }
  }

  /* ---- Growth: total comparisons as the list gets longer ---- */
  function growthData(order) {
    const ns = [];
    for (let n = 2; n <= 100; n++) ns.push(n);
    const trials = order === 'random' ? 16 : 1;
    const series = ALGOS.map((algo) => ({
      ...algo,
      values: ns.map((n) => {
        let t = 0;
        for (let s = 1; s <= trials; s++) t += sum(perLevel[algo.key](makeInput(n, order, s)));
        return t / trials;
      }),
    }));
    return { ns, series };
  }

  function niceMax(v) {
    const pow = 10 ** Math.floor(Math.log10(v));
    for (const m of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * pow >= v) return m * pow;
    return 10 * pow;
  }

  function drawGrowth(host, tip, data) {
    host.querySelectorAll('svg').forEach((n) => n.remove());
    const W = Math.max(300, host.clientWidth);
    const H = W < 560 ? 260 : 320;
    const m = { l: 52, r: W < 560 ? 78 : 104, t: 14, b: 40 };
    const iw = W - m.l - m.r;
    const ih = H - m.t - m.b;
    const top = niceMax(Math.max(...data.series.flatMap((s) => s.values)));
    const x = (n) => m.l + ((n - 0) / 100) * iw;
    const y = (v) => m.t + ih - (v / top) * ih;

    const s = svg('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, class: 'growth__svg', 'aria-hidden': 'true' });

    const grid = svg('g', { class: 'growth__grid' }, s);
    for (let i = 0; i <= 4; i++) {
      const v = (top / 4) * i;
      svg('line', { x1: m.l, x2: m.l + iw, y1: y(v), y2: y(v) }, grid);
      const t = svg('text', { x: m.l - 8, y: y(v), dy: '0.32em', 'text-anchor': 'end' }, grid);
      t.textContent = fmt(v);
    }
    for (const n of [0, 25, 50, 75, 100]) {
      const t = svg('text', { x: x(n), y: m.t + ih + 20, 'text-anchor': 'middle' }, grid);
      t.textContent = n;
    }
    const xl = svg('text', { x: m.l + iw, y: m.t + ih + 36, 'text-anchor': 'end', class: 'growth__axis-label' }, grid);
    xl.textContent = 'length of the list, n';

    // Lines, then end labels nudged apart with a short leader where they'd collide
    const ends = [];
    for (const ser of data.series) {
      const d = ser.values.map((v, i) => `${i ? 'L' : 'M'}${x(data.ns[i]).toFixed(1)},${y(v).toFixed(1)}`).join('');
      svg('path', { d, fill: 'none', stroke: ser.colour, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, s);
      ends.push({ ser, y0: y(ser.values[ser.values.length - 1]) });
    }
    ends.sort((a, b) => a.y0 - b.y0);
    const gap = 15;
    ends.forEach((e, i) => {
      e.y = Math.max(e.y0, i ? ends[i - 1].y + gap : -Infinity);
    });
    for (let i = ends.length - 1; i >= 0; i--) {
      const limit = i === ends.length - 1 ? m.t + ih : ends[i + 1].y - gap;
      ends[i].y = Math.min(ends[i].y, limit);
    }
    const labels = svg('g', { class: 'growth__labels' }, s);
    for (const e of ends) {
      const xe = x(100);
      svg('circle', { cx: xe, cy: e.y0, r: 4, fill: e.ser.colour, stroke: 'var(--paper-raised)', 'stroke-width': 2 }, labels);
      if (Math.abs(e.y - e.y0) > 2) {
        svg('path', { d: `M${xe + 6},${e.y0} L${xe + 12},${e.y}`, class: 'growth__leader' }, labels);
      }
      const t = svg('text', { x: xe + 14, y: e.y, dy: '0.32em' }, labels);
      t.textContent = e.ser.name.replace(' sort', '');
    }

    // Crosshair: snaps to the nearest n; arrow keys move it too
    const cross = svg('g', { class: 'growth__cross', opacity: 0 }, s);
    const vline = svg('line', { y1: m.t, y2: m.t + ih }, cross);
    const marks = data.series.map((ser) => svg('circle', { r: 4, fill: ser.colour, stroke: 'var(--paper-raised)', 'stroke-width': 2 }, cross));
    host.appendChild(s);

    let at = null;
    const show = (n) => {
      at = Math.max(2, Math.min(100, n));
      const i = at - 2;
      cross.setAttribute('opacity', 1);
      vline.setAttribute('x1', x(at));
      vline.setAttribute('x2', x(at));
      data.series.forEach((ser, k) => {
        marks[k].setAttribute('cx', x(at));
        marks[k].setAttribute('cy', y(ser.values[i]));
      });
      tip.textContent = '';
      const h = document.createElement('p');
      h.className = 'growth__tip-head';
      h.textContent = `n = ${at}`;
      tip.appendChild(h);
      [...data.series]
        .sort((a, b) => b.values[i] - a.values[i])
        .forEach((ser) => {
          const row = document.createElement('p');
          row.className = 'growth__tip-row';
          const key = document.createElement('span');
          key.className = 'growth__tip-key';
          key.style.background = ser.colour;
          const val = document.createElement('b');
          val.textContent = fmt(ser.values[i]);
          const nm = document.createElement('span');
          nm.textContent = ser.name;
          row.append(key, val, nm);
          tip.appendChild(row);
        });
      tip.hidden = false;
      const left = x(at);
      tip.style.left = (left > W / 2 ? left - tip.offsetWidth - 14 : left + 14) + 'px';
      tip.style.top = m.t + 'px';
    };
    const hide = () => {
      cross.setAttribute('opacity', 0);
      tip.hidden = true;
      at = null;
    };
    s.addEventListener('pointermove', (e) => {
      const r = s.getBoundingClientRect();
      const n = Math.round(((e.clientX - r.left - m.l) / iw) * 100);
      show(n);
    });
    s.addEventListener('pointerleave', hide);
    host.onkeydown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        show((at ?? 50) + (e.key === 'ArrowRight' ? step : -step));
      } else if (e.key === 'Escape') hide();
    };
    host.onblur = hide;
    host.onfocus = () => show(at ?? 50);
  }

  function cost(section) {
    const shapes = section.querySelector('[data-shapes]');
    const plot = section.querySelector('[data-growth]');
    const tip = section.querySelector('[data-tip]');
    const legend = section.querySelector('[data-legend]');
    const buttons = Array.from(section.querySelectorAll('[data-order]'));
    const cells = Object.fromEntries(ALGOS.map((a) => [a.key, section.querySelector(`[data-at100="${a.key}"]`)]));
    const cache = {};

    for (const a of ALGOS) {
      const li = document.createElement('li');
      const key = document.createElement('span');
      key.className = 'growth__key';
      key.style.background = a.colour;
      li.append(key, document.createTextNode(a.name));
      legend.appendChild(li);
    }

    let order = 'random';
    const render = () => {
      const data = cache[order] || (cache[order] = growthData(order));
      drawShapes(shapes, order);
      drawGrowth(plot, tip, data);
      for (const ser of data.series) if (cells[ser.key]) cells[ser.key].textContent = fmt(ser.values[ser.values.length - 1]);
    };
    for (const b of buttons) {
      b.addEventListener('click', () => {
        order = b.dataset.order;
        buttons.forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
        render();
      });
    }
    render();

    let w = plot.clientWidth;
    window.addEventListener('resize', () => {
      if (Math.abs(plot.clientWidth - w) < 8) return;
      w = plot.clientWidth;
      drawGrowth(plot, tip, cache[order]);
    });
  }

  /* -----------------------------------------------------------------------
     Bogosort — shuffle until sorted
     ----------------------------------------------------------------------- */
  function bogo(root) {
    const tiles = Array.from(root.querySelectorAll('[data-bogo-tile]'));
    const btn = root.querySelector('[data-bogo-go]');
    const out = root.querySelector('[data-bogo-out]');
    const start = [3, 5, 1, 4, 2];
    let xs = start.slice();
    let timer = 0;
    let shuffles = 0;
    const paint = (done) => tiles.forEach((t, i) => {
      t.textContent = xs[i];
      t.classList.toggle('is-filled', done);
    });
    const isSorted = () => xs.every((v, i) => !i || xs[i - 1] <= v);
    const stop = (msg) => {
      clearInterval(timer);
      timer = 0;
      btn.textContent = 'Shuffle until sorted';
      out.textContent = msg;
    };
    paint(false);
    btn.addEventListener('click', () => {
      if (timer) {
        stop(`Gave up after ${fmt(shuffles)} shuffles. Bogosort would not have.`);
        return;
      }
      shuffles = 0;
      if (isSorted()) xs = start.slice();
      paint(false);
      btn.textContent = 'Stop';
      out.textContent = 'Shuffling…';
      timer = setInterval(() => {
        for (let i = xs.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [xs[i], xs[j]] = [xs[j], xs[i]];
        }
        shuffles++;
        const done = isSorted();
        paint(done);
        if (done) stop(`Sorted after ${fmt(shuffles)} shuffle${shuffles === 1 ? '' : 's'}. On average it takes 5! = 120.`);
        else out.textContent = `${fmt(shuffles)} shuffles…`;
      }, 45);
    });
  }

  /* -----------------------------------------------------------------------
     Mount
     ----------------------------------------------------------------------- */
  const scenes = { insertion, selection, merge, quick };
  document.querySelectorAll('[data-code]').forEach(colourCode);
  document.querySelectorAll('[data-scene]').forEach((section) => {
    const build = scenes[section.dataset.scene];
    if (build) V.mount(section, build());
  });
  const costEl = document.querySelector('[data-cost]');
  if (costEl) cost(costEl);
  const bogoEl = document.querySelector('[data-bogo]');
  if (bogoEl) bogo(bogoEl);
})();
