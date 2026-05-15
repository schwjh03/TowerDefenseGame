import { entities, state } from "./state.js";
import { path } from "./map.js";
import { distance, scalePoint } from "./utils.js";
import { setMessage } from "./ui.js";

export function makeEnemy(data) {
  const start = scalePoint(path[0]);
  entities.enemies.push({
    x: start.x,
    y: start.y,
    hp: data.maxHp,
    maxHp: data.maxHp,
    speed: data.speed,
    reward: data.reward,
    pathIndex: 0,
    progress: 0,
    radius: 13,
  });
}

export function updateEnemies(dt) {
  for (let i = entities.enemies.length - 1; i >= 0; i--) {
    const enemy = entities.enemies[i];
    let remainingStep = enemy.speed * dt;

    // Consume the whole frame's movement, even if the enemy crosses several path corners.
    while (remainingStep > 0 && enemy.pathIndex < path.length - 1) {
      const target = scalePoint(path[enemy.pathIndex + 1]);
      const dist = distance(enemy, target);

      if (dist <= remainingStep) {
        enemy.x = target.x;
        enemy.y = target.y;
        enemy.pathIndex += 1;
        remainingStep -= dist;
      } else {
        enemy.x += (target.x - enemy.x) / dist * remainingStep;
        enemy.y += (target.y - enemy.y) / dist * remainingStep;
        remainingStep = 0;
      }
    }

    if (enemy.pathIndex >= path.length - 1) {
      entities.enemies.splice(i, 1);
      state.lives -= 1;
      setMessage("An enemy reached the Erdtower gate.");
      continue;
    }

    const segmentStart = scalePoint(path[enemy.pathIndex]);
    const segmentEnd = scalePoint(path[enemy.pathIndex + 1]);
    const segmentLength = distance(segmentStart, segmentEnd);
    const distanceFromStart = distance(segmentStart, enemy);
    enemy.progress = enemy.pathIndex + Math.min(distanceFromStart / segmentLength, 1);
  }
}

export function damageEnemy(enemy, amount) {
  enemy.hp -= amount;
  if (enemy.hp <= 0 && entities.enemies.includes(enemy)) {
    entities.enemies.splice(entities.enemies.indexOf(enemy), 1);
    state.gold += enemy.reward;
    entities.particles.push({ x: enemy.x, y: enemy.y, r: 8, life: 0.32, color: "rgba(215, 175, 95, 0.55)" });
  }
}
