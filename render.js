import {chapters} from "./campaign.js";
import { ctx, entities, state } from "./state.js";
import { path } from "./map.js";
import { evolutionImages, flamebearerImages, knightImage, knightSwingImage } from "./assets.js?v=flamebearer-sprites";
import { distanceToPath,sx, sy, scalePoint } from "./utils.js";
import { getMainPath, getPathLevels, getTotalPathLevels, getTowerStats } from "./tower.js";

function drawBackground() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0,chapters[state.chapter].colors[0]);
  grad.addColorStop(0.52,chapters[state.chapter].colors[1]);
  grad.addColorStop(1,chapters[state.chapter].colors[2]);
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


function drawRoadScenery(){
 // Stable landmarks make each road distinct without covering the build area.
 const c=state.chapter;
 for(let i=0;i<36;i++){
  const x=sx(45+(i*193)%1200),y=sy(155+(i*137)%430);
  if(distanceToPath({x,y})<76)continue;
  ctx.save();ctx.translate(x,y);ctx.scale(sx(1),sy(1));
  ctx.fillStyle='#0003';ctx.beginPath();ctx.ellipse(0,15,24,8,0,0,Math.PI*2);ctx.fill();
  if(c===0){
   ctx.fillStyle='#333a2b';ctx.fillRect(-6,-12,12,28);ctx.fillStyle='#252f24';ctx.beginPath();ctx.moveTo(-28,-3);ctx.lineTo(0,-55);ctx.lineTo(28,-3);ctx.closePath();ctx.fill();
   if(i%3===0){ctx.fillStyle='#b28a4b';ctx.fillRect(-3,-18,6,23);ctx.fillStyle='#f0cf85';ctx.fillRect(-7,-22,14,11);}
  }else if(c===1){
   ctx.fillStyle='#78928e';ctx.fillRect(-9,-33,18,49);ctx.fillStyle='#a6b7a6';ctx.fillRect(-13,-35,26,7);ctx.fillStyle='#405e62';ctx.fillRect(-10,5,22,11);ctx.strokeStyle='#94c5d24d';ctx.beginPath();ctx.ellipse(0,19,30,5,0,0,Math.PI*2);ctx.stroke();
  }else{
   ctx.fillStyle=i%2?'#806c93':'#466e77';ctx.beginPath();ctx.moveTo(-16,12);ctx.lineTo(-8,-39);ctx.lineTo(3,-60);ctx.lineTo(18,-15);ctx.lineTo(13,14);ctx.closePath();ctx.fill();ctx.strokeStyle='#c4c7e255';ctx.beginPath();ctx.moveTo(3,-60);ctx.lineTo(4,12);ctx.stroke();
  }
  ctx.restore();
 }
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
  if (tower.type === "flamebearer") {
    drawFlamebearerTower(tower);
    return;
  }

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

function getFlamebearerStyle(tower) {
  const stats = getTowerStats(tower);
  if (stats.element === "ice") {
    return {
      body: "#5f9fbb",
      trim: "#d9f7ff",
      tank: "#a9e8ff",
      stream: "rgba(130, 220, 255, 0.36)",
      spark: "#ecfbff",
    };
  }
  if (stats.element === "electric") {
    return {
      body: "#685fae",
      trim: "#e9e2ff",
      tank: "#9fb8ff",
      stream: "rgba(175, 220, 255, 0.38)",
      spark: "#f7fbff",
    };
  }
  return {
    body: "#73301f",
    trim: "#ffd27a",
    tank: "#e25b2e",
    stream: "rgba(240, 104, 48, 0.34)",
    spark: "#ffe08a",
  };
}

function getFlamebearerSprite(tower, attacking) {
  const paths = getPathLevels(tower);
  const rankedPaths = Object.entries(paths).sort((a, b) => b[1] - a[1]);
  const [mainPath, level] = rankedPaths[0];
  if (!level) return attacking ? flamebearerImages.baseAttack : flamebearerImages.base;

  const levelKey = attacking ? `${level}Attack` : level;
  return flamebearerImages[mainPath]?.[levelKey] || flamebearerImages[mainPath]?.[level] || flamebearerImages.base;
}

function drawFlamebearerTower(tower) {
  const paths = getPathLevels(tower);
  const total = getTotalPathLevels(tower);
  const stats = getTowerStats(tower);
  const style = getFlamebearerStyle(tower);
  const facing = Math.cos(tower.attackAngle || 0) < 0 ? -1 : 1;
  const attackPulse = Math.max((tower.attackTimer || 0) / 0.68, 0);
  const sprite = getFlamebearerSprite(tower, attackPulse > 0);
  if (sprite.complete && sprite.naturalWidth) {
    const size = 104;

    ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
    ctx.beginPath();
    ctx.ellipse(tower.x, tower.y + 22, 28, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    if (attackPulse > 0) {
      drawFlamebearerElementCone(tower, stats, style, attackPulse);
    }

    ctx.save();
    ctx.translate(tower.x, tower.y + 18);
    ctx.scale(facing, 1);
    ctx.drawImage(sprite, -size / 2, -size + 22, size, size);
    ctx.restore();
    drawLevelBadge(tower.x + 24, tower.y - 42, total);
    return;
  }

  const bodyHeight = 38 + Math.min(total, 6) * 2;

  ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
  ctx.beginPath();
  ctx.ellipse(tower.x, tower.y + 20, 24, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  if (attackPulse > 0) {
    drawFlamebearerElementCone(tower, stats, style, attackPulse);
  }

  ctx.save();
  ctx.translate(tower.x, tower.y + 8);
  ctx.scale(facing, 1);

  // Backpack tank and hose sell the tower's role even before art assets exist.
  ctx.fillStyle = "#1a1210";
  ctx.fillRect(-24, -bodyHeight + 10, 12, 30);
  ctx.fillStyle = style.tank;
  ctx.beginPath();
  ctx.roundRect(-30, -bodyHeight + 4, 18, 38, 7);
  ctx.fill();

  ctx.strokeStyle = "#1a1210";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-12, -bodyHeight + 25);
  ctx.quadraticCurveTo(8, -bodyHeight + 14, 20, -bodyHeight + 24);
  ctx.stroke();

  ctx.fillStyle = style.body;
  ctx.beginPath();
  ctx.roundRect(-16, -bodyHeight + 14, 30, 42, 8);
  ctx.fill();
  ctx.strokeStyle = style.trim;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#241714";
  ctx.beginPath();
  ctx.arc(-2, -bodyHeight + 5, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = style.trim;
  ctx.fillRect(-12, -bodyHeight - 5, 20, 6);

  ctx.strokeStyle = "#241714";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(8, -bodyHeight + 31);
  ctx.lineTo(34 + paths.spread * 2, -bodyHeight + 22);
  ctx.stroke();
  ctx.strokeStyle = style.trim;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(24, -bodyHeight + 25);
  ctx.lineTo(40 + paths.spread * 2, -bodyHeight + 20);
  ctx.stroke();

  ctx.strokeStyle = "#1a1210";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-8, -bodyHeight + 54);
  ctx.lineTo(-15, 12);
  ctx.moveTo(8, -bodyHeight + 54);
  ctx.lineTo(14, 12);
  ctx.stroke();

  ctx.restore();

  drawLevelBadge(tower.x + 24, tower.y - 42, total);
}

function drawFlamebearerElementCone(tower, stats, style, attackPulse) {
  ctx.save();
  ctx.translate(tower.x, tower.y - 16);
  ctx.rotate(tower.attackAngle || 0);
  ctx.fillStyle = style.stream;
  ctx.beginPath();
  ctx.moveTo(14, -8);
  ctx.arc(14, 0, stats.range * (0.52 + attackPulse * 0.2), -stats.cone * 0.55, stats.cone * 0.55);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = style.spark;
  ctx.lineWidth = stats.element === "electric" ? 2 : 0;
  if (stats.element === "electric") {
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(45, -10);
    ctx.lineTo(70, 6);
    ctx.lineTo(98, -4);
    ctx.stroke();
  }
  ctx.restore();
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

    ctx.fillStyle = enemy.kind==="boss"?"#8856a0":enemy.kind==="runner"?"#b27d4c":"#6f2d2a";
    if(enemy.kind==="boss"){
     ctx.save();ctx.translate(enemy.x,enemy.y);ctx.rotate(performance.now()/1200);ctx.strokeStyle="#d7af5f";ctx.lineWidth=2;ctx.setLineDash([8,5]);ctx.beginPath();ctx.arc(0,0,34,0,Math.PI*2);ctx.stroke();ctx.restore();
     ctx.fillStyle="#e8c781";ctx.font="bold 15px Segoe UI";ctx.textAlign="center";ctx.fillText(enemy.name,enemy.x,enemy.y-48);ctx.textAlign="left";
     ctx.fillStyle="#8856a0";
    }
    ctx.strokeStyle = "#201514";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle="#f7dcb2";ctx.fillRect(enemy.x-6,enemy.y-4,3,3);ctx.fillRect(enemy.x+3,enemy.y-4,3,3);
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
    if (particle.cone) {
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.angle || 0);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, particle.range || particle.r, -(particle.arc || 0.6), particle.arc || 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      continue;
    }

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
