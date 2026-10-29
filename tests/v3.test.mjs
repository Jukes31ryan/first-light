/* v3: under a minute. Warm-up, one WIN, one thing for home. Nothing repeats. */
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
const on=p=>p.evaluate(()=>document.querySelector('.scr.on').id);

console.log('— the run —');
{
  const p=await page({flSettings:{onboarded:true}});
  await p.click('#beginBtn');await p.waitForTimeout(250);
  chk('starts on the warm-up',await on(p)==='s15');
  await p.click('#s15 .btn-go');await p.waitForTimeout(250);
  chk('then the WIN',await on(p)==='s18');
  chk('one input, one main button (no second Set button)',(await p.$$('#s18 .add-btn')).length===0);
  await p.click('#s18 .btn-go');await p.waitForTimeout(250);
  chk('an empty WIN does not slip through',await on(p)==='s18');
  chk('and says why',/Type one thing/.test(await p.textContent('#winNow')));
  await p.fill('#winInput','Ship the playbook app');await p.keyboard.press('Enter');await p.waitForTimeout(250);
  chk('Enter sets it and moves on',await on(p)==='s17');
  chk('the WIN is saved',(await p.evaluate(()=>DAY.win))==='Ship the playbook app');
  const fam=await p.textContent('#famTxt');
  chk('a home-team prompt shows',fam.trim().length>10,fam);
  await p.click('#s17 .btn-go');await p.waitForTimeout(1400);
  chk('the last step finishes and lands home',await on(p)==='s0');
  chk('and the day counts',(await p.evaluate(()=>localStorage.getItem('flDone')))===(await p.evaluate(()=>todayKey())));
  chk('the WIN now leads the home screen',await p.evaluate(()=>document.getElementById('focusSect').nextElementSibling.id==='beginBtn'));
  chk('showing the WIN',(await p.textContent('#winT')).trim()==='Ship the playbook app');
  await p.screenshot({path:OUT+'/v3-home-after.png'});
  await p.close();
}

console.log('\n— nothing repeats until everything has shown —');
{
  const p=await page({flSettings:{onboarded:true}});
  const r=await p.evaluate(()=>{
    const lap=(n,f)=>{const s=new Set();for(let i=0;i<n;i++)s.add(f());return s.size};
    famI=null;const fam=lap(FAM.length,()=>{famAnother();return famI});
    const q=lap(S.quotes.length,()=>{sparkI=pick('quote',sparkI);return sparkI});
    const st=lap(STORIES.length,()=>{storyI=pick('story',storyI);return storyI});
    return {fam,fn:FAM.length,q,qn:S.quotes.length,st,sn:STORIES.length,days:Array.isArray(JSON.parse(localStorage.getItem('flSeen')||'[]'))};
  });
  chk('every home-team prompt before a repeat',r.fam===r.fn,r.fam+' of '+r.fn);
  chk('every quote before a repeat',r.q===r.qn,r.q+' of '+r.qn);
  chk('every story before a repeat',r.st===r.sn,r.st+' of '+r.sn);
  chk('and the day-visit record is left alone',r.days);
  await p.close();
}

console.log('\n— moving to v3 —');
{
  const p=await page({flSettings:{onboarded:true,flow:[15,5,6]}});
  chk('the old default run moves to v3',(await p.evaluate(()=>FLOW.join()))==='15,18,17');
  await p.close();
  const q=await page({flSettings:{onboarded:true,flow:[1,6,2]}});
  chk('a run you built yourself is kept',(await q.evaluate(()=>FLOW.join()))==='1,6,2');
  await q.close();
}

console.log('\n— US spelling —');
{
  const p=await page({flSettings:{onboarded:true}});
  const html=await p.content();
  chk('no "Prioritise"',!/Prioritis/i.test(html));
  chk('no British -our/-ise in visible text',!/\b(favour|colour|honour|organis|realis|recognis)/i.test(await p.evaluate(()=>document.body.innerText)));
  await p.close();
}

chk('no script errors',errs.length===0,errs.join(' | '));
await b.close();
process.exit(ok?0:1);
