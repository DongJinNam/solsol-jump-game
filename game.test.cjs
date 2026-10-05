const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function game(random=()=>0.999){
 const elements=new Map();
 const ctx=new Proxy({}, {get:(_,k)=>k==='measureText'?()=>({width:80}):k==='createLinearGradient'?()=>({addColorStop(){}}):()=>{},set:()=>true});
 const element=()=>({style:{},value:'1',children:[],textContent:'',disabled:false,addEventListener(){},focus(){},blur(){},appendChild(x){this.children.push(x)},replaceChildren(){this.children=[]},getContext:()=>ctx});
 const document={getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id)},createElement:element,addEventListener(){},hidden:false};
 const sandbox={Math:Object.assign(Object.create(Math),{random}),document,window:{innerWidth:1000,innerHeight:700,devicePixelRatio:1,addEventListener(){}},Image:class {},requestAnimationFrame:()=>1,cancelAnimationFrame(){},performance:{now:()=>0},console};
 // Load production modules into one isolated VM for deterministic simulation.
 // Imports/exports are removed only in this test harness; production uses native ESM.
 const files=['src/config.js','src/quiz-order.js','src/level.js','src/collision.js',
   'src/components/renderer.js','src/components/game-view.js','src/components/quiz-view.js','src/game.js'];
 const code=files.map(file=>fs.readFileSync(file,'utf8')
   .replace(/^import .*;$/gm,'').replace(/^export /gm,'')
   .replace('new URL("../assets/solsol.png", import.meta.url).href','"assets/solsol.png"'))
   .join('\n')+'\nglobalThis.run=(code)=>eval(code);';
 vm.runInNewContext(code,sandbox);return sandbox.run;
}
test('name is required and appears safely in the finish title',()=>{const run=game();run("document.getElementById('nickname').value='   '; submitName()");assert.equal(run('running'),false);assert.notEqual(run("document.getElementById('nameError').textContent"),'');run("document.getElementById('nickname').value=' 슈야 '; submitName(); startGame(); finish(true)");assert.equal(run("document.getElementById('resultTitle').textContent"),'슈야, 고생했어!! 🎉');run('startGame(); finish(true)');assert.equal(run("document.getElementById('resultTitle').textContent"),'슈야, 고생했어!! 🎉')});

test('collecting a star preserves the full score on subsequent frames',()=>{const run=game();run('resetGame(); running=true; obstacles=[]; stars=[{x:player.x+player.w/2+speed,y:player.y+player.h/2,r:13,taken:false}]');run('update()');assert.equal(run('score'),100);run('update()');assert.equal(run('score'),100)});
test('wrong answer deducts once; correct answer resumes without bonus',()=>{const run=game();run('startGame(); openQuiz()');assert.equal(run('quizActive'),true);run('answerQuiz(0)');assert.equal(run('quizActive'),true);assert.equal(run('quizPenalty'),5);run('answerQuiz(2)');assert.equal(run('quizPenalty'),5);run('answerQuiz(2)');assert.equal(run('quizPenalty'),5);run('resumeQuiz()');assert.equal(run('quizActive'),false)});
test('collision consumes one heart and grants temporary protection',()=>{const run=game();run('resetGame(); running=true; obstacles=[{x:player.x+speed,y:player.y,w:74,h:56,style:"capsule"}]; stars=[]');run('update()');assert.equal(run('hearts'),2);run('update()');assert.equal(run('hearts'),2);assert.equal(run('running'),true)});
test('stacked obstacles have collidable upper tiers and can be cleared with a double jump',()=>{const run=game();assert.ok(run('obstacles.some(o=>o.tier===2)'));assert.equal(run('(()=>{const o=obstacles.find(o=>o.tier===2);return obstacleHit(o.x+10,o.y+10,20,20,o,o.x)})()'),true);for(const value of [1,1.3]){const r=game();r(`resetGame(); running=true; speedSelect.value='${value}'; const stack=obstacles.filter(o=>o.x===obstacles.find(o=>o.tier===2).x); obstacles=stack; camera=stack[0].x-player.x-(Number(speedSelect.value)===1?120:125); jump(); for(let i=0;i<(Number(speedSelect.value)===1?14:12);i++)update(); jump(); for(let i=0;i<55;i++)update()`);assert.equal(r('hearts'),3)}});
test('all speed settings retain jump height and change travel pace',()=>{const values=[];for(const value of [1,1.3]){const run=game();run(`resetGame(); running=true; obstacles=[]; stars=[]; speedSelect.value='${value}'; jump()`);run('for(let i=0;i<15;i++) update()');values.push([run('camera'),run('player.y')])}assert.ok(values[0][0]<values[1][0]);assert.equal(values[0][1],values[1][1])});

