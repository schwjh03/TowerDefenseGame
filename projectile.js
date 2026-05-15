import { entities } from "./state.js";
import { distance } from "./utils.js";
import { damageEnemy } from "./enemy.js";

export function updateProjectiles(dt) {
  for (let i = entities.projectiles.length - 1; i >= 0; i--) {
    const shot = entities.projectiles[i];
    if (!entities.enemies.includes(shot.target)) {
      entities.projectiles.splice(i, 1);
      continue;
    }

    const dist = distance(shot, shot.target);
    const step = shot.speed * dt;
    if (dist <= step) {
      damageEnemy(shot.target, shot.damage);
      if (shot.splash) {
        for (const enemy of entities.enemies) {
          if (enemy !== shot.target && distance(shot.target, enemy) <= shot.splash) {
            damageEnemy(enemy, Math.floor(shot.damage * 0.55));
          }
        }
        entities.particles.push({ x: shot.target.x, y: shot.target.y, r: 12, life: 0.35, color: "rgba(240, 154, 74, 0.4)" });
      }
      entities.projectiles.splice(i, 1);
    } else {
      shot.x += (shot.target.x - shot.x) / dist * step;
      shot.y += (shot.target.y - shot.y) / dist * step;
    }
  }
}
