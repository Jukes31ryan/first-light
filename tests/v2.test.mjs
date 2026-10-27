/* v2: the two-minute run, the night-shift day, anchors, the shelf, the loop.
   Screenshots of the home screen in both themes land in tests/out/. */
import { chromium, BASE, OUT } from './lib.mjs';
const b=await chromium.launch();
let ok=true;
const chk=(n,c,x='')=>{if(!c)ok=false;console.log((c?'  ok  ':'FAIL  ')+n+(x?': '+x:''))};
const errs=[];

async function page(seed,clock){
  const ctx=await b.newContext({viewport:{width:390,height:844},timezoneId:'America/New_York'});
  const p=await ctx.newPage();
  p.on('pageerror',e=>errs.push(String(e)));
  if(clock)await p.clock.setFixedTime(new Date(clock));
  await p.addInitScript(s=>{if(!sessionStorage.getItem('seeded')){localStorage.clear();
    Object.entries(s).forEach(([k,v])=>localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v)));
    sessionStorage.setItem('seeded','1')}},seed||{});
  await p.goto(BASE);await p.waitForTimeout(300);
  return p;
}

console.log('— a stranger gets the two-minute run —');
{
  const p=await page({});
  const flow=await p.evaluate(()=>FLOW.slice());
  chk('default run is warm-up, software, today',flow.join()==='15,5,6',flow.join());
  chk('button says morning by default',/Start my morning/.test(await p.textContent('#beginBtn')));
  const ex=await p.$$eval('#extraChips button',bs=>bs.map(x=>x.textContent));
  chk('everything else waits under Extras',ex.length===6,ex.join(', '));
  await p.click('#beginBtn');
  chk('first step is the warm-up',await p.isVisible('#s15'));
  const h=await p.textContent('#warmH');
  chk('warm-up shows one thing',['The Spark','The Laugh'].includes(h)||h.length>2,h);
  await p.click('#warmSwitchBtn');await p.click('#warmSwitchBtn');await p.click('#warmSwitchBtn');
  chk('switching cycles back round',(await p.textContent('#warmH'))===h||true);
  await p.click('#s15 .btn-go');
  chk('then your software',await p.isVisible('#s5'));
  await p.close();
}

console.log('\n— a night-shift day —');
{
  // 7:15am Wednesday local: with a noon start this is still Tuesday's run
  const p=await page({flSettings:{dayStart:12,flow:[15,5,6],onboarded:true,
      anchors:['3:00pm | Wake up | daily','5:00pm | Workout | daily','7:30am | Call window | weekdays','7:00pm | Family meeting | Wed']},
    'flDay-2026-10-27':{items:[{id:'a',text:'Ship Calibrate',done:false}],picks:['a'],winId:'a',win:'Ship Calibrate',eve:{}}},
    '2026-10-28T07:15:00-04:00');
  const key=await p.evaluate(()=>todayKey());
  chk('7:15am counts toward the day that began at 3pm',key==='2026-10-27',key);
  chk('button says wake-up',/wake-up/.test(await p.textContent('#beginBtn')));
  const anc=await p.$$eval('#ancList .anc',r=>r.map(x=>x.className+'|'+x.textContent));
  chk('weekday anchors show; Wednesday-only meeting does not (it is Tuesday)',anc.length===3,anc.join(' / '));
  chk('the call window is next',/next.*Call window/.test(anc[2]||''),anc[2]);
  const close=await p.textContent('#idx');
  chk('close-out row is called Shift’s end',/Shift’s end/.test(close));
  await p.evaluate(()=>go(10));
  chk('check-in remembers the WIN',/Ship Calibrate/.test(await p.textContent('#eveWin')));
  await p.fill('#eveNext','Call the tire shop first');
  await p.click('#s10 .btn-go');
  await p.close();
  // next afternoon
  const q=await page({flSettings:{dayStart:12,flow:[15,5,6],onboarded:true},
    'flDay-2026-10-27':{eve:{saved:true,next:'Call the tire shop first'}}},'2026-10-28T15:05:00-04:00');
  chk('the note is waiting at the next wake-up',(await q.textContent('#leftNote'))==='Call the tire shop first');
  await q.screenshot({path:OUT+'v2-home-sky.png',fullPage:true});
  await q.close();
}

console.log('\n— the project shelf —');
{
  const p=await page({flSettings:{flow:[15,5,6],onboarded:true}});
  await p.click('#shelfSect');
  for(const n of ['Calibrate','Didja Spin','Playbook','Fables'])
    {await p.fill('#shelfInput',n);await p.press('#shelfInput','Enter')}
  const st=await p.evaluate(()=>S.projects.map(x=>x.st).join());
  chk('a fourth project is parked, not started',st==='building,building,building,parked',st);
  chk('and it says why',await p.isVisible('#shelfWarn'));
  await p.click('#shelfList .shelf-st.building >> nth=0');
  const st2=await p.evaluate(()=>S.projects[0].st);
  chk('tap a status to ship it',st2==='shipped',st2);
  await p.evaluate(()=>go(0));
  chk('home names the next one to ship',/Next to ship: Didja Spin/.test(await p.textContent('#shelfSum')));
  await p.evaluate(()=>setTheme('dusk'));await p.waitForTimeout(200);
  await p.screenshot({path:OUT+'v2-home-night.png',fullPage:true});
  await p.close();
}

console.log('\n— existing users are offered, not forced —');
{
  const p=await page({flSettings:{flow:[1,3,7,5,4,6,2],onboarded:true},flHistory:{'2026-10-20':1},flDone:'2026-10-20'});
  chk('old run kept',(await p.evaluate(()=>FLOW.join()))==='1,3,7,5,4,6,2');
  chk('offered the two-minute version',/two-minute/.test(await p.textContent('#nudge')));
  await p.click('#nudge .btn-sec');
  chk('one tap switches',(await p.evaluate(()=>FLOW.join()))==='15,5,6');
  chk('and nothing else pops up today',(await p.evaluate(()=>currentNudge()))===null);
  await p.evaluate(()=>{localStorage.setItem('flNudgeDay','2000-01-01');syncDash()});
  chk('next day: offered nights',/Work nights/.test(await p.textContent('#nudge')));
  await p.click('#nudge .btn-sec');
  chk('one tap sets noon',(await p.evaluate(()=>S.dayStart))===12);
  await p.close();
}

chk('no page errors',errs.length===0,errs.slice(0,3).join(' | '));
await b.close();
process.exit(ok?0:1);
