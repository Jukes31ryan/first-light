/* Audits every shipped crossword straight out of index.html: the grids, the
   clue coverage, and — the reason this exists — whether a clue only makes sense
   to someone using this particular app. A clue that says "steps in the morning
   sequence" was true once, stopped being true when the sequence became modular,
   and was never true for anyone who turned that module off. */
import { readFileSync } from 'node:fs';

const src=readFileSync(new URL('../index.html', import.meta.url),'utf8');
let ok=true;
const chk=(n,c,x='')=>{if(!c)ok=false;console.log((c?'  ok  ':'FAIL  ')+n+(x?': '+x:''))};

/* Pull each literal out of the file and evaluate just that array. The weekday
   and weekend shelves are separate arrays: an earlier version of this audit
   read only the first one and passed cleanly while fifteen puzzles went
   unchecked, so the names are listed explicitly and the total is asserted. */
const SHELVES=['PUZZLES','PUZZLES7'];
const grab=name=>{
  const start=src.indexOf('const '+name+'=[');
  const end=src.indexOf('\n];',start);
  if(start<0||end<0){console.log('FAIL  could not find '+name+' in index.html');process.exit(1)}
  return new Function('return '+src.slice(start+('const '+name+'=').length,end+2))();
};
const PUZZLES=[].concat(...SHELVES.map(grab));

console.log('— the shelf —');
const weekday=PUZZLES.filter(p=>p.r.length===5).length;
const weekend=PUZZLES.filter(p=>p.r.length===7).length;
chk('every shelf is read',PUZZLES.length===53,
  PUZZLES.length+' puzzles across '+SHELVES.join(' + '));
chk('every grid is 5x5 or 7x7',weekday+weekend===PUZZLES.length,
  weekday+' weekday, '+weekend+' weekend, '+(PUZZLES.length-weekday-weekend)+' other');
chk('both shelves are stocked',weekday>0&&weekend>0,weekday+'/'+weekend);

/* entries the grid actually contains, across then down, runs of 3 or more */
function entriesOf(rows){
  const N=rows.length,g=rows.map(r=>r.split('')),out=[];
  const scan=(get)=>{
    for(let a=0;a<N;a++){
      let run='';
      for(let b=0;b<N;b++){
        const ch=get(a,b);
        if(ch==='#'){if(run.length>=3)out.push(run);run=''}else run+=ch;
      }
      if(run.length>=3)out.push(run);
    }
  };
  scan((r,c)=>g[r][c]);
  scan((c,r)=>g[r][c]);
  return out;
}

console.log('\n— grids and clues —');
let badRow=0,uncl=[],orphan=[],selfClue=[],dupeAns=0;
PUZZLES.forEach((p,i)=>{
  const N=p.r.length;
  if(p.r.some(r=>r.length!==N))badRow++;
  const ents=entriesOf(p.r);
  if(new Set(ents).size!==ents.length)dupeAns++;
  ents.forEach(e=>{if(!p.c[e])uncl.push('#'+i+' '+e)});
  Object.keys(p.c).forEach(k=>{if(ents.indexOf(k)<0)orphan.push('#'+i+' '+k)});
  Object.keys(p.c).forEach(k=>{
    if(new RegExp('\\b'+k+'\\b','i').test(p.c[k]))selfClue.push('#'+i+' '+k+': '+p.c[k]);
  });
});
chk('every grid is square',badRow===0,badRow+' ragged');
chk('no puzzle repeats an answer',dupeAns===0,dupeAns+' with duplicates');
chk('every entry in every grid has a clue',uncl.length===0,uncl.slice(0,6).join(' | '));
chk('no clue is written for an entry that is not there',orphan.length===0,orphan.slice(0,6).join(' | '));
chk('no clue gives away its own answer',selfClue.length===0,selfClue.slice(0,3).join(' | '));

/* ── the guard ──────────────────────────────────────────────────────────
   A clue may not lean on this app: not on a module's name, not on the
   length of a sequence the user now chooses, not on a specific fable. The
   puzzle has to work for someone who turned that module off, or who has
   never opened the app before today. */
console.log('\n— clues that assume this app —');
const BANNED=[
  [/\bin the fable\b/i,       'leans on a specific story'],
  [/\bthe fable\b/i,          'leans on a specific story'],
  [/\bmorning sequence\b/i,   'names the sequence'],
  [/\bsteps? in the\b.*\bsequence\b/i,'counts a sequence the user now chooses'],
  [/\bthe (Laugh|Spark|Story|Mini|Stretch|Software|Breathe)\b/,'names a module'],
  [/\bthis app\b.*\bmodule\b/i,'names a module'],
  [/\bCalibrate\b/,           'names the app'],
  [/\bFirst Light\b/,         'names the app']
];
const offenders=[];
PUZZLES.forEach((p,i)=>Object.keys(p.c).forEach(k=>{
  BANNED.forEach(([re,why])=>{
    if(re.test(p.c[k]))offenders.push('#'+i+' '+k+' — '+why+' — "'+p.c[k]+'"');
  });
}));
chk('no clue depends on the app it is shipped in',offenders.length===0,
  '\n        '+offenders.join('\n        '));

/* the four that prompted this, by name, so a revert cannot pass quietly */
console.log('\n— the four that started it —');
const clueFor=w=>{for(const p of PUZZLES)if(p.c[w])return p.c[w];return null};
[['SEVEN',/sequence/i],['HUMOR',/Laugh/],['PAIN',/fable/i],['TREE',/fable/i]].forEach(([w,re])=>{
  const c=clueFor(w);
  chk(w+' stands on its own',c&&!re.test(c),c||'(not in any puzzle)');
});

/* "Like this app, ideally" for DAILY and CODE's second reading are about the
   *habit*, not a module, and still parse for a stranger. They stay. */

console.log('\n— clue craft —');
const all=[];PUZZLES.forEach(p=>Object.keys(p.c).forEach(k=>all.push([k,p.c[k]])));
chk('no empty clues',all.every(([,c])=>c&&c.trim().length>2));
const long=all.filter(([,c])=>c.length>72);
chk('none runs past the line',long.length===0,long.slice(0,3).map(x=>x[0]).join(', '));
console.log('        '+all.length+' clues across '+PUZZLES.length+' puzzles');

process.exit(ok?0:1);