test('a timed jump collects stars at each speed',()=>{for(const value of [1,1.3]){const run=game();run(`resetGame(); running=true; speedSelect.value='${value}'`);run('while(camera<380) update(); jump(); for(let i=0;i<100;i++) update()');assert.ok(run('collected')>0,`No stars collected at speed ${value}`)}});
test('three encounters permit wrong answers, freeze play, and finish successfully',()=>{const run=game();run('resetGame(); running=true; obstacles=[]');for(let i=0;i<3;i++){run('while(!quizActive) update()');const camera=run('camera');run('for(let i=0;i<20;i++)update()');assert.equal(run('camera'),camera);run('answerQuiz((questions[quizIndex].correct+1)%3); answerQuiz(questions[quizIndex].correct); resumeQuiz()')}run('while(running) update()');assert.equal(run('quizIndex'),3);assert.equal(run('quizPenalty'),15);assert.equal(run("document.getElementById('resultTitle').textContent"),'모험 성공! 🎉')});
test('restart clears penalties and collected stars but preserves selected speed',()=>{const run=game();run("speedSelect.value='1.3'; quizPenalty=15; hearts=1; resetGame()");assert.equal(run('score'),100);assert.equal(run('hearts'),3);assert.equal(run('stars.some(s=>s.taken)'),false);assert.equal(run('speedSelect.value'),'1.3')});

test('each supplied quiz accepts its answer and displays its explanation',()=>{const run=game();run('startGame()');for(const answer of [2,1,0]){run('openQuiz()');run(`answerQuiz(${answer})`);assert.equal(run('quizSolved'),true);assert.ok(run("document.getElementById('quizFeedback').textContent.includes(questions[quizIndex].hint)"));run('resumeQuiz()')}});
test('perfect finish is 100; missed stars and wrong answers deduct proportionally',()=>{const r=game();r('resetGame(); stars.forEach(s=>s.taken=true); collected=42; finish(true)');assert.equal(r('score'),100);r('stars[0].taken=false;collected=41;finish(true)');assert.equal(r('score'),97.6);r('quizPenalty=5;finish(true)');assert.equal(r('score'),92.6);r('stars.forEach(s=>s.taken=false);collected=0;finish(true)');assert.equal(r('score'),0)});
test('missed star reduces live score once; a collected star is never penalized',()=>{const r=game();r('resetGame();running=true;obstacles=[];stars[0].x=-100;update()');assert.equal(r('score'),97.6);r('update()');assert.equal(r('score'),97.6);r('stars[1].taken=true;stars[1].x=-100;update()');assert.equal(r('score'),97.6)});
test('each distinct wrong choice costs five, duplicate clicks and solved answers do not',()=>{const r=game();r('startGame();openQuiz();answerQuiz(0);answerQuiz(0)');assert.equal(r('score'),95);r('answerQuiz(1)');assert.equal(r('score'),90);r('answerQuiz(2);answerQuiz(0)');assert.equal(r('score'),90);r('startGame()');assert.equal(r('score'),100);assert.equal(r('quizPenalty'),0)});

test('shuffling preserves all questions, choices and correct answer content without mutating source',()=>{
 const r=game();
 const before=r('JSON.stringify(questions)');
 const shuffled=JSON.parse(r('JSON.stringify(createQuizOrder(questions,()=>0))'));
 const source=JSON.parse(before);
 assert.equal(r('JSON.stringify(questions)'),before);
 assert.equal(shuffled.length,3);
 assert.notDeepEqual(shuffled.map(q=>q.q),source.map(q=>q.q));
 assert.equal(new Set(shuffled.map(q=>q.q)).size,3);
 for(const question of shuffled){
  const original=source.find(q=>q.q===question.q);
  assert.equal(question.a[question.correct],original.a[original.correct]);
  assert.deepEqual([...question.a].sort(),[...original.a].sort());
  assert.equal(question.hint,original.hint);
  assert.notDeepEqual(question.a,original.a);
 }
});

test('randomized quiz UI judges displayed choices and keeps their order through retry',()=>{
 const r=game(()=>0); r('startGame()');
 for(let i=0;i<3;i++){
  r('openQuiz()');
  const original=JSON.parse(r('JSON.stringify(questions.find(q=>q.q===quizOrder[quizIndex].q))'));
  const choices=JSON.parse(r('JSON.stringify(quizChoices.children.map(b=>b.textContent.slice(2)))'));
  assert.notDeepEqual(choices,original.a);
  const correct=choices.indexOf(original.a[original.correct]);
  r(`answerQuiz(${(correct+1)%3})`);
  assert.equal(r('quizSolved'),false);
  assert.deepEqual(JSON.parse(r('JSON.stringify(quizChoices.children.map(b=>b.textContent.slice(2)))')),choices);
  r(`answerQuiz(${correct})`);
  assert.equal(r('quizSolved'),true);
  assert.ok(r("document.getElementById('quizFeedback').textContent").includes(original.hint));
  r('resumeQuiz()');
 }
 assert.equal(r('quizPenalty'),15);
});

test('restart generates a fresh quiz order and retains the chosen speed',()=>{
 let value=0; const r=game(()=>value);
 r("startGame(); speedSelect.value='1'");
 const firstOrder=r('JSON.stringify(quizOrder)');
 value=0.999; r('startGame()');
 assert.notEqual(r('JSON.stringify(quizOrder)'),firstOrder);
 assert.equal(r('speedSelect.value'),'1');
 assert.equal(r('quizIndex'),0);
 assert.equal(r('quizPenalty'),0);
});
