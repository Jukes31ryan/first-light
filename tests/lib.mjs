/* Shared by every browser test: where Playwright is, where the app is served,
   and where screenshots go. Override with PLAYWRIGHT, BASE_URL, or PORT. */
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

async function loadPlaywright(){
  const tries=[process.env.PLAYWRIGHT,'playwright','/opt/node22/lib/node_modules/playwright/index.mjs'].filter(Boolean);
  for(const t of tries){try{return await import(t)}catch(e){}}
  console.error('Playwright not found. Run `npm i -D playwright` or set PLAYWRIGHT=/path/to/playwright/index.mjs');
  process.exit(2);
}
export const { chromium } = await loadPlaywright();
export const BASE = process.env.BASE_URL || ('http://127.0.0.1:'+(process.env.PORT||8885)+'/');
export const OUT = fileURLToPath(new URL('./out/', import.meta.url));
mkdirSync(OUT,{recursive:true});
