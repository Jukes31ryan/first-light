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

### Sending it to someone

Just send them the link. **Everybody gets their own copy automatically** — there is nothing to sign up for and nothing to set up.

The app keeps everything in `localStorage`, which browsers scope to one device and one browser. So when your dad opens that URL on his phone, he gets an empty app: his own streak starting at day one, his own Top 3, his own WIN, his own principles in Settings. He never sees your answers and you never see his. The same link on your laptop is likewise a separate copy from the one on your phone.

The trade-off is the same fact from the other side: your data lives on that one device, so use **Export** in Settings before you wipe a phone or clear your browser, and **Import** on the new one.

---

## ☀️ The Morning Sequence

**You build your own.** On day one the app asks which modules you want, in what
order, and what kind of quotes and fables — then gets out of the way. Change any
of it later in Settings.

| Module | What happens |
|--------|--------------|
| **Spark** | A quote to carry into the day, with a written explanation |
| **Story** | A full-length fable that ends on an earned takeaway |
| **The Mini** | A crossword to switch the brain on — new puzzle daily, 7x7 at the weekend |
| **Software** | Your own daily reminders, one card at a time, so they get read instead of skimmed |
| **Breathe** | A 2/5/10-minute timer with a breathing circle and a soft chime |
| **The Stretch** | Gentle mobility, guided on a timer, with a figure that shows the movement |
| **Today** | Purge the clutter, set your Top 3, name the one **WIN** |
| **Laugh** | A one-liner on the way out, because life isn't that serious |

The default order is brain first, planning once it's running, and out the door
laughing — but it's yours to rearrange.

Then **Launch** recaps the day and ticks the streak.

Every step is skippable and they work in any order. Skipped ones flag gold on the dashboard so you can come back.

## 🌙 The Evening Bookend

Fifteen seconds at night closes the loop: did you hit your WIN, what are you grateful for, one win from today. Tomorrow morning, yesterday's gratitude is waiting for you.

---

## ✨ Features

* **Dashboard of tiles** — glanceable and color-coded. Your WIN and Top 3 stay on screen all day.
* **A lot of content, no repetition:**
  * 141 quotes — strategists (Sun Tzu, Musashi, Marcus Aurelius, Seneca, Epictetus), philosophers (Plato, Aristotle, Socrates, Lao Tzu, Confucius, Nietzsche, Camus, Jung, Frankl), Americans (Kennedy, Lincoln, Douglass, Thoreau, the Roosevelts, King, Ali, Twain), scientists (Einstein, Feynman, Sagan, Curie) and poets (Rumi, Whitman, Oliver, Rilke, Frost, Angelou, Kipling, Emerson)
  * 50 full-length fables, each with a takeaway — Zen, Sufi, Aesop, Stoic and folk
  * 84 one-liners, credited where they belong to someone — Hedberg, Steven Wright, Demetri Martin, Wilde, Groucho, Dorothy Parker, Pratchett, Adams
  * 24 hand-built mini crosswords, one per day
* **"What does this mean?"** — every quote and every fable has a written explanation: what it means, where it came from, and a question to sit with. Written into the app, so it opens instantly and works with no signal.
* **The month grid** — every morning you showed up, filled in. The streak as a shape, not just a number.
* **Streak insurance** — one grace day a week, so forty days don't die to one bad Tuesday. It says so when it saves you.
* **Look back** — an index of every day you showed up. Tap one to open **the journal**: that day as a full page — what mattered and whether you hit it, your top three, everything that was on the list, your own writing, and what the morning gave you.
* **The three P's** — Purge (type it once), Prioritise (tap three), Put into action (tap one). Nothing is written twice, and unfinished items carry forward from whenever you last opened the app — not just from yesterday — tagged with how old they are.
* **Built to touch** — springs on press, haptics, a real breathing circle, and a sunrise burst when you finish. All of it toggleable, and it respects reduced-motion.
* **Zero network requests** — fonts embedded, everything local. It works the same in a tunnel as at your kitchen table.
* **Two looks** — **Dawn**, oat paper and ink for daylight, and **Dusk** for the hours before sunrise. Set in Fraunces over Inter.
* **Your software is yours** — reminders and quotes are edited in Settings, never in the code. A library of 40 written cards to start from, or write your own.
* **Flavours** — tag what you want more of (Strategy, Stoic, Mindfulness, Poetry, Grit, Reflection) and the quotes and fables follow. A narrow pick widens itself rather than repeating on you.
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
