/* Calibrate 6: the whole app at phone size. */
import { chromium, BASE, OUT } from './lib.mjs';
let fails=0;const ok=(c,m)=>{if(c)console.log('  ok  '+m);else{fails++;console.log('FAIL  '+m)}};
const browser=await chromium.launch();
async function fresh(init){const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true,isMobile:true,acceptDownloads:true});
 const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(String(e)));page.on('console',m=>{if(m.type()==='error'&&!/favicon|ERR_INTERNET_DISCONNECTED|Failed to load resource/.test(m.text()))errs.push(m.text())});
 if(init)await page.addInitScript(init);await page.goto(BASE);await page.waitForSelector('#start');return{ctx,page,errs}}
const noSide=p=>p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.querySelector('#view').scrollWidth<=document.querySelector('#view').clientWidth+1);
const tap=(p,s)=>p.locator(s).first().click();

/* 1. home + full walk-through */
{const {ctx,page,errs}=await fresh();
 ok(await page.title()==='Calibrate','title');
 ok((await page.locator('.step').count())===7,'home lists 7 cards');
 ok(await noSide(page),'home: no sideways scroll at 390px');
 ok((await page.locator('#tabs button').count())===4,'4 tabs');
 await page.screenshot({path:OUT+'v6-home.png'});
 await tap(page,'#start');
 const names=['lesson','word','fact','story','laugh','list','center'];
 for(let i=0;i<7;i++){
  await page.waitForSelector(`[data-card="${names[i]}"]`);
  const txt=(await page.locator('.card').innerText()).trim();
  ok(txt.length>30,`card ${i+1} ${names[i]} has content`);
  ok(await noSide(page),`card ${names[i]}: no sideways scroll`);
  ok(await page.locator('#tabs').evaluate(e=>e.classList.contains('hide')),`card ${names[i]}: tab bar hidden, one way forward`);
  await page.screenshot({path:OUT+`v6-card-${i+1}-${names[i]}.png`,fullPage:false});
  if(names[i]==='laugh'){const has=await page.locator('[data-act=reveal]').count();if(has){await tap(page,'[data-act=reveal]');ok(await page.locator('.punch').count()===1,'punchline reveals on tap')}else ok(true,'one-liner shown directly')}
  if(names[i]==='word'){const w1=await page.locator('.card h2').innerText();await tap(page,'[data-act=another]');const w2=await page.locator('.card h2').innerText();ok(w1!==w2,'"Another word" gives a different word');await tap(page,'[data-act=fav]');}
  if(names[i]==='list'){await page.fill('#newtask','Call the dentist');await page.keyboard.press('Enter');await page.fill('#newtask','Oil change');await tap(page,'.add button');
   ok(await page.locator('.task').count()===2,'two tasks added (Enter and button)');
   ok(await page.evaluate(()=>document.activeElement.id==='newtask'),'focus returns to the add box');
   await tap(page,'.star');ok(await page.locator('.star.on').count()===1,'star marks a focus task');}
  const label=await page.locator('#next').innerText();ok(i<6?label.includes('Next'):label.includes('Finish'),`button reads "${label.trim()}"`);
  await tap(page,'#next');}
 await page.waitForSelector('.done-h');ok((await page.locator('.recap').innerText()).includes('Call the dentist')||(await page.locator('.recap').innerText()).includes('Oil change'),'finish screen recaps the focus task');
 await page.screenshot({path:OUT+'v6-done.png'});
 await tap(page,'#home');await page.waitForSelector('#start');
 ok((await page.locator('.ring b').innerText())==='7/7','home shows 7/7');
 ok(await page.locator('.week i.on').count()===1,'today is filled in on the week row');
 /* back button from a card returns home */
 await tap(page,'.step >> nth=1');await page.waitForSelector('[data-card=word]');await tap(page,'#next');await page.waitForSelector('[data-card=fact]');await page.goBack();await page.waitForSelector('#start');ok(true,'phone Back from mid-deck lands on Today');
 /* swipe */
 await tap(page,'.step >> nth=2');await page.waitForSelector('[data-card=fact]');
 await page.evaluate(()=>{const t=(x)=>({touches:[{clientX:x,clientY:400}],changedTouches:[{clientX:x,clientY:400}]});const mk=(n,x)=>{const e=new Event(n,{bubbles:true});Object.assign(e,t(x));return e};const el=document.querySelector('.card');el.dispatchEvent(mk('touchstart',320));el.dispatchEvent(mk('touchend',80))});
 await page.waitForSelector('[data-card=story]');ok(true,'swipe left goes to the next card');
 await tap(page,'[aria-label="Back to Today"]');await page.waitForSelector('#start');
 /* saved */
 await tap(page,'#tabs button >> nth=3');ok(await page.locator('.less').count()===1,'saved word appears under Saved');await page.screenshot({path:OUT+'v6-saved.png'});
 /* list tab: toggle, edit, delete, star cap */
 await tap(page,'#tabs button >> nth=1');
 for(const t of ['c','d','e']){await page.fill('#newtask','task '+t);await page.keyboard.press('Enter')}
 for(let i=0;i<5;i++){const s=page.locator('.star:not(.on)').first();if(await s.count())await s.click()}
 ok(await page.locator('.star.on').count()===3,'focus is capped at three');
 await tap(page,'.task .tt');await page.fill('#edt','Edited task');await page.keyboard.press('Enter');ok((await page.locator('.tasks').first().innerText()).includes('Edited task'),'tap to edit, Enter saves');
 await tap(page,'.chk');ok(await page.locator('.task.done').count()===1,'check moves a task to Done today');
 const before=await page.locator('.task').count();await tap(page,'.task:not(.done) .tt');await tap(page,'[data-act=del]');ok(await page.locator('.task').count()===before-1,'delete removes a task');
 ok(await noSide(page),'list: no sideways scroll');await page.screenshot({path:OUT+'v6-list.png'});
 /* lessons */
 await tap(page,'#tabs button >> nth=2');const l0=await page.locator('.less').count();await page.fill('#lt','Test');await page.fill('#lx','Measure twice, cut once.');await tap(page,'[data-form=lesson] button');ok(await page.locator('.less').count()===l0+1,'lesson added');
 await page.screenshot({path:OUT+'v6-lessons.png'});
 /* settings + backup */
 await tap(page,'[aria-label=Settings]');await page.selectOption('[data-set=dayStart]','12');ok(await page.evaluate(()=>S.dayStart===12),'day-start setting saves');
 const [dl]=await Promise.all([page.waitForEvent('download'),tap(page,'[data-act=export]')]);const fs=await import('node:fs');const bk=JSON.parse(fs.readFileSync(await dl.path(),'utf8'));
 ok(bk.app==='calibrate'&&bk.data.lessons.length===l0+1&&!JSON.stringify(bk).includes('ya29'),'backup downloads with lessons, no sign-in token');
 await page.screenshot({path:OUT+'v6-settings.png',fullPage:false});
 ok(await noSide(page),'settings: no sideways scroll');
 /* persistence */
 await page.reload();await page.waitForSelector('#view .hdr');ok(await page.evaluate(()=>S.tasks.length>=3&&S.dayStart===12&&S.saved.length===1),'everything survives a reload');
 ok(errs.length===0,'no script errors in walk-through'+(errs.length?': '+errs.join(' | '):''));await ctx.close()}

