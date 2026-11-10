import { chromium, BASE, OUT } from './lib.mjs';
const SS=OUT;
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
let ok=true;
const chk=(n,c,x='')=>{if(!c)ok=false;console.log((c?'  ok  ':'FAIL  ')+n+(x?': '+x:''))};

/* boot with an exact localStorage shape */
const boot=async(seed)=>{
  await p.goto(BASE,{waitUntil:'domcontentloaded'});
  await p.evaluate(s=>{localStorage.clear();
    Object.keys(s).forEach(k=>localStorage.setItem(k,typeof s[k]==='string'?s[k]:JSON.stringify(s[k])));
  },seed);
  await p.reload({waitUntil:'domcontentloaded'});await p.waitForTimeout(500);
};
const onScreen=()=>p.evaluate(()=>{const e=document.querySelector('.scr.on');return e?e.id:'(none)'});
const nudgeId=()=>p.evaluate(()=>{const n=currentNudge();return n?n.id:''});
const nudgeShown=()=>p.evaluate(()=>{
  const e=document.getElementById('nudge');
  return !!e&&e.style.display!=='none'&&!!e.textContent.trim()});
const hintShown=()=>p.evaluate(()=>{
  const e=document.getElementById('firstRun');return !!e&&e.style.display!=='none'});

// ───────── 1. a stranger lands in the app, not in a wizard ─────────
console.log('— day one —');
await boot({});
chk('lands on the dashboard, not the setup wizard',await onScreen()==='s0',await onScreen());
chk('the welcome hint explains it in place',await hintShown());
/* it used to explain only the controls, which answers "how" for someone who has
   not been told "why" — the purpose has to come first */
const hint=await p.evaluate(()=>document.getElementById('firstRun').textContent);
chk('and it says what the app is FOR, not just how it works',
  /forgotten where you were headed/.test(hint),hint.slice(0,60)+'…');
chk('while still explaining the controls',
  /tap any one step/.test(hint)&&/keeps your place/.test(hint));
chk('and no nudge competes with it',!(await nudgeShown()));
/* the longer line must not cost the call to action its place above the fold */
const fold=await p.evaluate(()=>({
  begin:document.getElementById('beginBtn').getBoundingClientRect().bottom,
  seq:document.getElementById('idx').getBoundingClientRect().top,
  h:innerHeight}));
chk('Begin is still above the fold',fold.begin<fold.h,Math.round(fold.begin)+'/'+fold.h);
chk('and the sequence still starts on screen',fold.seq<fold.h,Math.round(fold.seq)+'/'+fold.h);
chk('running the default sequence',
  await p.evaluate(()=>JSON.stringify(FLOW))==='[1,3,7,5,4,6,2]',
  await p.evaluate(()=>JSON.stringify(FLOW)));
chk('with the neutral cards, not one person’s',
  await p.evaluate(()=>S.affirms.length===DEF_AFFIRMS.length&&S.affirms[0]===DEF_AFFIRMS[0]));

// ───────── 2. they can actually finish a morning on the defaults ─────────
console.log('\n— a whole morning on the defaults —');
await p.evaluate(async()=>{
  for(const n of FLOW){go(n);await new Promise(r=>setTimeout(r,120));mark(n,'done')}
  DAY.win='Ship the thing';saveDay();
  go(8);await new Promise(r=>setTimeout(r,200));
});
await p.waitForTimeout(400);
chk('every module can be reached and completed',
  await p.evaluate(()=>FLOW.every(n=>statusOf(n)==='done')));
await p.evaluate(()=>finishDay());await p.waitForTimeout(1100);
chk('finishing lands back on the dashboard',await onScreen()==='s0',await onScreen());
chk('the morning is recorded',await p.evaluate(()=>Object.keys(dayHistory()).length)===1);

// ───────── 3. only NOW is the wizard offered ─────────
console.log('\n— the offer, after the fact —');
chk('the setup offer appears',await nudgeShown()&&await nudgeId()==='setup',await nudgeId());
chk('and the day-one hint has stepped aside',!(await hintShown()));
await p.click('#nudge .btn-sec');await p.waitForTimeout(450);
chk('tapping it opens the wizard',await onScreen()==='s13',await onScreen());
chk('pre-filled with the flow they just ran',
  await p.evaluate(()=>JSON.stringify(obPick)===JSON.stringify(FLOW)));
chk('and with the cards they already have',
  await p.evaluate(()=>JSON.stringify(obCards)===JSON.stringify(S.affirms)));

// ───────── 4. finishing the wizard retires the offer for good ─────────
console.log('\n— answering it —');
await p.evaluate(()=>obFinish());await p.waitForTimeout(900);
chk('the offer is gone',!(await nudgeShown()));
await p.reload({waitUntil:'domcontentloaded'});await p.waitForTimeout(500);
chk('and stays gone across a reload',!(await nudgeShown()));

