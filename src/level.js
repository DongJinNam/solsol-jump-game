import { obstacleNames, obstaclePositions, obstacleStyles } from "./config.js";

export function createLevel(ground) {
    const obstacles = obstaclePositions.map((x,i) => {
      const style = obstacleStyles[i % obstacleStyles.length];
      const size = style === "capsule" ? {w:54,h:32} :
                   style === "vial" ? {w:40,h:49} :
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
    const stars = obstaclePositions.flatMap((x)=>[
      {x:x+12,y:ground-112,r:15,taken:false},
      {x:x+110,y:ground-82,r:15,taken:false},
      {x:x+195,y:ground-40,r:15,taken:false}
    ]);
    return { obstacles, stars };
}