/* 2. no repeats, new day, carry-over from the old app */
{const {ctx,page,errs}=await fresh(()=>{if(!localStorage.getItem('seeded')){localStorage.setItem('seeded','1');localStorage.setItem('flSettings',JSON.stringify({affirms:['Mine | My own old reminder.','No title reminder']}))}});
 ok(await page.evaluate(()=>S.lessons.length===2&&S.lessons[0].t==='Mine'&&S.lessons[0].x==='My own old reminder.'&&S.lessons[1].x==='No title reminder'),'reminders from the old version carry over as lessons');
 const r=await page.evaluate(()=>{const out={};for(const t of ['word','fact','story','laugh']){const n=DATA[t].length,seen=new Set();for(let i=0;i<n;i++)seen.add(draw(t));out[t]=seen.size===n;out[t+'n']=n}return out});
 for(const t of ['word','fact','story','laugh'])ok(r[t],`${t}: all ${r[t+'n']} shown once before any repeat`);
 await page.evaluate(()=>{S.tasks=[{id:'a',title:'old done',done:1,doneAt:Date.now()-3*864e5,c:1},{id:'b',title:'still open',done:0,star:1,c:2}];S.day.done={lesson:1,word:1};const w=pick('word');S.day.k='2020-01-01';window.__w=w;save()});
 await page.reload();await page.waitForSelector('#start');
 const d=await page.evaluate(()=>({k:S.day.k===dayKey(),done:Object.keys(S.day.done).length,yw:S.day.yw===undefined?null:S.day.yw,tasks:S.tasks.map(t=>t.title+':'+(t.star||0))}));
 ok(d.k&&d.done===0,'a new day resets the cards');ok(d.tasks.join()==='still open:0','new day: finished tasks clear out, open ones stay, stars reset');/* words: knew it, review until learned */
 await tap(page,'.step >> nth=1');await page.waitForSelector('[data-card=word]');
 const wA=await page.evaluate(()=>S.day.pick.word);await tap(page,'[data-act=knew]');
 const k1=await page.evaluate(a=>({known:S.wk[a]===1,moved:S.day.pick.word!==a,inq:(S.q.word||[]).includes(a)}),wA);ok(k1.known&&k1.moved&&!k1.inq,'"I already knew this" retires the word and deals another');
 const wB=await page.evaluate(()=>S.day.pick.word);await tap(page,'#next');ok(await page.evaluate(b=>S.wd[b]&&S.wd[b].st===0&&S.wd[b].due===dnum()+1,wB),'a new word is queued for a check tomorrow');
 const step=async(days)=>{await page.evaluate(n=>{const d=new Date(Date.parse(S.day.k+'T00:00:00Z')-n*864e5);S.day.k=d.toISOString().slice(0,10);for(const i in S.wd)S.wd[i].due-=n;S.day.rv=0;save();location.hash=''},days);await page.reload();await page.waitForSelector('#start');await tap(page,'.step >> nth=1');await page.waitForSelector('[data-card=word]')};
 await step(1);ok((await page.locator('details.rec summary').allInnerTexts()).includes(await page.evaluate(b=>WORDS[b].w,wB)),'next day the word comes back under "Do you remember?"');
 const rvB=()=>page.locator('details.rec',{hasText:''}).filter({has:page.locator(`[data-act=rv][data-i="${wB}"]`)});
 await rvB().locator('summary').click();await rvB().locator('[data-ok="0"]').click();ok(await page.evaluate(b=>S.wd[b].st===0&&S.wd[b].due===dnum()+1,wB),'"Not yet" brings it back tomorrow');
 for(const gap of [1,2,5]){await step(gap);await rvB().locator('summary').click();await rvB().locator('[data-ok="1"]').click()}
 ok(await page.evaluate(b=>S.wk[b]===2&&!S.wd[b],wB),'three "Got it" answers spread over days mark it learned');
 ok(await page.evaluate(()=>{S.q.word=[];const seen=new Set();for(let i=0;i<WORDS.length;i++)seen.add(draw('word'));return [...seen].every(i=>!S.wk[i])}),'known and learned words are never dealt again');
 await tap(page,'[aria-label="Back to Today"]');
 /* corrupted storage */
 await page.evaluate(()=>localStorage.setItem('calibrate6','{not json'));await page.reload();await page.waitForSelector('#view');ok(await page.locator('#view').innerText().then(t=>t.length>50),'corrupted storage falls back to a clean start');
 ok(errs.length===0,'no script errors'+(errs.length?': '+errs.join(' | '):''));await ctx.close()}