// ───────── 5. "not now" is an answer, not a postponement ─────────
console.log('\n— declining it —');
await boot({flHistory:{'2026-09-01':1},flDone:'2026-09-01'});
chk('offered to someone with history',await nudgeId()==='setup',await nudgeId());
await p.click('#nudge .nudge-x');await p.waitForTimeout(350);
chk('dismissing hides it',!(await nudgeShown()));
await p.reload({waitUntil:'domcontentloaded'});await p.waitForTimeout(500);
chk('and it does not come back tomorrow',!(await nudgeShown()));
chk('Settings still has the way in',
  await p.evaluate(()=>{const b=[...document.querySelectorAll('#s9 button')];
    return b.some(x=>/Rebuild my morning/.test(x.textContent))}));

// ───────── 6. the Ryan case: long-standing user, never asked ─────────
console.log('\n— someone who predates the wizard —');
await boot({flHistory:{'2026-08-01':1,'2026-08-02':1},flDone:'2026-08-02',flStreak:'2'});
chk('gets the offer exactly once',await nudgeId()==='setup',await nudgeId());
chk('their existing cards are untouched until they answer',
  await p.evaluate(()=>S.affirms.length>0));

// ───────── 7. backstop: never finishes a morning, still gets asked ─────────
console.log('\n— two visits, nothing finished —');
await boot({flSeen:['2026-09-01']});
chk('the second visit triggers the offer',await nudgeId()==='setup',await nudgeId());
chk('and today is recorded as seen',
  await p.evaluate(()=>readJSON('flSeen',[]).length===2));
await boot({});
chk('but a single first visit does not',await nudgeId()==='',await nudgeId());

// ───────── 8. the card presets ─────────
console.log('\n— starting from a set —');
await boot({flHistory:{'2026-09-01':1}});
await p.evaluate(()=>openOnboard());await p.waitForTimeout(300);
await p.evaluate(()=>{obPage=3;renderOnboard()});await p.waitForTimeout(300);
const preBtns=await p.evaluate(()=>[...document.querySelectorAll('.ob-presets button')].map(b=>b.textContent));
chk('both sets are offered',preBtns.length===2,preBtns.join(' / '));
chk('the operating rules are eight',/Operating rules \(8\)/.test(preBtns[0]||''),preBtns[0]);
await p.click('.ob-presets button');await p.waitForTimeout(300);
chk('tapping one selects the whole set',
  await p.evaluate(()=>sameCards(obCards,SHARP_CARDS)));
await p.evaluate(()=>obFinish());await p.waitForTimeout(900);
chk('and it survives to the saved settings',
  await p.evaluate(()=>sameCards(readJSON('flSettings',{}).affirms||[],SHARP_CARDS)));
chk('the Software step then shows one of them',
  await p.evaluate(async()=>{go(5);await new Promise(r=>setTimeout(r,300));
    return SHARP_CARDS.some(c=>c.indexOf(document.getElementById('softTxt').textContent.trim())>=0)}));

// ───────── 9. the legacy restore is only offered to whom it means something ─────────
console.log('\n— the original set —');
await boot({flDone:'2026-08-02',flHistory:{'2026-08-02':1}});   // no flSettings: migrate pins legacy
chk('an old user is pinned to their original cards',
  await p.evaluate(()=>S.affirms.length===LEGACY_AFFIRMS.length));
chk('and flagged as such',await p.evaluate(()=>S.hadLegacy===true));
await p.evaluate(()=>openSettings());await p.waitForTimeout(300);
chk('so Settings offers to restore them',
  await p.evaluate(()=>document.getElementById('legacyBtn').style.display!=='none'));
await boot({flSettings:{onboarded:true,affirms:['A | B']}});
await p.evaluate(()=>openSettings());await p.waitForTimeout(300);
chk('a stranger is never offered a stranger’s cards',
  await p.evaluate(()=>document.getElementById('legacyBtn').style.display==='none'));

await boot({flHistory:{'2026-09-01':1}});
await p.screenshot({path:SS+'F0-nudge-setup.png'});
await boot({});                                    // a true first run, both themes
await p.screenshot({path:SS+'F1-firstrun-dawn.png'});
await p.evaluate(()=>toggleTheme());await p.waitForTimeout(400);
await p.screenshot({path:SS+'F2-firstrun-dusk.png'});

console.log('\n'+(errs.length?('ERRORS: '+errs.join(';')):'NO JS ERRORS'));
await b.close();
process.exit(ok&&!errs.length?0:1);
