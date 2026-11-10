# Calibrate

A few minutes to point the day. Seven cards, one per screen, one button forward:

| Card | What it does |
|------|--------------|
| **Remember** | One of your own lessons, so you don't relearn it the hard way |
| **Center** | A 2, 5 or 10 minute guided meditation with a chime (8 styles) |
| **Word** | One word worth owning, with pronunciation and an example |
| **Fact** | Something interesting and true |
| **Story** | A short story that ends on a point |
| **Laugh** | A joke |
| **List** | Empty your head, then star up to three things for today |

**Live:** https://jukes31ryan.github.io/first-light/

Install it: on Android, open the link in Chrome, then menu > **Install app**. On iPhone, Share > **Add to Home Screen**. It then runs full screen and offline.

## How it behaves

- Nothing repeats until you have seen all of it (239 words, 230 facts, 66 stories, 175 jokes).
- "My day starts at" in Settings decides when a new set of cards appears, so it works for night shifts.
- The list can mirror one Google Tasks list, both ways, so there is only one list. It connects through a small Apps Script you deploy in your own Google account (Settings > Google Tasks has the steps and the code). There is no Google sign-in in the app.
- Everything is stored in the browser on your device. Settings > Backup saves and restores a file. The bridge address and key are never written to a backup.

## Development

One self-contained `index.html`, plus `manifest.webmanifest`, `sw.js` and icons. No build step is needed to run it.

```
PLAYWRIGHT=$(npm root -g)/playwright/index.mjs tests/run.sh
```

Bump `CACHE` in `sw.js` on every release so installed copies pick up the update.

Earlier versions live on the `backup-sep28-full` and `backup-v3.1` branches.
