# mingyyu.github.io

Source for my personal site: [mingyyu.github.io](https://mingyyu.github.io/)

Static HTML, CSS, and JavaScript. No build step, no dependencies, no framework.
Served straight from GitHub Pages.

## Design

The page is laid out as a puzzle page. A newsprint ground, Zilla Slab for
display and body, Martian Mono for labels and tiles, and a letter-grid system
borrowed from the Wordle clone listed under Games.

The palette does double duty. Jade, marigold, and slate are the three feedback
states of the puzzle in the hero, and the same three values mark whether a
project shipped, stalled at prototype, or was archived.

| Token       | Value     | Meaning                       |
| ----------- | --------- | ----------------------------- |
| paper       | `#EDEBE3` | Page ground                   |
| ink         | `#17171A` | Type and rules                |
| jade        | `#1E6F52` | Right letter, right place / shipped   |
| marigold    | `#C1801A` | Right letter, wrong place / prototype |
| slate       | `#7C7C74` | Not in the word / archived    |
| ultramarine | `#2B3FC4` | Links, focus, the caret       |

## The puzzle

Six empty tiles sit under the name. They take a six-letter guess and score it
the way you would expect. Solving it opens a notes section inside About, and
the unlock is remembered in `localStorage` under `mingyu.notes.unlocked`.

To clear it and play again, run this in the console:

```js
localStorage.removeItem('mingyu.notes.unlocked'); location.reload();
```

## Files

```
index.html    markup and copy
style.css     tokens, components, responsive rules
script.js     name reveal and the puzzle
favicon.svg   the M tile
```

## Running it locally

```sh
python -m http.server 8000
```

Then open <http://localhost:8000>.

## Projects listed here

| Year | Project | Status |
| ---- | ------- | ------ |
| 2024 | [Brothers Library](https://brotherslibrary.vercel.app/) — full-stack library system with auth, roles, and loan tracking | Shipped |
| 2023 | EcoGuides — sustainable-living app, DSTA BrainHack code_exp finalist | Prototype |
| 2022 | [Feudal Dominion](https://t.me/FeudalDominionBot) — text-based empire game running inside Telegram | Shipped |
| 2022 | [wordle-lookalike](https://mingyyu.github.io/wordle-lookalike/) — Wordle clone in plain JavaScript | Shipped |
| 2022 | [simple-tictactoe](https://github.com/mingyyu/simple-tictactoe) — the classic | Archived |
