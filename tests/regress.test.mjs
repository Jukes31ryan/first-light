/* Rebuilt regression suite. The original 23 files were lost when the container
   recycled; this covers the same ground in one pass — content integrity, the
   modular flow, carry-over, the journal, settings persistence, tag filtering,
   the crossword, the streak, the evening, and every screen without an error. */
import { chromium, BASE, OUT } from './lib.mjs';
const SS=OUT;
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
let ok=true;
const chk=(n,c,x='')=>{if(!c)ok=false;console.log((c?'  ok  ':'FAIL  ')+n+(x?': '+x:''))};
const boot=async(seed)=>{
  await p.goto(BASE,{waitUntil:'domcontentloaded'});
  await p.evaluate(s=>{localStorage.clear();
    Object.keys(s||{}).forEach(k=>localStorage.setItem(k,
      typeof s[k]==='string'?s[k]:JSON.stringify(s[k])));},seed||{});
  await p.reload({waitUntil:'domcontentloaded'});await p.waitForTimeout(450);
};

// ───────── content: the shelves, and no holes in them ─────────
console.log('— the shelves —');
await boot({flSettings:{onboarded:true}});
const counts=await p.evaluate(()=>({
  quotes:S.quotes.length, realQuotes:S.quotes.filter(()=>true).length,
  stories:STORIES.length, jokes:JOKES.length,
  cw:PUZZLES.length+PUZZLES7.length, cards:CARD_LIBRARY.length}));
chk('quotes',counts.quotes>=141,String(counts.quotes));
chk('stories',counts.stories>=50,String(counts.stories));
chk('jokes',counts.jokes>=130,String(counts.jokes));
chk('crosswords',counts.cw===53,String(counts.cw));
chk('cards in the library',counts.cards>=40,String(counts.cards));
/* an array hole counts in .length but is skipped by map/filter, which is how a
   doubled comma once shipped a Spark that rendered "undefined" */
chk('no array holes anywhere',
  counts.quotes===counts.realQuotes&&
  await p.evaluate(()=>[S.quotes,S.affirms,JOKES,STORIES,CARD_LIBRARY,SHARP_CARDS,DEF_AFFIRMS]
    .every(a=>a.filter(()=>true).length===a.length)));

console.log('\n— every quote, story and joke renders —');
const bad=await p.evaluate(()=>{
  const out=[];
  S.quotes.forEach((q,i)=>{const [t,a]=splitLine(q);
    if(!t||/undefined/.test(t)||/undefined/.test(a))out.push('quote '+i)});
  JOKES.forEach((j,i)=>{if(!j||!j.a||!j.k||/undefined/.test(j.a+(j.q||'')))out.push('joke '+i)});
  STORIES.forEach((s,i)=>{if(!s.t||!s.s||!s.m)out.push('story '+i)});
  return out;
});
chk('nothing renders as undefined or blank',bad.length===0,bad.slice(0,5).join(', '));
chk('every story has a takeaway',await p.evaluate(()=>STORIES.every(s=>s.m&&s.m.trim().length>8)));
chk('and every story is actually long-form',
  await p.evaluate(()=>STORIES.every(s=>s.s.length>400)));
chk('unattributed lines are never printed as their own author',
  await p.evaluate(()=>{const [t,a]=splitLine('Just a line with no pipe');return t&&!a}));

// ───────── the modular flow, and the permanence of step ids ─────────
console.log('\n— the modular flow —');
await boot({flSettings:{onboarded:true,flow:[6,2]}});
chk('a two-module morning is honoured',await p.evaluate(()=>JSON.stringify(FLOW))==='[6,2]');
chk('the count reflects it',(await p.textContent('#seqCount')).indexOf('/2')>0);
await p.evaluate(()=>{go(6);mark(6,'done')});await p.waitForTimeout(250);
chk('the last module hands off to Launch',
  await p.evaluate(async()=>{flowNext(2);await new Promise(r=>setTimeout(r,250));
    return document.querySelector('.scr.on').id==='s8'}));
await boot({flSettings:{onboarded:true,flow:[]}});
chk('an empty flow falls back rather than shipping a blank app',
  await p.evaluate(()=>FLOW.length>0));
await boot({flSettings:{onboarded:true,flow:[1,99,3,1]}});
chk('junk and duplicates are filtered out',
  await p.evaluate(()=>JSON.stringify(FLOW))==='[1,3]',
  await p.evaluate(()=>JSON.stringify(FLOW)));

