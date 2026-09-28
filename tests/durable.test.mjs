import { chromium, BASE, OUT } from './lib.mjs';
const b=await chromium.launch();
let ok=true;
const chk=(n,c,x='')=>{if(!c)ok=false;console.log((c?'  ok  ':'FAIL  ')+n+(x?': '+x:''))};
const IOS='Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 '+
          '(KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

const newPage=async(opts={},init)=>{
  const ctx=await b.newContext(Object.assign(
    {viewport:{width:390,height:844},acceptDownloads:true},opts));
  const p=await ctx.newPage();
  p._errs=[];p.on('pageerror',e=>p._errs.push(e.message));
  if(init)await p.addInitScript(init);
  return p;
};
const boot=async(p,seed)=>{
  await p.goto(BASE,{waitUntil:'domcontentloaded'});
  await p.evaluate(s=>{localStorage.clear();
    Object.keys(s).forEach(k=>localStorage.setItem(k,typeof s[k]==='string'?s[k]:JSON.stringify(s[k])));
  },seed);
  await p.reload({waitUntil:'domcontentloaded'});await p.waitForTimeout(450);
};
const nudgeId=p=>p.evaluate(()=>{const n=currentNudge();return n?n.id:''});
const nudgeShown=p=>p.evaluate(()=>{const e=document.getElementById('nudge');
  return !!e&&e.style.display!=='none'&&!!e.textContent.trim()});
/* N days of history ending today, so the counts are what the app will see */
const histOf=n=>{const h={},d=new Date();
  for(let i=0;i<n;i++){h[d.toISOString().slice(0,10)]=1;d.setDate(d.getDate()-1)}return h};

// ───────── 1. we ask the browser not to evict us ─────────
console.log('— persistent storage —');
{
  const p=await newPage({},()=>{
    window.__persistCalls=0;
    if(navigator.storage&&navigator.storage.persist){
      const real=navigator.storage.persist.bind(navigator.storage);
      navigator.storage.persist=()=>{window.__persistCalls++;return real()};
    }
  });
  await boot(p,{});
  await p.waitForTimeout(600);
  const calls=await p.evaluate(()=>window.__persistCalls);
  const already=await p.evaluate(()=>navigator.storage.persisted().then(x=>x).catch(()=>null));
  chk('persist() is requested on load (or already granted)',calls>=1||already===true,
    'calls='+calls+' persisted='+already);
  chk('and nothing throws',p._errs.length===0,p._errs.join(';'));
  await p.context().close();
}
{
  /* the API is absent on plenty of browsers; that must be a no-op, not a crash */
  const p=await newPage({},()=>{
    try{Object.defineProperty(navigator,'storage',{get(){return undefined}})}catch(e){}
  });
  await boot(p,{});
  chk('a browser without the API boots clean',p._errs.length===0,p._errs.join(';'));
  chk('and still paints the dashboard',
    await p.evaluate(()=>document.querySelector('.scr.on').id)==='s0');
  await p.context().close();
}

// ───────── 2. the home-screen nudge, where it is the only mitigation ─────────
console.log('\n— iOS, in a tab —');
{
  const p=await newPage({userAgent:IOS});
  await boot(p,{flSettings:{onboarded:true},flHistory:histOf(3)});
  chk('an iOS browser tab is told why it matters',await nudgeId(p)==='install',await nudgeId(p));
  chk('and the reason is on screen',
    /Home Screen/i.test(await p.evaluate(()=>document.getElementById('nudge').textContent)));
  await p.click('#nudge .nudge-x');await p.waitForTimeout(300);
  chk('it can be waved away',!(await nudgeShown(p)));
  await p.reload({waitUntil:'domcontentloaded'});await p.waitForTimeout(450);
  chk('and stays away',!(await nudgeShown(p)));
  await p.context().close();
}
{
  const p=await newPage({userAgent:IOS},()=>{
    try{Object.defineProperty(navigator,'standalone',{get(){return true}})}catch(e){}
  });
  await boot(p,{flSettings:{onboarded:true},flHistory:histOf(3)});
  chk('once installed it is never shown',await nudgeId(p)!=='install',await nudgeId(p));
  await p.context().close();
}
{
  const p=await newPage({userAgent:IOS});
  await boot(p,{flSettings:{onboarded:true},flHistory:histOf(1)});
  chk('and not on the very first morning either',await nudgeId(p)!=='install',await nudgeId(p));
  await p.context().close();
}
{
  const p=await newPage();   // desktop Linux UA
  await boot(p,{flSettings:{onboarded:true},flHistory:histOf(3)});
  chk('browsers that do not evict are left alone',await nudgeId(p)!=='install',await nudgeId(p));
  await p.context().close();
}

