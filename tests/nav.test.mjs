/* The navigation contract: on every screen you can tell what it is, where Back
   goes, what comes next — and your phone's own back gesture does the same thing
   as the Back button instead of throwing you out of the app. */
import { chromium, BASE, OUT } from './lib.mjs';
const b=await chromium.launch();
const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
let ok=true;
const chk=(n,c,x='')=>{if(!c)ok=false;console.log((c?'  ok  ':'FAIL  ')+n+(x?': '+x:''))};
const boot=async(seed)=>{
  await p.goto(BASE,{waitUntil:'domcontentloaded'});
  await p.evaluate(s=>{localStorage.clear();
    Object.keys(s||{}).forEach(k=>localStorage.setItem(k,typeof s[k]==='string'?s[k]:JSON.stringify(s[k])));},
    Object.assign({flSettings:{onboarded:true}},seed||{}));
  await p.reload({waitUntil:'domcontentloaded'});await p.waitForTimeout(450);
};
const on=()=>p.evaluate(()=>{const e=document.querySelector('.scr.on');return e?e.id:'(left the app)'});
const txt=sel=>p.evaluate(s=>{const e=document.querySelector(s);return e?e.textContent.trim():null},sel);
const vis=sel=>p.evaluate(s=>{const e=document.querySelector(s);
  return !!e&&getComputedStyle(e).visibility!=='hidden'&&e.offsetParent!==null},sel);

await boot();
const FLOW=await p.evaluate(()=>FLOW);
const PLAIN=await p.evaluate(()=>Object.fromEntries(Object.keys(STEPS).map(n=>[n,STEPS[n].plain])));

// ───────── every step, the same contract ─────────
console.log('— every step says what it is, where back goes, and what is next —');
for(let i=0;i<FLOW.length;i++){
  const n=FLOW[i],id='#s'+n;
  await p.evaluate(x=>go(x),n);await p.waitForTimeout(250);
  const title=await txt(id+' .nav-step');
  const back=await txt(id+' .nav-back .nav-lbl');
  const go_=await txt(id+' .foot .btn-go');
  const want=i===0?'Home':PLAIN[FLOW[i-1]];
  const bad=[];
  if(title.indexOf(PLAIN[n])!==0)bad.push('title "'+title+'"');
  if(title.indexOf('Step '+(i+1)+' of '+FLOW.length)<0)bad.push('no position');
  if(back!==want)bad.push('back "'+back+'" want "'+want+'"');
  if(n!==6){
    const wantGo=i===FLOW.length-1?'Finish my morning':'Next: '+PLAIN[FLOW[i+1]];
    if(go_.indexOf(wantGo)!==0)bad.push('button "'+go_+'"');
  }
  if(i===0&&await vis(id+' .nav-home'))bad.push('two exits that both go home');
  if(i>0&&!(await vis(id+' .nav-home')))bad.push('no way home');
  if(await txt(id+' .foot .btn-skip')!=='Skip this')bad.push('skip label');
  chk(PLAIN[n]+' ('+(i+1)+'/'+FLOW.length+')',bad.length===0,bad.join('; ')||('‹ '+back+' · '+go_));
}

console.log('\n— the buttons do what they say —');
await p.evaluate(x=>go(x),FLOW[2]);await p.waitForTimeout(250);
await p.click('#s'+FLOW[2]+' .nav-back');await p.waitForTimeout(300);
chk('Back lands on the step it named',await on()==='s'+FLOW[1],await on());
await p.click('#s'+FLOW[1]+' .nav-home');await p.waitForTimeout(300);
chk('Home lands home',await on()==='s0');
await p.evaluate(x=>go(x),FLOW[0]);await p.waitForTimeout(250);
await p.click('#s'+FLOW[0]+' .foot .btn-go');await p.waitForTimeout(300);
chk('the main button lands on the step it named',await on()==='s'+FLOW[1],await on());

// ───────── the phone's own back ─────────
console.log('\n— the system back gesture —');
/* Real taps, not go() calls: Chrome skips history entries that were pushed
   without a user gesture, which is the right behaviour and exactly what a
   person's taps provide. */
await boot();
await p.click('#beginBtn');await p.waitForTimeout(300);
await p.click('#s'+FLOW[0]+' .foot .btn-go');await p.waitForTimeout(300);
await p.click('#s'+FLOW[1]+' .foot .btn-go');await p.waitForTimeout(300);
await p.goBack({waitUntil:'commit'}).catch(()=>{});await p.waitForTimeout(400);
chk('steps back one step, inside the app',await on()==='s'+FLOW[1],await on());
chk('and did not leave the page',p.url().indexOf(new URL(BASE).host)>=0,p.url());
await p.goBack({waitUntil:'commit'}).catch(()=>{});await p.waitForTimeout(400);
chk('again',await on()==='s'+FLOW[0],await on());
await p.goBack({waitUntil:'commit'}).catch(()=>{});await p.waitForTimeout(400);
chk('from the first step it goes home',await on()==='s0',await on());
await p.click('#s0 [aria-label="Settings"]');await p.waitForTimeout(300);
await p.goBack({waitUntil:'commit'}).catch(()=>{});await p.waitForTimeout(400);
chk('from Settings it goes home',await on()==='s0',await on());
/* Tapping Home must spend the history entry, or the next system back would
   do nothing visible and feel broken */