// ───────── carry-over across a gap, not just from yesterday ─────────
console.log('\n— unfinished work follows you —');
const daysAgo=n=>{const d=new Date();d.setDate(d.getDate()-n);return d.toISOString().slice(0,10)};
await boot({flSettings:{onboarded:true},
  ['flDay-'+daysAgo(5)]:{items:[{id:'a',text:'Call the bank',done:false},
                               {id:'b',text:'Already handled',done:true}]}});
const carried=await p.evaluate(()=>DAY.items||[]);
chk('an item five days old still arrives',carried.length===1&&carried[0].text==='Call the bank',
  JSON.stringify(carried.map(i=>i.text)));
chk('and a finished one does not',!carried.some(i=>i.text==='Already handled'));
chk('it is tagged with where it came from',carried[0]&&carried[0].carried===true);
chk('and how old it is reads in words',
  /day|Yester|Mon|Tue|Wed|Thu|Fri|Sat|Sun/.test(await p.evaluate(()=>carriedAge(daysAgoKey()))
    .catch(()=>'')||await p.evaluate(k=>carriedAge(k),daysAgo(5))));
await boot({flSettings:{onboarded:true},['flDay-'+daysAgo(3)]:{items:[{id:'a',text:'Old',done:false}],purge:1},
  ['flDay-'+daysAgo(1)]:{items:[{id:'c',text:'Newer',done:false}]}});
chk('the most recent day wins, not the oldest',
  await p.evaluate(()=>(DAY.items||[]).map(i=>i.text).join())==='Newer',
  await p.evaluate(()=>(DAY.items||[]).map(i=>i.text).join()));

// ───────── the journal remembers the day as it was ─────────
console.log('\n— the journal —');
await boot({flSettings:{onboarded:true,flow:[1,6]},
  flHistory:{[daysAgo(2)]:1},
  ['flDay-'+daysAgo(2)]:{win:'Finish the deck',t1:'One',t2:'Two',note:'a thought I had',
    status:{1:'done',3:'done',6:'done'},software:'Craft | Slow is smooth',
    items:[{id:'x',text:'A task',done:true}],eve:{hit:'yes',grateful:'the quiet'}}});
await p.evaluate(k=>openJournal(k),daysAgo(2));await p.waitForTimeout(400);
const jr=await p.textContent('#jrBody');
['Finish the deck','One','a thought I had','Slow is smooth','A task','the quiet']
  .forEach(s=>chk('the page carries "'+s+'"',jr.indexOf(s)>=0));
chk('no pipe leaks into the page',jr.indexOf(' | ')<0);
chk('a module that day recorded still shows, though it is off the flow today',
  jr.indexOf('Story')>=0,'chips: '+jr.slice(0,0));

// ───────── settings persist as a whole, not two fields ─────────
console.log('\n— settings —');
await boot({flSettings:{onboarded:true,flow:[1,2],tags:['stoic'],hadLegacy:true}});
await p.evaluate(()=>{openSettings();$('setAffirms').value='Mine | A line of my own';saveSettings()});
await p.waitForTimeout(400);
const saved=await p.evaluate(()=>readJSON('flSettings',{}));
chk('the new cards are saved',saved.affirms&&saved.affirms[0]==='Mine | A line of my own');
chk('and the flow is not dropped on the floor',JSON.stringify(saved.flow)==='[1,2]',
  JSON.stringify(saved.flow));
chk('nor the tags',JSON.stringify(saved.tags)==='["stoic"]',JSON.stringify(saved.tags));
chk('nor anything else already in there',saved.hadLegacy===true&&saved.onboarded===true);
await p.reload({waitUntil:'domcontentloaded'});await p.waitForTimeout(400);
chk('and it all survives a reload',
  await p.evaluate(()=>S.affirms[0]==='Mine | A line of my own'&&JSON.stringify(S.flow)==='[1,2]'));

// ───────── tags narrow, and widen rather than repeat ─────────
console.log('\n— flavours —');
await boot({flSettings:{onboarded:true,tags:['stoic']}});
chk('a tag narrows the pool',await p.evaluate(()=>poolFor('quote').ix.length)<counts.quotes);
await boot({flSettings:{onboarded:true,tags:['__nothing_matches__']}});
const widened=await p.evaluate(()=>poolFor('quote'));
chk('a pool too small widens instead of repeating',widened.widened===true);
chk('and says so rather than pretending',
  await p.evaluate(async()=>{go(1);await new Promise(r=>setTimeout(r,300));
    return (document.getElementById('sparkWide').textContent||'').length>0}));

