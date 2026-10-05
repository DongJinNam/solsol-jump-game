// Stateless canvas rendering. All mutable game data comes from a frame snapshot.
export function drawScene(ctx, solsolImg, state) {
  const { W, H, ground, camera, frame, player, invincible,
    stars, obstacles, particles, popups, paused } = state;
  function roundRect(x,y,w,h,r) {
    const rr=Math.min(r,w/2,h/2);
    ctx.beginPath();
    ctx.moveTo(x+rr,y);
    ctx.arcTo(x+w,y,x+w,y+h,rr);
    ctx.arcTo(x+w,y+h,x,y+h,rr);
    ctx.arcTo(x,y+h,x,y,rr);
    ctx.arcTo(x,y,x+w,y,rr);
    ctx.closePath();
  }

  function drawBackground() {
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,"#102a67");
    g.addColorStop(0.63,"#155f8c");
    g.addColorStop(1,"#1e7e88");
    ctx.fillStyle=g;
    ctx.fillRect(0,0,W,H);

    ctx.globalAlpha=.14;
    ctx.strokeStyle="#bff6ff";
    ctx.lineWidth=1;
    const grid=44;
    const off=-(camera*.22)%grid;
    for(let x=off;x<W;x+=grid) {
      ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,ground);ctx.stroke();
    }
    for(let y=70;y<ground;y+=grid) {
      ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();
    }
    ctx.globalAlpha=1;

    ctx.fillStyle="#0b254f";
    ctx.fillRect(0,ground,W,H-ground);
    ctx.fillStyle="#5ee7f2";
    ctx.fillRect(0,ground, W, 5);
  }

  function drawObstacle(o) {
    const x=o.x-camera;
    if(x<-110 || x>W+110) return;

    ctx.save();
    ctx.translate(x,o.y);
    ctx.lineWidth=2.5; ctx.strokeStyle='#f2f8ff'; ctx.lineJoin='round';
    const colors={capsule:'#ff8fbd',syringe:'#79dfff',vial:'#a6e5bf',bandage:'#ffc58c',vitamin:'#d2acff'};
    ctx.shadowColor=colors[o.style]; ctx.shadowBlur=10;
    ctx.fillStyle=colors[o.style];
    if(o.style==='capsule') {
      roundRect(0,2,o.w,o.h-4,16);ctx.fill();ctx.stroke();
      ctx.shadowBlur=0;ctx.fillStyle='#fff4fb';roundRect(o.w/2,4,o.w/2-3,o.h-8,12);ctx.fill();
      ctx.strokeStyle='#cf588f';ctx.beginPath();ctx.moveTo(o.w/2,5);ctx.lineTo(o.w/2,o.h-5);ctx.stroke();
    } else if(o.style==='syringe') {
      roundRect(10,10,o.w-20,o.h-19,4);ctx.fill();ctx.stroke();
      ctx.fillStyle='#c6f5ff';ctx.fillRect(15,2,o.w-30,8);ctx.fillRect(8,0,o.w-16,4);
      ctx.strokeStyle='#fff';ctx.beginPath();ctx.moveTo(o.w/2,o.h-9);ctx.lineTo(o.w/2,o.h);ctx.stroke();
      ctx.strokeStyle='#288eb2';for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(12,16+i*6);ctx.lineTo(20,16+i*6);ctx.stroke();}
    } else if(o.style==='vial') {
      roundRect(3,10,o.w-6,o.h-11,9);ctx.fill();ctx.stroke();
      ctx.fillStyle='#78bdc2';roundRect(9,0,o.w-18,12,3);ctx.fill();
      ctx.fillStyle='#fff';roundRect(9,23,o.w-18,16,4);ctx.fill();
      ctx.fillStyle='#42a785';ctx.fillRect(o.w/2-2,25,4,12);ctx.fillRect(o.w/2-6,29,12,4);
    } else if(o.style==='bandage') {
      roundRect(0,5,o.w,o.h-10,12);ctx.fill();ctx.stroke();
      ctx.fillStyle='#e59a61';roundRect(o.w*.3,9,o.w*.4,o.h-18,4);ctx.fill();
      ctx.fillStyle='#fff2de';for(const xx of [7,o.w-7])for(const yy of [15,23,31]){ctx.beginPath();ctx.arc(xx,yy,1.5,0,Math.PI*2);ctx.fill();}
    } else {
      ctx.beginPath();ctx.ellipse(o.w/2,o.h/2,o.w/2-2,o.h/2-2,0,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.strokeStyle='#8b63bc';ctx.beginPath();ctx.moveTo(12,12);ctx.lineTo(o.w-12,o.h-12);ctx.stroke();
    }
    ctx.shadowBlur=0;ctx.fillStyle='#ffffff80';roundRect(7,12,4,10,2);ctx.fill();ctx.restore();

    // 장애물 이름
    const label=o.label;
    if (!label) return;
    let fontSize = label.length > 6 ? 12 : 13;
    ctx.font=`800 ${fontSize}px Arial, "Apple SD Gothic Neo", sans-serif`;
    const tw = ctx.measureText(label).width;
    const padX=10;
    const bw=Math.min(148,tw+padX*2);
    const bx=x+o.w/2-bw/2;
    const by=o.y-34;
    ctx.fillStyle="rgba(255,255,255,.95)";
    ctx.strokeStyle="#8be9f5";
    ctx.lineWidth=2;
    roundRect(bx,by,bw,25,10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle="#17466c";
    ctx.textAlign="center";
    ctx.textBaseline="middle";
    ctx.fillText(label,x+o.w/2,by+12.5);
  }

  function drawStar(s) {
    if(s.taken) return;
    const x=s.x-camera;
    if(x<-30 || x>W+30) return;
    ctx.save();
    ctx.translate(x,s.y);
    ctx.rotate(frame*.035);
    ctx.fillStyle="#ffe05f";
    ctx.strokeStyle="#fff4aa";
    ctx.lineWidth=2;
    ctx.beginPath();
    for(let i=0;i<10;i++) {
      const a=-Math.PI/2+i*Math.PI/5;
      const r=i%2===0 ? 15 : 6.5;
      const px=Math.cos(a)*r, py=Math.sin(a)*r;
      if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
    }
    ctx.closePath();ctx.fill();ctx.stroke();
    ctx.restore();
  }

  function drawPlayer() {
    ctx.save();
    if(invincible && Math.floor(frame/6)%2===0) ctx.globalAlpha=.35;
    ctx.translate(player.x+player.w/2,player.y+player.h/2);
    ctx.rotate(player.rotation);
    const bob = Math.sin(frame*.12)*1.5;
    if(solsolImg.complete && solsolImg.naturalWidth) {
      ctx.drawImage(solsolImg,-player.w/2,-player.h/2+bob,player.w,player.h);
    } else {
      ctx.fillStyle="#aeeffc";
      ctx.beginPath();ctx.arc(0,0,25,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }

  function drawParticles() {
    for(const p of particles) {
      ctx.globalAlpha=Math.max(0,p.life/34);
      ctx.fillStyle=p.color;
      ctx.beginPath();
      ctx.arc(p.x,p.y,3.5,0,Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha=1;
  }

  function drawCheer() {
    const text = camera < 1100 ? "천천히 시작해보자!" :
                 camera < 2600 ? "잘하고 있어!" :
                 camera < 4000 ? "조금만 더!" : "끝이 보여!";
    ctx.font='700 15px Arial, "Apple SD Gothic Neo", sans-serif';
    const tw=ctx.measureText(text).width;
    const x=Math.max(12,W-tw-42);
    const y=55;
    ctx.fillStyle="rgba(255,255,255,.9)";
    roundRect(x,y,tw+26,34,14);
    ctx.fill();
    ctx.fillStyle="#176c91";
    ctx.textAlign="center";
    ctx.textBaseline="middle";
    ctx.fillText(text,x+(tw+26)/2,y+17);
  }

  function draw() {
    drawBackground();
    stars.forEach(drawStar);
    obstacles.forEach(drawObstacle);
    drawPlayer();
    drawParticles();
    drawCheer();
    ctx.save();ctx.textAlign='center';ctx.font='bold 18px Arial';
    popups.forEach(p=>{ctx.globalAlpha=Math.min(1,p.life/20);ctx.fillStyle='#fff1a3';ctx.fillText(p.text,p.x,p.y)});
    ctx.restore();
    if(paused) {ctx.fillStyle='#08173eb0';ctx.fillRect(0,0,W,H);ctx.fillStyle='white';ctx.font='bold 26px Arial';ctx.textAlign='center';ctx.fillText('잠시 쉬는 중',W/2,H/2);}

  }

  draw();
}
