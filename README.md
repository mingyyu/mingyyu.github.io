# mingyyu.github.io

Source for my personal site: [mingyyu.github.io](https://mingyyu.github.io/)

Static HTML, CSS, and JavaScript. No client-side dependencies, no framework.
Served from GitHub Pages, which runs Jekyll on push to turn `_blog/*.md` into
blog pages. The front page itself has no front matter, so Jekyll copies it
through untouched.

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
index.html         markup and copy for the front page
style.css          tokens, components, responsive rules
script.js          name reveal and the puzzle
favicon.svg        the M tile
_config.yml        Jekyll config — defines the blog collection
_blog/*.md         one file per post
blog/index.html    the blog index
blog/feed.xml      Atom feed at /blog/feed.xml
_layouts/base.html shared head, topbar, footer
_layouts/post.html a single post
```

## The blog

Write a post by dropping a `.md` file into `_blog/` and pushing. The filename
becomes the URL — `_blog/hello-world.md` is served at `/blog/hello-world/` —
and GitHub Pages builds it. There is nothing to run and no index to update.

The only requirement is the front matter at the top of the file:

```yaml
---
title: "Your title here"
date: 2026-08-27
description: One sentence. Shows on the blog index and in link previews.
tags: [Go, Postgres]
accent: jade
---
```

| Key           | Required | Notes                                                    |
| ------------- | -------- | -------------------------------------------------------- |
| `title`       | yes      | Heading, `<title>`, and the index row                     |
| `date`        | yes      | `YYYY-MM-DD`. Sorts the index, newest first               |
| `description` | no       | Falls back to the opening of the post                     |
| `tags`        | no       | Rendered with the same chips as project tags              |
| `accent`      | no       | `jade`, `marigold`, or `slate`. Defaults to jade          |
| `published`   | no       | Set `false` to keep a draft off the site                  |

Posts render as GFM through kramdown, with Rouge highlighting fenced code
blocks. The blog reuses the `.index` / `.entry` component from Work and Games;
everything specific to it lives in section 16 of `style.css`.

## Running it locally

The site is a Jekyll build now, so a plain file server will not render the
blog. With Ruby installed:

```sh
bundle install
bundle exec jekyll serve
```

Then open <http://localhost:4000>.

Without Ruby, the front page still works standalone (`python -m http.server
8000`) — only `/blog/` needs the build. Pushing and checking the live site is
a legitimate way to preview a post.

## Projects listed here

| Year | Project | Status |
| ---- | ------- | ------ |
| 2024 | [Brothers Library](https://brotherslibrary.vercel.app/) — full-stack library system with auth, roles, and loan tracking | Shipped |
| 2023 | EcoGuides — sustainable-living app, DSTA BrainHack code_exp finalist | Prototype |
| 2022 | [Feudal Dominion](https://t.me/FeudalDominionBot) — text-based empire game running inside Telegram | Shipped |
| 2022 | [wordle-lookalike](https://mingyyu.github.io/wordle-lookalike/) — Wordle clone in plain JavaScript | Shipped |
| 2022 | [simple-tictactoe](https://github.com/mingyyu/simple-tictactoe) — the classic | Archived |
