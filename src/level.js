import { obstacleNames, obstaclePositions, obstacleStyles } from "./config.js";

export function createLevel(ground) {
    const vialHeight = 49;
    const stackedHeight = vialHeight * 1.5;
    const tierHeight = stackedHeight / 2;
    const obstacles = obstaclePositions.flatMap((x,i) => {
      if (i % 4 === 2) {
        return [
          {x,y:ground-tierHeight,w:54,h:tierHeight,style:'vial',label:'',tier:1},
          {x,y:ground-stackedHeight,w:54,h:tierHeight,style:'vial',label:'2단 약병 · 이중점프!',tier:2}
        ];
      }
      const style = obstacleStyles[i % obstacleStyles.length];
      const size = style === "capsule" ? {w:54,h:32} :
                   style === "vial" ? {w:40,h:vialHeight} :
                   style === "doubleSpike" ? {w:50,h:40} :
                   style === "crystal" ? {w:44,h:44} : {w:40,h:42};
      return {
        x,
        y: ground-size.h,
        w: size.w,
        h: size.h,
        style,
        label: obstacleNames[i % obstacleNames.length]
      };
    });

    // Reachable arcs above obstacles, plus lower stars between them.
    const stars = obstaclePositions.flatMap((x,i)=>[
      {x:x+12,y:ground-(i%4===2?stackedHeight+51:112),r:15,taken:false},
      {x:x+110,y:ground-82,r:15,taken:false},
      {x:x+195,y:ground-40,r:15,taken:false}
    ]);
    return { obstacles, stars };
}