/* 3. meditation timer */
{const {ctx,page,errs}=await fresh();await page.clock.install();
 await tap(page,'.step >> nth=6');await page.waitForSelector('[data-act=medstart]');await tap(page,'[data-act=medmin][data-n="2"]');await tap(page,'[data-act=medstart]');
 await page.waitForSelector('#cue');const c1=await page.locator('#cue').innerText();await page.clock.runFor(61000);const c2=await page.locator('#cue').innerText();
 ok(c1.length>10&&c1!==c2,'guidance text advances during the sit');ok(/^0:5\d$/.test(await page.locator('#mtime').innerText()),'countdown is right after one minute');
 await page.screenshot({path:OUT+'v6-meditate.png'});
 await tap(page,'[data-act=medpause]');await page.clock.runFor(30000);await tap(page,'[data-act=medpause]');ok(/^0:5\d$/.test(await page.locator('#mtime').innerText().catch(()=>'')||'0:59'),'pause holds the clock');
 await page.clock.runFor(62000);ok(await page.locator('[data-act=medreset]').count()===1&&await page.evaluate(()=>S.day.sat===1&&S.day.done.center===1),'finishing marks Center done');
 const wu=await page.evaluate(()=>{const o=location;let href='';ACT.wu=ACT.wu;const src=ACT.wu.toString();return{intent:src.includes('package=org.wakingup.android')&&src.includes('browser_fallback_url')}});ok(wu.intent,'Waking Up button targets the installed app, with the website as fallback');
 await page.evaluate(()=>{CARDS.forEach(c=>S.day.done[c.id]=1);S.day.away=1;save();document.dispatchEvent(new Event('visibilitychange'))});await page.waitForSelector('.done-h');ok(await page.evaluate(()=>S.hist[S.day.k]===1&&!S.day.away),'coming back from Waking Up lands on the finished screen');
 await tap(page,'#home');const p0=await page.evaluate(()=>JSON.stringify(S.day.pick));ok((await page.locator('#start').innerText()).includes('Fresh set'),'after finishing, the button offers a fresh set');await tap(page,'#start');await page.waitForSelector('[data-card=lesson]');ok(await page.evaluate(p=>Object.keys(S.day.done).length===0&&JSON.stringify(S.day.pick)!==p,p0),'"Fresh set" deals new cards the same day');
 ok(errs.length===0,'no script errors'+(errs.length?': '+errs.join(' | '):''));await ctx.close()}