// ───────── 3. the backup nudge, and whether it is honest ─────────
console.log('\n— backups —');
{
  const p=await newPage();
  await boot(p,{flSettings:{onboarded:true}});
  chk('nothing to lose, nothing said',await nudgeId(p)==='',await nudgeId(p));
  await boot(p,{flSettings:{onboarded:true},flHistory:histOf(3)});
  chk('three mornings is too early to nag',await nudgeId(p)!=='backup',await nudgeId(p));
  await boot(p,{flSettings:{onboarded:true},flHistory:histOf(9)});
  chk('nine mornings with no copy anywhere does get a word',await nudgeId(p)==='backup',await nudgeId(p));
  chk('and it says how much is at stake',
    /9 mornings/.test(await p.evaluate(()=>document.getElementById('nudge').textContent)));

  const today=await p.evaluate(()=>todayKey());
  await boot(p,{flSettings:{onboarded:true},flHistory:histOf(9),flExport:today});
  chk('someone who just exported is not asked again',await nudgeId(p)!=='backup',await nudgeId(p));

  const old=await p.evaluate(()=>{const d=new Date();d.setDate(d.getDate()-40);return dateKey(d)});
  await boot(p,{flSettings:{onboarded:true},flHistory:histOf(9),flExport:old});
  chk('but a forty-day-old backup counts for nothing',await nudgeId(p)==='backup',await nudgeId(p));

  /* taking the offer must record the date, or the nudge is lying next week */
  const dl=p.waitForEvent('download').catch(()=>null);
  await p.click('#nudge .btn-sec');
  await dl;await p.waitForTimeout(500);
  chk('taking it records the export',await p.evaluate(()=>localStorage.getItem('flExport'))===today,
    await p.evaluate(()=>localStorage.getItem('flExport')));
  chk('and the nudge goes quiet',!(await nudgeShown(p)));
  chk('no errors along the way',p._errs.length===0,p._errs.join(';'));
  await p.context().close();
}

// ───────── 4. a nudge must never get between you and the morning ─────────
console.log('\n— it stays out of the way —');
{
  const p=await newPage();
  await boot(p,{flSettings:{onboarded:true},flHistory:histOf(9)});
  chk('the call to action is still on screen',
    await p.evaluate(()=>{const r=document.getElementById('beginBtn').getBoundingClientRect();
      return r.top>0&&r.bottom<innerHeight}));
  chk('so is the sequence',
    await p.evaluate(()=>document.getElementById('idx').getBoundingClientRect().top<innerHeight));
  chk('only ever one nudge at a time',
    await p.evaluate(()=>document.querySelectorAll('#nudge .nudge-t').length)===1);
  await p.context().close();
}

// ───────── 5. export still round-trips everything ─────────
console.log('\n— export and import —');
{
  const p=await newPage();
  p.on('dialog',d=>d.accept());
  await boot(p,{flSettings:{onboarded:true,affirms:['Mine | My own line'],quotes:['Q | A']},
    flHistory:{'2026-09-01':1,'2026-09-02':1},flStreak:'12',flDone:'2026-09-02',
    'flDay-2026-09-01':{win:'The one thing',note:'a note I wrote',status:{6:'done'}}});
  const dump=await p.evaluate(()=>JSON.stringify(collectData()));
  await p.evaluate(()=>localStorage.clear());
  await p.reload({waitUntil:'domcontentloaded'});await p.waitForTimeout(400);
  chk('wiped is really wiped',await p.evaluate(()=>+localStorage.getItem('flStreak')||0)===0);
  await p.evaluate(t=>applyImport(t),dump);
  await p.waitForTimeout(1400);
  chk('the streak comes back',await p.evaluate(()=>localStorage.getItem('flStreak'))==='12');
  chk('the history comes back',await p.evaluate(()=>Object.keys(dayHistory()).length)===2);
  chk('the journal day comes back',
    await p.evaluate(()=>readJSON('flDay-2026-09-01',{}).note)==='a note I wrote');
  chk('their own cards come back',await p.evaluate(()=>S.affirms[0])==='Mine | My own line');
  chk('no errors on the round trip',p._errs.length===0,p._errs.join(';'));
  await p.context().close();
}

await b.close();
console.log('');
process.exit(ok?0:1);