await p.click('#idx .idx-row:nth-child(4)');await p.waitForTimeout(300);
await p.click('#s'+FLOW[3]+' .nav-home');await p.waitForTimeout(500);
chk('Home consumes the entry it pushed',await p.evaluate(()=>histArmed)===false);
chk('no errors in any of it',errs.length===0,errs.join(';'));

// ───────── the edges that used to be wrong ─────────
console.log('\n— the edges —');
await boot();
await p.evaluate(()=>go(8));await p.waitForTimeout(300);
chk('Wrap-up’s Back names the last step, not the crossword',
  await txt('#s8 .nav-back .nav-lbl')===PLAIN[FLOW[FLOW.length-1]],await txt('#s8 .nav-back .nav-lbl'));
await p.click('#s8 .nav-back');await p.waitForTimeout(300);
chk('and goes there',await on()==='s'+FLOW[FLOW.length-1],await on());
await p.evaluate(()=>go(8));await p.waitForTimeout(300);
chk('it no longer points at a bar that is not on the screen',
  (await txt('#recapBox')).indexOf('bar up top')<0);
const chips=await p.evaluate(()=>[...document.querySelectorAll('#recapBox .open-chip')].map(b=>b.textContent));
chk('unfinished steps are buttons, by name',chips.length===FLOW.length,chips.join(', '));
chk('and they fit on the screen',
  await p.evaluate(()=>[...document.querySelectorAll('#recapBox .open-chip')]
    .every(b=>b.getBoundingClientRect().right<=innerWidth)));
await p.click('#recapBox .open-chip');await p.waitForTimeout(300);
chk('tapping one goes to it',await on()==='s'+FLOW[0],await on());

await boot();       // Stretch is off by default, so opening it is opening it on its own
await p.evaluate(()=>go(14));await p.waitForTimeout(300);
chk('a step outside your morning does not claim "0 of 7"',
  (await txt('#s14 .nav-step')).indexOf(' of ')<0,await txt('#s14 .nav-step'));
chk('or show a progress bar it is not part of',!(await vis('#p14')));
chk('and its button just says Done',await txt('#s14 .foot .btn-go')==='Done');

console.log('\n— the Plan step —');
await boot();
await p.evaluate(()=>go(6));await p.waitForTimeout(300);
chk('part 1 says what part 2 is',await txt('#ppBtn')==='Next: pick your top three',await txt('#ppBtn'));
chk('the parts are named plainly',
  (await txt('.pp')).replace(/\s+/g,' ').indexOf('Brain dump')>=0);
await p.fill('#itemInput','Call the bank');await p.keyboard.press('Enter');await p.waitForTimeout(150);
await p.click('#ppBtn');await p.waitForTimeout(300);
chk('part 2 says what part 3 is',await txt('#ppBtn')==='Next: pick the one',await txt('#ppBtn'));
await p.click('#pickChips button, #pickChips .pick');await p.waitForTimeout(150);
await p.click('#ppBtn');await p.waitForTimeout(300);
const want6=await p.evaluate(()=>nextLabel(6));
chk('part 3 names the next module',await txt('#ppBtn')===want6,await txt('#ppBtn'));

console.log('\n— the home screen —');
await boot();
chk('the main action says what it does',(await txt('#beginBtn')).indexOf('Start my morning')===0,await txt('#beginBtn'));
await p.evaluate(x=>{mark(x,'done')},FLOW[0]);await p.evaluate(()=>go(0));await p.waitForTimeout(300);
chk('and then where you left off',
  (await txt('#beginBtn'))==='Continue: '+PLAIN[FLOW[1]]+' →',await txt('#beginBtn'));
chk('every row says what the module actually is',
  await p.evaluate(()=>[...document.querySelectorAll('#idx .idx-s')].every(e=>e.textContent.trim().length>8)));

console.log('\n— readable —');
await p.evaluate(x=>go(x),FLOW[1]);await p.waitForTimeout(300);
const sizes=await p.evaluate(x=>{const s=document.querySelector('#s'+x);
  const px=sel=>parseFloat(getComputedStyle(s.querySelector(sel)).fontSize);
  return {step:px('.nav-step'),lbl:px('.nav-lbl'),skip:px('.btn-skip'),go:px('.btn-go')}},FLOW[1]);
chk('the screen name is at least 13px',sizes.step>=13,sizes.step+'px');
chk('the back label is at least 13px',sizes.lbl>=13,sizes.lbl+'px');
chk('Skip is at least 13px',sizes.skip>=13,sizes.skip+'px');
chk('the main button is at least 14px',sizes.go>=14,sizes.go+'px');
const tgt=await p.evaluate(x=>[...document.querySelectorAll('#s'+x+' .nav-btn, #s'+x+' .btn-go, #s'+x+' .btn-skip')]
  .filter(e=>e.offsetParent&&getComputedStyle(e).visibility!=='hidden')
  /* layout size, not the painted box: the slide-in animation scales the screen
     for a moment, and a mid-animation measurement reads fractionally short */
  .map(e=>e.offsetHeight),FLOW[1]);
chk('every control is at least 44px tall',tgt.every(h=>h>=44),tgt.map(Math.round).join(','));

console.log('\n'+(errs.length?('ERRORS: '+errs.join(';')):'NO JS ERRORS'));
await b.close();
process.exit(ok&&!errs.length?0:1);
