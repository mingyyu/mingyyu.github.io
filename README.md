# 📰 mingyyu.github.io

> **A personal corner of the web styled like a newspaper puzzle page.**  
> 🔗 Live site: [mingyyu.github.io](https://mingyyu.github.io/)

---

### 🧩 `[ M ] [ I ] [ N ] [ G ]   [ Y ] [ U ]`

Welcome to the source code for my personal portfolio and blog. Built from scratch with plain HTML, CSS and JavaScript (plus Jekyll for the blog). It's fast and minimal, with a warm newsprint look and an interactive word game right at the top.

---

## 🎨 The Palette & Status System

The colors do double duty: they provide feedback in the homepage puzzle and indicate project / post status across the site.

| Color | Hex | Puzzle State | Projects & Posts |
| :--- | :--- | :--- | :--- |
| 🟩 **Jade** | `#1E6F52` | Correct spot | **Shipped** (live & ready) |
| 🟨 **Marigold** | `#C1801A` | Wrong spot | **Prototype** (in progress / idea) |
| ⬜ **Slate** | `#7C7C74` | Not in word | **Archived** (kept for history) |
| 🟦 **Ultramarine** | `#2B3FC4` | Highlights | Links, focus & accents |
| 📜 **Paper** | `#EDEBE3` | Background | Newsprint canvas |

---

## 🕹️ The Hidden Puzzle

Under the name on the homepage sits a playable 6-letter word puzzle:
- **Play:** Type a six-letter guess to test your luck.
- **Unlock:** Solving the puzzle reveals a secret notes section in the **About** page.
- **Reset:** To clear your saved score and play again, paste this in your browser console:
  ```js
  localStorage.removeItem('mingyu.notes.unlocked'); location.reload();
  ```

---

## ✍️ Writing a Blog Post

Publishing a new post is effortless:

1. Add a Markdown file inside the `_blog/` folder (e.g. `_blog/my-new-post.md`).
2. Add a simple header at the very top:
   ```yaml
   ---
   title: "Your Post Title"
   date: 2026-08-28
   description: "A short one-line summary for the preview."
   tags: [Thoughts, Projects]
   accent: jade
   ---
   ```
3. Write your post below the header and push to GitHub. The site automatically compiles and publishes it at `/blog/my-new-post/`!

---

## 🚀 Featured Projects

| Status | Project | What It Is |
| :---: | :--- | :--- |
| 🟨 | **Alpha Connectome** | Solo entry in Wunder Fund's ML forecasting competition *(in progress)*. |
| 🟨 | [CareLoop SG](https://careloop-sg.onrender.com/) | Daily voice check-ins for seniors with high blood pressure *(Tencent Cloud Hackathon SG 2026)*. |
| 🟩 | **NiCE Hack 2026** | Side-channel analysis: AES keys recovered from power traces *(NTU NiCE Hack 2026)*. |
| 🟨 | [AgentShopper](https://agentshopper.streamlit.app/) | Makes product catalogues legible to AI shopping assistants *(LifeHack 2026)*. |
| 🟨 | [Conversational Shopping Agent](https://github.com/mingyyu/techjam-conversational-search) | Multi-turn shopping agent, 0.977 TechnicalScore *(TikTok TechJam 2026)*. |
| 🟨 | **SafetyPolice** | Voice-first near-miss reporting with a safety-officer agent *(PSA Code Sprint 2.0)*. |
| 🟩 | [Brothers Library](https://brotherslibrary.vercel.app/) | Full-stack library management system with loan tracking. |
| 🟨 | **EcoGuides** | Sustainable lifestyle tracking app *(DSTA BrainHack Finalist)*. |
| 🟩 | [Duck Dash River Run](https://www.roblox.com/share?code=5fd95b624c86b14ca27e3197275249ec&type=ExperienceDetails) | Red-light, green-light river race on Roblox *(Best Animation, NUS CFG x Garena Hackathon 2026)*. |
| 🟩 | [Feudal Dominion](https://t.me/FeudalDominionBot) | Text-based empire-building strategy game inside Telegram. |
| 🟩 | [Wordle Lookalike](https://mingyyu.github.io/wordle-lookalike/) | Five-letter word guessing game built in pure JavaScript. |
| ⬜ | [Tic-Tac-Toe](https://github.com/mingyyu/simple-tictactoe) | Classic starter game project. |

---

## 💻 Local Preview

To preview the site and blog locally:

```sh
# Install dependencies and start Jekyll preview
bundle install
bundle exec jekyll serve
```
Then visit **[http://localhost:4000](http://localhost:4000)**.

*(Quick tip: If you only want to edit the main landing page without the blog, you can run `python -m http.server 8000` and visit `http://localhost:8000`)*

---

<div align="center">

Crafted with care by [Ming Yu](https://mingyyu.github.io/) ☕

</div>