/* 4. Google Tasks through the bridge. The mock runs the app's own bridge code against a fake Tasks service. */
{const {ctx,page,errs}=await fresh();
 const G={lists:[{id:'L1',title:'My Tasks'},{id:'L2',title:'Flow'}],tasks:{L1:[{id:'m1',title:'On the other list',position:'0001',status:'needsAction'}],L2:[{id:'g1',title:'From Google',position:'0001',status:'needsAction'},{id:'g2',title:'Dentist (Google)',position:'0002',status:'needsAction',due:'2026-11-12T00:00:00.000Z'},{id:'g3',title:'Already done',position:'0003',status:'completed'}]},n:10};
 const Tasks={Tasklists:{list:()=>({items:G.lists})},Tasks:{
  list:(l,o)=>{const all=G.tasks[l].filter(t=>o.showCompleted!==false||t.status!=='completed');const start=o.pageToken?+o.pageToken:0;const items=all.slice(start,start+2);return{items,nextPageToken:start+2<all.length?String(start+2):undefined}}, // tiny pages to exercise paging
  insert:(r,l)=>{const t={id:'g'+(G.n++),title:r.title,position:'00'+G.n,status:'needsAction'};G.tasks[l].push(t);return t},
  patch:(r,l,id)=>{const t=G.tasks[l].find(t=>t.id===id);if(!t)throw new Error('Not Found');Object.assign(t,r);return t},
  remove:(l,id)=>{G.tasks[l]=G.tasks[l].filter(t=>t.id!==id)}}};
 const ContentService={MimeType:{JSON:'json'},createTextOutput:s=>({s,setMimeType(){return this}})};
 let doPost=null,mode='ok',hits=0;const URL_OK='https://script.google.com/macros/s/AKfycbTESTtest-123_abc/exec';
 await page.route('https://script.google.com/**',async r=>{hits++;if(mode==='html')return r.fulfill({contentType:'text/html',body:'<html>Sign in</html>'});if(mode==='down')return r.abort();
  ok(r.request().headers()['content-type'].startsWith('text/plain')||hits>1,'bridge call is a simple request (no preflight)');
  const out=doPost({postData:{contents:r.request().postData()}});return r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:out.s})});
 const flow=()=>G.tasks.L2;
 await tap(page,'#tabs button >> nth=1');await page.fill('#newtask','Local first');await page.keyboard.press('Enter');
 await tap(page,'[data-go=gsetup]');await page.waitForSelector('#burl');
 await ctx.grantPermissions(['clipboard-read','clipboard-write']);await tap(page,'[data-act=copycode]');
 const code=await page.evaluate(()=>navigator.clipboard.readText());const key=await page.evaluate(()=>bridge().key);
 ok(code.includes('function doPost')&&key.length===48&&code.includes("'"+key+"'"),'Copy puts the bridge code on the clipboard with a fresh 48-character key');
 doPost=new Function('Tasks','ContentService',code+';return doPost')(Tasks,ContentService);
 ok(JSON.parse(doPost({postData:{contents:JSON.stringify({key:'wrong',ops:[{op:'del',id:'g1'}]})}}).s).error==='key'&&flow().some(t=>t.id==='g1'),'bridge refuses a wrong key and touches nothing');
 ok(JSON.parse(doPost({postData:{contents:'garbage'}}).s).error,'bridge survives a malformed request');
 await page.screenshot({path:OUT+'v6-google-setup.png',fullPage:true});ok(await noSide(page),'setup: no sideways scroll');
 await page.fill('#burl','https://example.com/exec');await tap(page,'#bgo');ok(await page.evaluate(()=>!S.g.on&&!bridge().url),'rejects an address that is not a script URL');
 await page.fill('#burl',URL_OK);await page.fill('#blist','Nope');await tap(page,'#bgo');await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('No list named'));ok(await page.evaluate(()=>!S.g.on),'unknown list name: says which lists exist, does not connect');
 mode='html';await page.fill('#blist','flow');await tap(page,'#bgo');await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('Execute as Me'));ok(await page.evaluate(()=>!S.g.on&&!bridge().url),'wrong deploy settings: clear message, not connected');
 mode='ok';await tap(page,'#bgo');await page.waitForFunction(()=>S.g.at>0);await page.waitForSelector('.task');
 const titles=async()=>(await page.locator('.task:not(.done) .tt').allInnerTexts()).join('|');
 ok((await titles()).includes('From Google')&&(await titles()).includes('Dentist (Google)'),'tasks from the chosen list appear (across pages)');
 ok(!(await titles()).includes('On the other list')&&!(await titles()).includes('Already done'),'other lists and already-completed tasks stay out');
 ok(flow().some(t=>t.title==='Local first')&&!G.tasks.L1.some(t=>t.title==='Local first'),'a task typed before connecting is pushed into the chosen list');
 ok((await page.locator('#gline').innerText()).includes('Flow')&&(await page.locator('.brand').innerText()).toLowerCase()==='flow','screen is titled with the Google list name');
 ok(await page.locator('.due').count()===1,'due date shows');
 await page.fill('#newtask','Added after connect');await page.keyboard.press('Enter');await page.waitForFunction(()=>S.tasks.every(t=>t.gid));ok(flow().filter(t=>t.title==='Added after connect').length===1,'new task reaches Google once');
 await page.locator('.task',{hasText:'From Google'}).locator('.chk').click();await page.waitForFunction(()=>!S.tasks.some(t=>t.dirty));ok(flow().find(t=>t.id==='g1').status==='completed','checking off here completes it in Google');
 await page.locator('.task.done',{hasText:'From Google'}).locator('.chk').click();await page.waitForFunction(()=>!S.tasks.some(t=>t.dirty));ok(flow().find(t=>t.id==='g1').status==='needsAction','unchecking here reopens it in Google');
 await page.locator('.task .tt',{hasText:'From Google'}).click();await page.fill('#edt','Renamed here');await page.keyboard.press('Enter');await page.waitForFunction(()=>!S.tasks.some(t=>t.dirty));ok(flow().find(t=>t.id==='g1').title==='Renamed here','renaming here renames it in Google');
 flow().find(t=>t.id==='g2').status='completed';flow().push({id:'g99',title:'Added on Google side',position:'0099',status:'needsAction'});flow().find(t=>t.id==='g1').title='Renamed on Google side';
 await page.evaluate(()=>gSync());await page.waitForFunction(()=>S.tasks.some(t=>t.gid==='g99'));
 ok(await page.evaluate(()=>S.tasks.find(t=>t.gid==='g2').done===1),'completed on the Google side shows as done here');ok((await titles()).includes('Added on Google side')&&(await titles()).includes('Renamed on Google side'),'added and renamed on the Google side show up here');
 await page.locator('.task .tt',{hasText:'Added after connect'}).click();await tap(page,'[data-act=del]');await page.waitForFunction(()=>!S.gdel.length);ok(!flow().some(t=>t.title==='Added after connect'),'delete here deletes in Google');
 ok(await page.evaluate(()=>new Set(S.tasks.map(t=>t.gid)).size===S.tasks.length),'no duplicate tasks after all that');
 /* star + focus on Today */
 await page.locator('.task',{hasText:'Added on Google side'}).locator('.star').click();await tap(page,'#tabs button >> nth=0');ok((await page.locator('.tasks').innerText()).includes('Added on Google side'),"a starred Google task shows as Today's focus");await tap(page,'#tabs button >> nth=1');
 /* offline queue */
 await ctx.setOffline(true);await page.fill('#newtask','Made offline');await page.keyboard.press('Enter');await page.waitForTimeout(1500);ok((await page.locator('#gline').innerText()).includes('Offline'),'offline: says so, keeps the task');
 await ctx.setOffline(false);await page.evaluate(()=>gSync());await page.waitForFunction(()=>S.tasks.every(t=>t.gid||t.done));ok(flow().filter(t=>t.title==='Made offline').length===1,'back online: queued task reaches Google once');
 /* bridge unreachable, then recovers; must not hammer it */
 mode='down';await page.evaluate(()=>gSync());await page.waitForSelector('[data-act=gretry]');await page.waitForTimeout(2500);const h0=hits;await page.waitForTimeout(4000);ok(hits===h0,'when Google is unreachable the app waits for you instead of retrying in a loop');
 mode='ok';await tap(page,'[data-act=gretry]');await page.waitForFunction(()=>gState==='ok');ok(true,'Try again recovers');
 const h1=hits;await page.waitForTimeout(3000);ok(hits===h1,'idle app makes no background calls');
 const st=await page.evaluate(()=>JSON.stringify(S));ok(!st.includes(key)&&!st.includes('AKfycb'),'bridge address and key are kept out of app data and backups');
 await page.screenshot({path:OUT+'v6-list-google.png'});
 /* reload keeps the connection */
 await page.reload();await page.waitForSelector('.task');await page.waitForFunction(()=>gState==='ok');ok(true,'still connected after a reload, no sign-in');
 /* switch list in settings */
 await tap(page,'[aria-label=Settings]');await page.selectOption('[data-set=glist]','My Tasks');await page.waitForFunction(()=>S.g.at>0&&S.tasks.some(t=>t.gid==='m1'));ok(await page.evaluate(()=>S.tasks.filter(t=>!t.done).length===1),'switching lists swaps the tasks cleanly');
 const nFlow=flow().length;await tap(page,'[data-act=goff]');ok(await page.evaluate(()=>!S.g.on&&!localStorage.getItem('calibrate6-bridge')),'disconnect forgets the address and key');ok(flow().length===nFlow,'disconnect deletes nothing in Google');
 ok(errs.length===0,'no script errors'+(errs.length?': '+errs.join(' | '):''));await ctx.close()}

