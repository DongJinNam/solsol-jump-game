export function obstacleHit(rx,ry,rw,rh,o,screenX) {
    // 모양마다 실제 보이는 부분에 맞춰 충돌 범위를 조금씩 다르게 설정
    let insetX=.18, insetTop=.20, insetBottom=.04;
    if(o.style === "capsule") { insetX=.08; insetTop=.10; insetBottom=.08; }
    else if(o.style === "vial") { insetX=.12; insetTop=.08; insetBottom=.03; }
    else if(o.style === "doubleSpike") { insetX=.10; insetTop=.22; insetBottom=.02; }
    else if(o.style === "crystal") { insetX=.14; insetTop=.16; insetBottom=.03; }
    const hitX = screenX + o.w*insetX;
    const hitW = o.w*(1-insetX*2);
    const hitY = o.y + o.h*insetTop;
    const hitH = o.h*(1-insetTop-insetBottom);
    return rx < hitX+hitW && rx+rw > hitX && ry < hitY+hitH && ry+rh > hitY;
  }

