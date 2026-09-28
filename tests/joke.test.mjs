import { chromium, BASE, OUT } from './lib.mjs';
const b=await chromium.launch();
const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
let ok=true;
const chk=(n,c,x='')=>{if(!c)ok=false;console.log((c?'  ok  ':'FAIL  ')+n+(x?': '+x:''))};
await p.goto(BASE,{waitUntil:'domcontentloaded'});
await p.evaluate(()=>{localStorage.clear();localStorage.setItem('flSettings',JSON.stringify({onboarded:true}))});
await p.reload({waitUntil:'domcontentloaded'});await p.waitForTimeout(450);

console.log('— the shelf —');
const shelf=await p.evaluate(()=>{const c={};JOKES.forEach(j=>c[j.k]=(c[j.k]||0)+1);return {n:JOKES.length,c}});
chk('a real mix of kinds',Object.keys(shelf.c).length>=6,JSON.stringify(shelf.c));
chk('no one kind dominates',Math.max(...Object.values(shelf.c))<=shelf.n*0.35);
chk('every kind has a label',await p.evaluate(()=>JOKES.every(j=>JOKE_KINDS[j.k])));
chk('every stand-up line is credited',await p.evaluate(()=>JOKES.filter(j=>j.k==='pro').every(j=>j.by)));
chk('every dad joke and anti-joke has a setup',
  await p.evaluate(()=>JOKES.filter(j=>j.k==='dad'||j.k==='anti').every(j=>j.q)));

console.log('\n— delivery —');
const setupI=await p.evaluate(()=>JOKES.findIndex(j=>j.q));
await p.evaluate(i=>{jokeI=i;go(2)},setupI);await p.waitForTimeout(400);
const j=await p.evaluate(i=>JOKES[i],setupI);
chk('the setup shows first',(await p.textContent('#jokeText')).trim()===j.q);
chk('the punchline is held back',
  await p.evaluate(()=>getComputedStyle(document.getElementById('jokeA')).opacity)==='0');
chk('a button says how to get it',await p.isVisible('#jokeTell'));
await p.click('#jokeTell');await p.waitForTimeout(500);
chk('one tap delivers it',
  await p.evaluate(()=>getComputedStyle(document.getElementById('jokeA')).opacity)==='1');
chk('and the button gets out of the way',!(await p.isVisible('#jokeTell')));

const lineI=await p.evaluate(()=>JOKES.findIndex(j=>!j.q&&j.by));
await p.evaluate(i=>{jokeI=i;paintJoke()},lineI);await p.waitForTimeout(200);
chk('a one-liner shows whole, with no button',!(await p.isVisible('#jokeTell')));
chk('with its credit',(await p.textContent('#jokeWho')).trim().length>0);

console.log('\n— "a different kind" —');
let sameKind=0,repeats=0;const seen=new Set();
for(let i=0;i<25;i++){
  const before=await p.evaluate(()=>JOKES[jokeI].k);
  await p.click('text=A different kind');await p.waitForTimeout(60);
  const [k,idx]=await p.evaluate(()=>[JOKES[jokeI].k,jokeI]);
  if(k===before)sameKind++;
  if(seen.has(idx))repeats++;seen.add(idx);
}
chk('it really does change the kind',sameKind===0,sameKind+' of 25 did not');
chk('and does not repeat itself',repeats===0,repeats+' repeats in 25');

console.log('\n— the day remembers it —');
await p.evaluate(()=>go(0));await p.waitForTimeout(200);
const today=await p.evaluate(()=>DAY.joke);
await p.evaluate(()=>go(2));await p.waitForTimeout(300);
chk('stepping away and back keeps the same joke',await p.evaluate(()=>DAY.joke)===today);
await p.reload({waitUntil:'domcontentloaded'});await p.waitForTimeout(400);
await p.evaluate(()=>go(2));await p.waitForTimeout(300);
chk('so does a reload',await p.evaluate(()=>DAY.joke)===today);
await p.evaluate(()=>{recordDay(todayKey());openJournal(todayKey())});await p.waitForTimeout(400);
const jr=await p.textContent('#jrBody');
const shown=await p.evaluate(()=>{const j=JOKES[jokeI];return j.a});
chk('the journal carries the whole joke, punchline included',jr.indexOf(shown)>=0);
chk('with no pipe on the page',jr.indexOf(' | ')<0);

console.log('\n'+(errs.length?('ERRORS: '+errs.join(';')):'NO JS ERRORS'));
await b.close();
process.exit(ok&&!errs.length?0:1);
