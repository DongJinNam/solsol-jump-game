const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function game(){
 const elements=new Map();
 const ctx=new Proxy({}, {get:(_,k)=>k==='measureText'?()=>({width:80}):k==='createLinearGradient'?()=>({addColorStop(){}}):()=>{},set:()=>true});
 const element=()=>({style:{},value:'1',children:[],textContent:'',disabled:false,addEventListener(){},focus(){},blur(){},appendChild(x){this.children.push(x)},replaceChildren(){this.children=[]},getContext:()=>ctx});
 const document={getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id)},createElement:element,addEventListener(){},hidden:false};
 const sandbox={document,window:{innerWidth:1000,innerHeight:700,devicePixelRatio:1,addEventListener(){}},Image:class {},requestAnimationFrame:()=>1,cancelAnimationFrame(){},performance:{now:()=>0},console};
 // Load production modules into one isolated VM for deterministic simulation.
 // Imports/exports are removed only in this test harness; production uses native ESM.
 const files=['src/config.js','src/level.js','src/collision.js',
   'src/components/renderer.js','src/components/game-view.js','src/components/quiz-view.js','src/game.js'];
 const code=files.map(file=>fs.readFileSync(file,'utf8')
   .replace(/^import .*;$/gm,'').replace(/^export /gm,'')
   .replace('new URL("../assets/solsol.png", import.meta.url).href','"assets/solsol.png"'))
   .join('\n')+'\nglobalThis.run=(code)=>eval(code);';
 vm.runInNewContext(code,sandbox);return sandbox.run;
}
test('name is required and appears safely in the finish title',()=>{const run=game();run("document.getElementById('nickname').value='   '; submitName()");assert.equal(run('running'),false);assert.notEqual(run("document.getElementById('nameError').textContent"),'');run("document.getElementById('nickname').value=' 슈야 '; submitName(); startGame(); finish(true)");assert.equal(run("document.getElementById('resultTitle').textContent"),'슈야야, 고생했어!! 🎉');run('startGame(); finish(true)');assert.equal(run("document.getElementById('resultTitle').textContent"),'슈야야, 고생했어!! 🎉')});

test('collected star points persist on subsequent frames',()=>{const run=game();run('resetGame(); running=true; obstacles=[]; stars=[{x:player.x+player.w/2+speed,y:player.y+player.h/2,r:13,taken:false}]');run('update()');assert.ok(run('score')>=50);run('update()');assert.ok(run('score')>=50)});
test('wrong answer permits retry; correct answer awards once and resumes',()=>{const run=game();run('startGame(); openQuiz()');assert.equal(run('quizActive'),true);run('answerQuiz(0)');assert.equal(run('quizActive'),true);assert.equal(run('quizPoints'),0);run('answerQuiz(1)');assert.equal(run('quizPoints'),100);run('answerQuiz(1)');assert.equal(run('quizPoints'),100);run('resumeQuiz()');assert.equal(run('quizActive'),false)});
test('collision consumes one heart and grants temporary protection',()=>{const run=game();run('resetGame(); running=true; obstacles=[{x:player.x+speed,y:player.y,w:74,h:56,style:"capsule"}]; stars=[]');run('update()');assert.equal(run('hearts'),2);run('update()');assert.equal(run('hearts'),2);assert.equal(run('running'),true)});
test('all speed settings retain jump height and change travel pace',()=>{const values=[];for(const value of [.7,1,1.3]){const run=game();run(`resetGame(); running=true; obstacles=[]; stars=[]; speedSelect.value='${value}'; jump()`);run('for(let i=0;i<15;i++) update()');values.push([run('camera'),run('player.y')])}assert.ok(values[0][0]<values[1][0]&&values[1][0]<values[2][0]);assert.equal(values[0][1],values[2][1])});

test('a timed jump collects stars at each speed',()=>{for(const value of [.7,1,1.3]){const run=game();run(`resetGame(); running=true; speedSelect.value='${value}'`);run('while(camera<380) update(); jump(); for(let i=0;i<100;i++) update()');assert.ok(run('collected')>0,`No stars collected at speed ${value}`)}});
test('three encounters permit wrong answers, freeze play, and finish successfully',()=>{const run=game();run('resetGame(); running=true; obstacles=[]');for(let i=0;i<3;i++){run('while(!quizActive) update()');const camera=run('camera');run('for(let i=0;i<20;i++)update()');assert.equal(run('camera'),camera);run('answerQuiz((questions[quizIndex].correct+1)%3); answerQuiz(questions[quizIndex].correct); resumeQuiz()')}run('while(running) update()');assert.equal(run('quizIndex'),3);assert.equal(run('quizPoints'),300);assert.equal(run("document.getElementById('resultTitle').textContent"),'모험 성공! 🎉')});
test('restart clears rewards and collected stars but preserves selected speed',()=>{const run=game();run("speedSelect.value='0.7'; starPoints=400; quizPoints=100; hearts=1; resetGame()");assert.equal(run('score'),0);assert.equal(run('hearts'),3);assert.equal(run('stars.some(s=>s.taken)'),false);assert.equal(run('speedSelect.value'),'0.7')});
