# Calibrate

A few minutes to point the day. Seven cards, one per screen, one button forward:

| Card | What it does |
|------|--------------|
| **Remember** | One of your own lessons, so you don't relearn it the hard way |
| **Word** | One word worth owning. Mark it known, or it comes back for a check until learned |
| **Fact** | Something interesting and true |
| **Story** | A short story that ends on a point |
| **Laugh** | A joke |
| **List** | Your tasks (optionally your Google Tasks list). Star up to three for today |
| **Center** | Finish with a 2, 5 or 10 minute guided meditation (8 styles), or hand off to Waking Up |

**Live:** https://jukes31ryan.github.io/first-light/

Install it: on Android, open the link in Chrome, then menu > **Install app**. On iPhone, Share > **Add to Home Screen**. It then runs full screen and offline.

## How it behaves

- Nothing repeats until you have seen all of it (239 words, 230 facts, 66 stories, 175 jokes).
- "My day starts at" in Settings decides when a new set of cards appears, so it works for night shifts.
- The list can mirror one Google Tasks list, both ways, so there is only one list. Settings > Google Tasks has a one-tap "Sign in with Google" (needs `CLIENT_ID` set in `index.html`; a Client ID can also be pasted under Advanced options). A helper-script path remains under Advanced for anyone who prefers no Google Cloud project. Google asks for a quick re-tap about once an hour.
- Everything is stored in the browser on your device. Settings > Backup saves and restores a file. The bridge address and key are never written to a backup.

## Development

One self-contained `index.html`, plus `manifest.webmanifest`, `sw.js` and icons. No build step is needed to run it.

```
PLAYWRIGHT=$(npm root -g)/playwright/index.mjs tests/run.sh
```

Bump `CACHE` in `sw.js` on every release so installed copies pick up the update.

Earlier versions live on the `backup-sep28-full` and `backup-v3.1` branches.