// ───────── the crossword plays and can be won ─────────
console.log('\n— the mini —');
await boot({flSettings:{onboarded:true}});
await p.evaluate(()=>go(7));await p.waitForTimeout(500);
chk('a grid is on screen',await p.evaluate(()=>document.querySelectorAll('#cwGrid input').length)>0);
const won=await p.evaluate(async()=>{
  for(let r=0;r<CW.N;r++)for(let c=0;c<CW.N;c++){
    if(CW.g[r][c]==='#')continue;
    const el=document.getElementById('cw-'+r+'-'+c).querySelector('input');
    el.value=CW.g[r][c];el.dispatchEvent(new Event('input',{bubbles:true}));
  }
  await new Promise(r=>setTimeout(r,700));
  return statusOf(7)==='done';
});
chk('filling it correctly completes the step',won);
chk('and the celebration does not throw',errs.length===0,errs.join(';'));

// ───────── the streak, and the one grace day ─────────
console.log('\n— the streak —');
await boot({flSettings:{onboarded:true},flStreak:'9',flDone:daysAgo(1)});
await p.evaluate(()=>finishDay());await p.waitForTimeout(900);
chk('a consecutive day counts up',await p.evaluate(()=>localStorage.getItem('flStreak'))==='10');
await boot({flSettings:{onboarded:true},flStreak:'40',flDone:daysAgo(2)});
await p.evaluate(()=>finishDay());await p.waitForTimeout(900);
chk('one missed day is forgiven',await p.evaluate(()=>localStorage.getItem('flStreak'))==='41');
chk('and the app admits it used the grace day',
  await p.evaluate(()=>+localStorage.getItem('flSaved'))===1);
await boot({flSettings:{onboarded:true},flStreak:'40',flDone:daysAgo(2),flGrace:daysAgo(1)});
await p.evaluate(()=>finishDay());await p.waitForTimeout(900);
chk('but only one a week',await p.evaluate(()=>localStorage.getItem('flStreak'))==='1');

// ───────── the evening closes the loop ─────────
console.log('\n— the evening —');
/* the WIN is derived from the picked item, never assigned — seed it the way
   the Today step would leave it */
const today=new Date().toISOString().slice(0,10);
await boot({flSettings:{onboarded:true},
  ['flDay-'+today]:{items:[{id:'w',text:'The one thing',done:false}],picks:['w'],winId:'w'}});
/* win and t1..t3 are display copies, recomputed on save rather than stored */
chk('the WIN is not stored, it is derived',await p.evaluate(()=>DAY.win)===undefined);
await p.evaluate(()=>go(10));await p.waitForTimeout(400);
chk('and the first save derives it from the picked item',
  await p.evaluate(()=>DAY.win)==='The one thing',await p.evaluate(()=>DAY.win));
chk("it reads back this morning's WIN",
  (await p.textContent('#eveWin')).indexOf('The one thing')>=0,
  await p.textContent('#eveWin'));
await p.evaluate(()=>{eveHit('yes',document.querySelectorAll('#eveSeg button')[0]);
  $('eveGrateful').value='a good walk';saveEvening()});
await p.waitForTimeout(500);
chk('and what you write is kept',
  await p.evaluate(()=>readJSON('flDay-'+todayKey(),{}).eve.grateful)==='a good walk');

// ───────── every screen, both themes, no errors ─────────
console.log('\n— a walk through the whole app —');
await boot({flSettings:{onboarded:true},flHistory:{[daysAgo(1)]:1}});
const before=errs.length;
for(const n of [1,2,3,4,5,6,7,14,8,9,10,11,0]){
  await p.evaluate(x=>go(x),n);await p.waitForTimeout(200);
}
await p.evaluate(()=>toggleTheme());await p.waitForTimeout(250);
for(const n of [1,3,7,6,8,0]){await p.evaluate(x=>go(x),n);await p.waitForTimeout(180)}
chk('no screen throws in either theme',errs.length===before,errs.slice(before).join(';'));
chk('and it lands back on the dashboard',
  await p.evaluate(()=>document.querySelector('.scr.on').id)==='s0');
await p.screenshot({path:SS+'G0-dash-dusk.png'});

console.log('\n'+(errs.length?('ERRORS: '+errs.join(';')):'NO JS ERRORS'));
await b.close();
process.exit(ok&&!errs.length?0:1);
