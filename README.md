# 🌅 Calibrate

> Point the day. A personal morning launcher — a boot sequence for the brain. Open it when you wake up: warm up, center, reload your operating principles, and point yourself at the day. No accounts, no ads, no network required.

[![Website](https://img.shields.io/badge/Website-Live-e8a06c?style=for-the-badge&logo=googlechrome&logoColor=white)](https://jukes31ryan.github.io/first-light/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

---

## 🤔 What is this?

My brain runs good software, but I forget to start it up every day. This app is the boot-up.

It takes about five minutes. Open it, tap through, get on with your life.

## 🚀 Live

### **[https://jukes31ryan.github.io/first-light/](https://jukes31ryan.github.io/first-light/)**

Add it to your home screen and it runs full-screen and fully offline.

---

## ☀️ The Morning Sequence

| # | Step | What happens |
|---|------|--------------|
| 1 | **Spark** | A quote to carry into the day. Fresh every time you open it |
| 2 | **Laugh** | A one-liner, because life isn't that serious |
| 3 | **Story** | A full-length fable that ends on an earned takeaway |
| 4 | **Breathe** | A 2/5/10-minute timer with a breathing circle and a soft chime |
| 5 | **Software** | Your own daily reminders, one card at a time, so they get read instead of skimmed |
| 6 | **Today** | Purge the clutter, set your Top 3, name the one **WIN** |
| 7 | **The Mini** | A 5x5 crossword to wake the brain up — new puzzle daily |

Then **Launch** recaps the day and ticks the streak.

Every step is skippable and they work in any order. Skipped ones flag gold on the dashboard so you can come back.

## 🌙 The Evening Bookend

Fifteen seconds at night closes the loop: did you hit your WIN, what are you grateful for, one win from today. Tomorrow morning, yesterday's gratitude is waiting for you.

---

## ✨ Features

* **Dashboard of tiles** — glanceable and color-coded. Your WIN and Top 3 stay on screen all day.
* **A lot of content, no repetition:**
  * 69 quotes — strategists (Sun Tzu, Musashi, Marcus Aurelius, Seneca, Epictetus) and poets (Rumi, Whitman, Oliver, Rilke, Frost, Tennyson, Angelou, Kipling, Emerson, Whyte)
  * 18 full-length fables, each with a takeaway
  * 30 one-liners
  * 18 hand-built mini crosswords, one per day
* **The month grid** — every morning you showed up, filled in. The streak as a shape, not just a number.
* **Streak insurance** — one grace day a week, so forty days don't die to one bad Tuesday. It says so when it saves you.
* **Look back** — an archive of past WINs, whether you hit them, and what you were grateful for.
* **The three P's** — Purge (type it once), Prioritise (tap three), Put into action (tap one). Nothing is written twice, and unpicked items carry into tomorrow.
* **Built to touch** — springs on press, haptics, a real breathing circle, and a sunrise burst when you finish. All of it toggleable, and it respects reduced-motion.
* **Zero network requests** — fonts embedded, everything local. It works the same in a tunnel as at your kitchen table.
* **Two looks** — **Dawn**, oat paper and ink for daylight, and **Dusk** for the hours before sunrise. Set in Fraunces over Inter.
* **Your software is yours** — reminders and quotes are edited in Settings, never in the code.
* **Export / import** — one tap dumps everything to a JSON file, and restores from one. Insurance against a cleared browser.
* **Day streak** that only counts consecutive days.
* **Fully offline** — no API calls, no network needed after the first load.

---

## 💻 Tech Stack

A single self-contained `index.html`, plus the three files that make it installable.

* **HTML5** / **CSS3** (variables for theming) / **vanilla JavaScript** — no frameworks, no build step, no dependencies
* `manifest.webmanifest` + `sw.js` (service worker, offline app shell) + icons

All content is embedded, so nothing breaks when a third-party API goes down. Everything you write is stored in your browser's `localStorage` under `fl`-prefixed keys and never leaves your device.

### Running it locally

Clone the repo and serve the folder (`python3 -m http.server`), then open it. Opening `index.html` straight off the disk works too — you just don't get the service worker, since browsers only register those over http/https.

---

## 📄 License

MIT

---

## 👤 Author

**jukes31ryan** · [@jukes31ryan](https://github.com/jukes31ryan)
