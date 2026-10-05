import { LEVEL_END, questions } from './config.js';
import { createLevel } from './level.js';
import { obstacleHit } from './collision.js';
import { drawScene } from './components/renderer.js';
import { createGameView } from './components/game-view.js';
import { createQuizView } from './components/quiz-view.js';

// Coordinates state transitions, input, physics, rewards, and the animation loop.
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const startPanel = document.getElementById("start");
const resultPanel = document.getElementById("result");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
let nickname = '';

function submitName(event) {
  event?.preventDefault();
  const input = document.getElementById('nickname');
  const value = input.value.trim().slice(0, 20);
  if (!value) {
    document.getElementById('nameError').textContent = '이름(별명)을 입력해주세요.';
    input.focus();
    return;
  }
  nickname = value;
  document.getElementById('nameError').textContent = '';
  document.getElementById('namePanel').style.display = 'none';
  startPanel.style.display = 'block';
  startBtn.focus();
}
document.getElementById('namePanel').addEventListener('submit', submitName);

const solsolImg = new Image();
solsolImg.src = new URL("../assets/solsol.png", import.meta.url).href;

const speedSelect = document.getElementById('speedSelect');
const quizPanel = document.getElementById('quiz');
const quizChoices = document.getElementById('quizChoices');
const quizContinue = document.getElementById('quizContinue');
const pauseBtn = document.getElementById('pauseBtn');
const quizView = createQuizView(document);
const gameView = createGameView(document);
let hearts=3, invincible=0, quizPenalty=0, collected=0, combo=0;
let wrongAnswers = new Set();
let quizIndex=0, quizActive=false, quizSolved=false, paused=false, popups=[];
let lastTime=0, accumulator=0;
let W=0, H=0, ground=0;
let running=false, animationId=null, camera=0, speed=2.8, score=0, frame=0;

const player = {
  x: 120,
  y: 0,
  w: 74,
  h: 56,
  vy: 0,
  jumpCount: 0,
  rotation: 0
};

let obstacles = [];
let stars = [];
let particles = [];

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = Math.floor(W*dpr);
  canvas.height = Math.floor(H*dpr);
  canvas.style.width = W+"px";
  canvas.style.height = H+"px";
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ground = H - Math.max(92, H*0.16);
  player.x = Math.min(120, W*.2);
  if (!running) player.y = ground-player.h;
}

function buildLevel() {
  ({ obstacles, stars } = createLevel(ground));
}

function resetGame() {
  hearts=3; invincible=0; quizPenalty=0; collected=0; combo=0;
  wrongAnswers.clear();
  quizIndex=0; quizActive=false; quizSolved=false; paused=false; popups=[];
  quizPanel.style.display='none'; pauseBtn.textContent='일시정지';
  lastTime=0; accumulator=0;
  camera=0;
  speed=2.8;
  score=0;
  frame=0;
  player.y=ground-player.h;
  player.vy=0;
  player.jumpCount=0;
  player.rotation=0;
  particles=[];
  buildLevel();
  updateHud();
}

function startGame() {
  startPanel.style.display="none";
  resultPanel.style.display="none";
  resetGame();
  running=true;
  startBtn.blur(); restartBtn.blur();
  cancelAnimationFrame(animationId);
  loop();
}

function jump() {
  if(!running || quizActive || paused) return;
  if(player.jumpCount < 2) {
    player.vy = player.jumpCount === 0 ? -12.2 : -10.8;
    player.jumpCount++;
    burst(player.x + player.w/2, player.y + player.h, player.jumpCount===1 ? "#d8f8ff" : "#ffe58a");
  }
}

function update() {
  if (!running || paused || quizActive) return;
  frame++;
  speed = (3.2 + Math.min(1.2,camera/3900)) * Number(speedSelect.value);
  camera += speed;
  invincible=Math.max(0,invincible-1);
  if (quizIndex<questions.length && camera>=LEVEL_END*(quizIndex+1)/4) {
    openQuiz(); return;
  }

  player.vy += 0.62;
  player.y += player.vy;

  if (player.y >= ground-player.h) {
    player.y = ground-player.h;
    player.vy = 0;
    player.jumpCount = 0;
    player.rotation *= 0.72;
  } else {
    player.rotation += 0.035;
  }

  for (const o of obstacles) {
    const ox = o.x-camera;
    if (!invincible && obstacleHit(
      player.x+12, player.y+10, player.w-24, player.h-14,
      o, ox
    )) {
      hearts--; invincible=110; combo=0;
      burst(player.x+player.w/2,player.y+player.h/2,'#ff9cbe');
      popups.push({x:player.x,y:player.y-20,text:'앗! 하트 -1',life:65});
      if(hearts<=0) { finish(false); return; }
    }
  }

  for (const s of stars) {
    if (s.taken || s.missed) continue;
    const sx = s.x-camera;
    if(sx < player.x-s.r-8) { s.missed=true; combo=0; continue; }
    const cx = Math.max(player.x,Math.min(sx,player.x+player.w));
    const cy = Math.max(player.y,Math.min(s.y,player.y+player.h));
    if (Math.hypot(cx-sx,cy-s.y) < s.r+8) {
      s.taken=true;
      combo++; collected++;
      popups.push({x:sx,y:s.y-22,text:'별 획득! ⭐',life:60});
      burst(sx,s.y,"#ffe66b");
    }
  }

  particles.forEach(p=>{
    p.x+=p.vx; p.y+=p.vy; p.vy+=.12; p.life--;
  });
  particles = particles.filter(p=>p.life>0);

  popups.forEach(p=>{p.y-=.65;p.life--});
  popups=popups.filter(p=>p.life>0);
  if (camera >= LEVEL_END) {
    finish(true);
    return;
  }
  updateHud();
}