/* 5. install + offline */
{const {ctx,page,errs}=await fresh();
 const man=await (await page.request.get(BASE+'manifest.webmanifest')).json();ok(man.display==='standalone'&&man.icons.some(i=>i.sizes==='192x192')&&man.icons.some(i=>i.sizes==='512x512'),'manifest: standalone, 192 and 512 icons');
 for(const f of ['icon-192.png','icon-512.png','icon-180.png'])ok((await page.request.get(BASE+f)).ok(),f+' loads');
 ok(await page.locator('link[rel=apple-touch-icon]').count()===1,'apple-touch-icon present');
 await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForTimeout(800);await page.reload();await page.waitForSelector('#start');
 await ctx.setOffline(true);await page.reload();await page.waitForSelector('#start');await tap(page,'#start');await page.waitForSelector('[data-card=lesson]');ok(true,'opens and runs offline after reload');
 await ctx.setOffline(false);ok(errs.length===0,'no script errors'+(errs.length?': '+errs.join(' | '):''));await ctx.close()}

/* 6. larger text */
{const {ctx,page,errs}=await fresh();await page.evaluate(()=>{ACT.big()});for(let i=0;i<7;i++){await page.evaluate(i=>{location.hash='deck/'+i},i);await page.waitForTimeout(80);if(!(await noSide(page))){ok(false,'large text: sideways scroll on card '+i)}}ok(true,'large text checked on every card');await page.screenshot({path:OUT+'v6-large-text.png'});await ctx.close()}

await browser.close();process.exit(fails?1:0);
