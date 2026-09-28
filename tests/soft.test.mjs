import { chromium, BASE, OUT } from './lib.mjs';
const SS=OUT;
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
let ok=true;
const chk=(n,c,x='')=>{if(!c)ok=false;console.log((c?'  ok  ':'FAIL  ')+n+(x?': '+x:''))};

const CARDS=['Presence | Put the phone down','Discipline | Do the hard thing first',
  'Craft | Slow is smooth','Health | Drink the water','Money | Pay yourself first'];

const boot=async(affirms)=>{
  await p.goto(BASE,{waitUntil:'domcontentloaded'});
  await p.evaluate(a=>{localStorage.clear();
    localStorage.setItem('flSettings',JSON.stringify({onboarded:true,affirms:a}));
    localStorage.setItem('flDone','2026-01-01');
    localStorage.setItem('flHistory',JSON.stringify({'2026-01-01':1}));},affirms);
  await p.reload({waitUntil:'domcontentloaded'});await p.waitForTimeout(500);
};

// ───────── the bug: Continue must complete the step, with no taps ─────────
console.log('— the primary button —');
await boot(CARDS);
await p.evaluate(()=>go(5));await p.waitForTimeout(450);
console.log('   button reads:',JSON.stringify((await p.textContent('#softGo')).trim()));
await p.click('#softGo');await p.waitForTimeout(450);
const st=await p.evaluate(()=>statusOf(5));
chk('one press completes the step',st==='done',st);
chk('and it is done, not skipped',st!=='skip',st);
chk('and the flow moved on',await p.evaluate(()=>document.querySelector('.scr.on').id)!=='s5');

// ───────── one card, stable across a reload ─────────
console.log('\n— one card a day —');
await boot(CARDS);
await p.evaluate(()=>go(5));await p.waitForTimeout(400);
const first=await p.textContent('#softTxt');
const expect=await p.evaluate(()=>{
  const [cat,txt]=parsePair(S.affirms[dayOfYear()%S.affirms.length]);return txt});
chk('the card is the one the day picks',first.trim()===expect.trim(),first.trim());
await p.reload({waitUntil:'domcontentloaded'});await p.waitForTimeout(400);
await p.evaluate(()=>go(5));await p.waitForTimeout(400);
chk('same card after a reload',(await p.textContent('#softTxt')).trim()===first.trim());

// ───────── the rotation covers everything ─────────
console.log('\n— the rotation —');
const seen=await p.evaluate(n=>{
  const out=[];
  for(let d=0;d<n;d++) out.push(S.affirms[(dayOfYear()+d)%S.affirms.length]);
  return out;
},CARDS.length);
chk('consecutive days cover every card exactly once',
  new Set(seen).size===CARDS.length,String(new Set(seen).size)+' of '+CARDS.length);

// ───────── Another wraps ─────────
console.log('\n— Another —');
await boot(CARDS);
await p.evaluate(()=>go(5));await p.waitForTimeout(400);
let blanked=false;
for(let i=0;i<CARDS.length+3;i++){
  await p.click('#softMore');await p.waitForTimeout(150);
  if(!(await p.textContent('#softTxt')).trim()) blanked=true;
}
chk('pressing it past the end never blanks the card',!blanked);
chk('and the main button still names where it goes',
  await p.evaluate(()=>{const t=$('softGo').textContent;return /^(Next: |Finish|Done)/.test(t)}));

// ───────── empty list ─────────
console.log('\n— no cards at all —');
await boot([]);
await p.evaluate(()=>{S.affirms=[];go(5)});await p.waitForTimeout(450);
chk('renders the empty state without throwing',errs.length===0,errs.join(';'));
chk('and the main button still completes the step',
  await p.evaluate(async()=>{$('softGo').click();await new Promise(r=>setTimeout(r,300));
    return statusOf(5)==='done'}));

// ───────── editing in Settings must not leave a stale index ─────────
console.log('\n— editing your cards —');
await boot(CARDS);
await p.evaluate(()=>go(5));await p.waitForTimeout(400);
await p.evaluate(()=>{openSettings()});await p.waitForTimeout(350);
await p.evaluate(()=>{$('setAffirms').value='Only | One line now';saveSettings()});
await p.waitForTimeout(400);
await p.evaluate(()=>go(5));await p.waitForTimeout(400);
const after=(await p.textContent('#softTxt')).trim();
chk('the shown card comes from the new list',after==='One line now',after);

// ───────── the journal names it ─────────
console.log('\n— the journal —');
await boot(CARDS);
await p.evaluate(()=>go(5));await p.waitForTimeout(400);
const shown=(await p.textContent('#softTxt')).trim();
const key=await p.evaluate(()=>todayKey());
await p.evaluate(()=>{saveDay();recordDay(todayKey())});
await p.evaluate(k=>openJournal(k),key);await p.waitForTimeout(450);
const jr=await p.textContent('#jrBody');
chk('the day names the card you got',jr.indexOf(shown)>=0,shown);
chk('and no pipe reaches the screen',jr.indexOf('|')<0);

await boot(CARDS);
await p.evaluate(()=>go(5));await p.waitForTimeout(500);
await p.screenshot({path:SS+'E0-software-dawn.png'});
await p.evaluate(()=>toggleTheme());await p.waitForTimeout(400);
await p.screenshot({path:SS+'E1-software-dusk.png'});

console.log('\n'+(errs.length?('ERRORS: '+errs.join(';')):'NO JS ERRORS'));
await b.close();
process.exit(ok&&!errs.length?0:1);
