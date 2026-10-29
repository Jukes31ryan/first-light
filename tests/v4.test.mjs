/* v4: Purge lines become today's list on the home screen; Breathe logs minutes;
   nights rollover and backup prompt still hold. */
import { chromium, BASE, OUT } from './lib.mjs';
const b=await chromium.launch();
let ok=true;
const chk=(n,c,x='')=>{if(!c)ok=false;console.log((c?'  ok  ':'FAIL  ')+n+(x?': '+x:''))};
const errs=[];
async function page(seed){
  const ctx=await b.newContext({viewport:{width:390,height:844},timezoneId:'America/New_York'});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e)));
  await p.addInitScript(s=>{if(!sessionStorage.getItem('seeded')){localStorage.clear();
    Object.entries(s).forEach(([k,v])=>localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v)));
    sessionStorage.setItem('seeded','1')}},seed||{});
  await p.goto(BASE);await p.waitForTimeout(300);return p;
}

console.log('— purge lines become today\'s list —');
{
  const p=await page({flSettings:{onboarded:true}});
  chk('no list on an empty day',await p.evaluate(()=>getComputedStyle(document.getElementById('listSect')).display==='none'));
  await p.evaluate(()=>{
    DAY.items=[{id:'a',text:'Call the dentist',done:false},{id:'b',text:'Fix the gate',done:false},
               {id:'c',text:'Ship the app',done:false},{id:'d',text:'Buy dog food',done:false}];
    DAY.winId='c';ppSetPicks(['c','b']);syncDash();
  });
  const rows=await p.$$eval('#todayList .item-t',e=>e.map(x=>x.textContent));
  chk('every open line shows on home',rows.length===3,rows.join(' / '));
  chk('the WIN is not listed twice',rows.indexOf('Ship the app')<0);
  chk('top-3 picks come first',rows[0]==='Fix the gate',rows[0]);
  const wl=await p.textContent('#winList');
  chk('picks are not repeated in the WIN block',wl.indexOf('Fix the gate')<0,wl);
  chk('count says 3 open',/3 open/.test(await p.textContent('#listCount')));
  await p.click('#todayList .item:nth-child(2) .item-check');await p.waitForTimeout(200);
  const after=await p.$$eval('#todayList .item-t',e=>e.map(x=>x.textContent));
  chk('one tap crosses it off',after.length===2&&after.indexOf('Call the dentist')<0,after.join(' / '));
  chk('count updates',/2 open, 1 done/.test(await p.textContent('#listCount')));
  chk('still on home (tap did not navigate)',await p.evaluate(()=>document.querySelector('.scr.on').id)==='s0');
  await p.reload();await p.waitForTimeout(300);
  chk('crossed off survives a reload',await p.evaluate(()=>DAY.items.find(i=>i.id==='a').done===true));
  chk('no sideways scroll at 390px',await p.evaluate(()=>document.documentElement.scrollWidth<=390));
  await p.evaluate(()=>document.getElementById('listSect').scrollIntoView());
  await p.screenshot({path:OUT+'/v4-today-list.png'});
  await p.close();
}

console.log('\n— breathe logs the day\'s minutes —');
{
  const p=await page({flSettings:{onboarded:true}});
  await p.evaluate(()=>go(4));await p.waitForTimeout(200);
  await p.click('#medChips .chip:nth-child(2)');
  chk('5 min chip sets the timer',(await p.textContent('#medTime')).trim()==='5:00');
  await p.click('#medBtn');await p.evaluate(()=>{medLeft=1});await p.waitForTimeout(1500);
  chk('completion marks the day',await p.evaluate(()=>DAY.med===true));
  chk('and logs 5 minutes',await p.evaluate(()=>DAY.medMin)===5);
  chk('says so on screen',/5 min logged/.test(await p.textContent('#medPhase')));
  await p.click('#medChips .chip:nth-child(1)');await p.click('#medBtn');
  await p.evaluate(()=>{medLeft=1});await p.waitForTimeout(1500);
  chk('a second sit adds up (7)',await p.evaluate(()=>DAY.medMin)===7);
  await p.evaluate(()=>{medStopTimers()});
  await p.evaluate(()=>openJournal(todayKey(),8));await p.waitForTimeout(300);
  const jr=await p.evaluate(()=>document.body.innerText);
  chk('the journal shows the minutes',/7 min\. You sat with it/.test(jr));
  await p.close();
}

console.log('\n— nights rollover and backup still hold —');
{
  const p=await page({flSettings:{onboarded:true,dayStart:12}});
  const r=await p.evaluate(()=>{
    const real=Date.now;const at=s=>{Date.now=()=>new Date(s).getTime();const k=todayKey();Date.now=real;return k};
    return {end:at('2026-10-30T07:30:00'),wake:at('2026-10-30T15:05:00')};
  });
  chk('07:30 end-of-shift still counts as the day you woke',r.end==='2026-10-29',r.end);
  chk('15:05 wake-up starts the new day',r.wake==='2026-10-30',r.wake);
  chk('backup nudge is wired',await p.evaluate(()=>typeof quickBackup==='function'&&/backup/.test(currentNudge.toString())));
  await p.close();
}

chk('no script errors',errs.length===0,errs.join(' | '));
await b.close();
process.exit(ok?0:1);
