import { ctx, entities, state } from "./state.js";
import { path } from "./map.js";
import { evolutionImages, knightImage, knightSwingImage } from "./assets.js";
import { sx, sy, scalePoint } from "./utils.js";
import { getMainPath, getPathLevels, getTotalPathLevels, getTowerStats } from "./tower.js";

function drawBackground() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, "#1b1711");
  grad.addColorStop(0.52, "#2b2a22");
  grad.addColorStop(1, "#0a0d0a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "rgba(215, 175, 95, 0.08)";
  for (let i = 0; i < 26; i++) {
    const x = (i * 97) % w;
    const y = (i * 151) % h;
    ctx.beginPath();
    ctx.arc(x, y, 1 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.beginPath();
  ctx.moveTo(0, sy(610));
  ctx.lineTo(sx(260), sy(500));
  ctx.lineTo(sx(520), sy(625));
  ctx.lineTo(sx(820), sy(540));
  ctx.lineTo(sx(1280), sy(620));
  ctx.lineTo(sx(1280), sy(720));
  ctx.lineTo(0, sy(720));
  ctx.closePath();
  ctx.fill();
}

function drawPath() {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(12, 10, 8, 0.72)";
  ctx.lineWidth = Math.max(68, window.innerWidth * 0.052);
  ctx.beginPath();
  path.forEach((p, i) => {
    const point = scalePoint(p);
    if (i === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.stroke();

  ctx.strokeStyle = "rgba(139, 93, 49, 0.82)";
  ctx.lineWidth = Math.max(42, window.innerWidth * 0.034);
  ctx.stroke();

  ctx.strokeStyle = "rgba(230, 198, 120, 0.2)";
  ctx.lineWidth = 4;
  ctx.setLineDash([22, 18]);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawRangeCircle(x, y, range, isValid = true) {
  ctx.fillStyle = isValid ? "rgba(215, 175, 95, 0.065)" : "rgba(156, 61, 51, 0.12)";
  ctx.strokeStyle = isValid ? "rgba(215, 175, 95, 0.3)" : "rgba(225, 87, 70, 0.62)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, range, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawSelectionRing(tower) {
  const stats = getTowerStats(tower);
  ctx.strokeStyle = "rgba(255, 232, 180, 0.85)";
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.arc(tower.x, tower.y, stats.range, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

function getEvolutionImage(tower) {
  const paths = getPathLevels(tower);
  // Milestone sprites are used at the tiers where the character's silhouette changes.
  if (paths.pyre >= 6) return evolutionImages.pyreT6;
  if (paths.pyre >= 3) return evolutionImages.pyreT3;
  if (paths.watcher >= 3) return evolutionImages.watcherT3;
  if (paths.knight >= 3) return evolutionImages.knightT3;
  if (paths.pyre >= 2) return evolutionImages.pyreT2;
  if (paths.watcher >= 2) return evolutionImages.watcherT2;
  if (paths.knight >= 2) return evolutionImages.knightT2;
  return evolutionImages.peasant;
}

function getEvolutionAttackImage(tower) {
  const paths = getPathLevels(tower);
  if (paths.pyre >= 6) return evolutionImages.pyreT3Attack;
  if (paths.pyre >= 3) return evolutionImages.pyreT3Attack;
  if (paths.watcher >= 3) return evolutionImages.watcherT3Attack;
  if (paths.knight >= 3) return evolutionImages.knightT3Attack;
  if (paths.pyre >= 2) return evolutionImages.pyreT2Attack;
  if (paths.watcher >= 2) return evolutionImages.watcherT2Attack;
  if (paths.knight >= 2) return evolutionImages.knightT2Attack;
  return evolutionImages.peasantAttack;
}

function drawEvolutionSprite(tower, image) {
  const paths = getPathLevels(tower);
  const total = getTotalPathLevels(tower);
  const main = getMainPath(tower);
  const swing = Math.max((tower.attackTimer || 0) / 0.68, 0);
  const attackImage = swing > 0 ? getEvolutionAttackImage(tower) : null;
  // During attacks, swap to a dedicated pose sprite; otherwise draw the idle form.
  const activeImage = attackImage && attackImage.complete && attackImage.naturalWidth ? attackImage : image;
  const facing = Math.cos(tower.attackAngle || 0) < 0 ? -1 : 1;
  const isLargeRobe = paths.pyre >= 3;
  const width = isLargeRobe || swing > 0 ? 80 : 66;
  const height = isLargeRobe || swing > 0 ? 116 : 104;

  ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
  ctx.beginPath();
  ctx.ellipse(tower.x, tower.y + 26, 26, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(tower.x, tower.y + 20);
  ctx.scale(facing, 1);
  ctx.rotate(facing * Math.sin((1 - swing) * Math.PI) * 0.08);
  ctx.drawImage(activeImage, -width / 2, -height + 20, width, height);
  ctx.restore();

  if (swing > 0 && paths.knight >= 2) {
    ctx.strokeStyle = `rgba(255, 232, 180, ${Math.min(swing, 0.85)})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(tower.x - 8, tower.y - 32, 52, -1.45, -0.2);
    ctx.stroke();
  }

  if (swing > 0 && main === "pyre") {
    ctx.fillStyle = `rgba(240, 80, 58, ${Math.min(swing, 0.55)})`;
    ctx.beginPath();
    ctx.arc(tower.x - 26, tower.y - 54, 8 + paths.pyre * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  drawLevelBadge(tower.x + 23, tower.y - 48, total);
}

function drawLevelBadge(x, y, text) {
  ctx.fillStyle = "#17100b";
  ctx.strokeStyle = "rgba(255, 232, 180, 0.82)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ffe8aa";
  ctx.font = "700 10px Segoe UI, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
}

function drawKnightTower(tower) {
  const swing = Math.max((tower.attackTimer || 0) / 0.68, 0);
  const swingPose = swing > 0 && knightSwingImage.complete && knightSwingImage.naturalWidth;
  const windup = Math.sin((1 - swing) * Math.PI);
  const facing = Math.cos(tower.attackAngle || 0) < 0 ? -1 : 1;
  const width = swingPose ? 88 : 74;
  const height = swingPose ? 126 : 118;
  const image = swingPose ? knightSwingImage : knightImage;

  ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
  ctx.beginPath();
  ctx.ellipse(tower.x, tower.y + 28, 27, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(tower.x, tower.y + 20);
  ctx.scale(facing, 1);
  ctx.rotate(facing * (swingPose ? -0.04 : -0.12 * windup));
  ctx.drawImage(image, -width / 2, -height + 26, width, height);
  ctx.restore();

  if (swing > 0) {
    const alpha = Math.min(swing * 1.8, 0.8);
    ctx.save();
    ctx.translate(tower.x, tower.y - 20);
    ctx.rotate(tower.attackAngle || 0);
    ctx.strokeStyle = `rgba(255, 232, 180, ${alpha})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, 56, -0.55, 0.62);
    ctx.stroke();
    ctx.restore();
  }

  drawLevelBadge(tower.x + 22, tower.y - 46, getTotalPathLevels(tower));
}

function drawTowerShape(tower) {
  const paths = getPathLevels(tower);
  if (paths.knight >= 6 && knightImage.complete && knightImage.naturalWidth) {
    drawKnightTower(tower);
    return;
  }

  const evolutionImage = getEvolutionImage(tower);
  if (evolutionImage && evolutionImage.complete && evolutionImage.naturalWidth) {
    drawEvolutionSprite(tower, evolutionImage);
  }
}

function drawTowers() {
  for (const tower of entities.towers) {
    drawRangeCircle(tower.x, tower.y, getTowerStats(tower).range);
  }

  if (state.draggedTower) {
    drawRangeCircle(state.draggedTower.x, state.draggedTower.y, getTowerStats(state.draggedTower).range, state.draggedTower.valid);
  }

  if (state.selectedPlacedTower && entities.towers.includes(state.selectedPlacedTower)) {
    drawSelectionRing(state.selectedPlacedTower);
  }

  for (const tower of entities.towers) {
    drawTowerShape(tower);
  }

  if (state.draggedTower) {
    ctx.globalAlpha = state.draggedTower.valid ? 0.9 : 0.58;
    drawTowerShape(state.draggedTower);
    ctx.globalAlpha = 1;
  }
}

function drawEnemies() {
  for (const enemy of entities.enemies) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.beginPath();
    ctx.ellipse(enemy.x, enemy.y + 12, 17, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#6f2d2a";
    ctx.strokeStyle = "#201514";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#17110f";
    ctx.fillRect(enemy.x - 18, enemy.y - 24, 36, 5);
    ctx.fillStyle = "#d7af5f";
    ctx.fillRect(enemy.x - 18, enemy.y - 24, 36 * Math.max(enemy.hp / enemy.maxHp, 0), 5);
  }
}

function drawProjectiles() {
  for (const shot of entities.projectiles) {
    ctx.fillStyle = shot.color;
    ctx.beginPath();
    ctx.arc(shot.x, shot.y, shot.splash ? 6 : 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawParticles() {
  for (const particle of entities.particles) {
    if (particle.slash) {
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.angle || 0);
      ctx.strokeStyle = particle.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, particle.r + 14, -0.65, 0.65);
      ctx.stroke();
      ctx.restore();
      continue;
    }

    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGate() {
  const point = scalePoint(path[path.length - 1]);
  ctx.fillStyle = "rgba(215, 175, 95, 0.2)";
  ctx.fillRect(point.x - 12, point.y - 72, 24, 112);
  ctx.fillStyle = "#d7af5f";
  ctx.beginPath();
  ctx.arc(point.x, point.y - 80, 18, 0, Math.PI * 2);
  ctx.fill();
}

export function draw() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  drawBackground();
  drawPath();
  drawGate();
  drawTowers();
  drawEnemies();
  drawProjectiles();
  drawParticles();
}