function updateHud() {
  const missed = stars.filter(s=>!s.taken && s.missed).length;
  score=Math.round(Math.max(0,100-(stars.length ? missed*100/stars.length : 0)-quizPenalty)*10)/10;
  gameView.update({ hearts, collected, combo, camera, levelEnd: LEVEL_END, score });
}

function finish(success) {
  stars.forEach(s=>{if(!s.taken) s.missed=true;});
  updateHud();
  running=false;
  cancelAnimationFrame(animationId);
  const missed = stars.filter(s=>!s.taken).length;
  const starPenalty = stars.length ? missed*100/stars.length : 0;
  gameView.finish(success, { score, starPenalty, quizPenalty, collected, missed, quizIndex, nickname });
}

function openQuiz() {
  quizActive=true; quizSolved=false;
  wrongAnswers.clear();
  quizView.show(questions[quizIndex], quizIndex, answerQuiz);
  updateHud();
}
function answerQuiz(index) {
  if(!quizActive || quizSolved) return;
  const question=questions[quizIndex];
  if (!Number.isInteger(index) || index<0 || index>=question.a.length || wrongAnswers.has(index)) return;
  if(index!==question.correct) {
    wrongAnswers.add(index);
    quizPenalty+=5;
    updateHud();
    quizView.showHint(question.hint, index);
    return;
  }
  quizSolved=true; updateHud();
  quizView.showSuccess(question.hint);
}
function resumeQuiz() {
  if(!quizSolved) return;
  quizView.hide();
  quizActive=false; quizSolved=false; quizIndex++;
  invincible=Math.max(invincible,75);
  lastTime=0; accumulator=0;
}

function burst(x,y,color) {
  for(let i=0;i<10;i++) {
    particles.push({
      x,y,
      vx:(Math.random()-.5)*4,
      vy:-Math.random()*3,
      life:22+Math.random()*12,
      color
    });
  }
}

function draw() {
  drawScene(ctx, solsolImg, { W, H, ground, camera, frame, player,
    invincible, stars, obstacles, particles, popups, paused });
}

function loop(now=performance.now()) {
  if(!running) return;
  if(!lastTime) lastTime=now;
  accumulator+=Math.min(50,now-lastTime); lastTime=now;
  while(accumulator>=1000/60) { update();accumulator-=1000/60; }
  draw();
  if(running) animationId=requestAnimationFrame(loop);
}

function handleJump(e) {
  if(e) e.preventDefault();
  jump();
}

window.addEventListener("resize",()=>{
  const oldGround=ground; resize(); const offset=ground-oldGround;
  if(running) player.y+=offset;
  obstacles.forEach(o=>o.y+=offset); stars.forEach(s=>s.y+=offset); draw();
});
quizContinue.addEventListener('click',resumeQuiz);
speedSelect.addEventListener('change',()=>speedSelect.blur());
pauseBtn.addEventListener('click',()=>{if(!running || quizActive)return;paused=!paused;pauseBtn.textContent=paused?'계속하기':'일시정지';lastTime=0;accumulator=0;});
document.addEventListener('visibilitychange',()=>{if(document.hidden && running && !quizActive){paused=true;pauseBtn.textContent='계속하기';}});
quizPanel.addEventListener('keydown',e=>{
  if(e.key!=='Tab')return;
  const items=Array.from(quizChoices.children).filter(b=>!b.disabled);
  if(quizSolved)items.push(quizContinue);
  const first=items[0],last=items[items.length-1];
  if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
});
canvas.addEventListener("pointerdown",handleJump,{passive:false});
window.addEventListener("keydown",(e)=>{
  if(e.repeat || ['SELECT','BUTTON','INPUT'].includes(e.target.tagName)) return;
  if(e.code==="Space" || e.code==="ArrowUp") {
    e.preventDefault();
    jump();
  }
});

startBtn.addEventListener("click",startGame);
restartBtn.addEventListener("click",startGame);

resize();
buildLevel();
draw();
