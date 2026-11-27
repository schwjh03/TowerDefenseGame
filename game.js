import {chapters} from "./campaign.js";
import { canvas, els, entities, state } from "./state.js";
import { updateEnemies } from "./enemy.js";
import { updateProjectiles } from "./projectile.js";
import { draw } from "./render.js";
import { updateTowerAnimations, updateTowers } from "./tower.js";
import { resetMapRun, completeRun, openStory, setMessage, setupUi, updateHud } from "./ui.js";
import { updateWaveSpawning } from "./waves.js";

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * ratio);
  canvas.height = Math.floor(window.innerHeight * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

const ctx = canvas.getContext("2d");

function updateParticles(dt) {
  for (let i = entities.particles.length - 1; i >= 0; i--) {
    entities.particles[i].life -= dt;
    entities.particles[i].r += 70 * dt;
    if (entities.particles[i].life <= 0) entities.particles.splice(i, 1);
  }
}

function update(dt) {
  if(state.runEnded)return;
  // Keep the main loop as an orchestration layer: each module owns its own system.
  updateWaveSpawning(dt);
  updateEnemies(dt);
  updateTowers(dt);
  updateProjectiles(dt);
  updateParticles(dt);
  updateTowerAnimations(dt);

  if(state.lives<=0){state.lives=0;completeRun(false);updateHud();return;}
  if (state.waveActive && !state.spawnQueue.length && !entities.enemies.length) {
    state.waveActive=false;state.gold+=35;
    if(state.wave===8){completeRun(true);}else{
     if(state.wave===4)openStory(chapters[state.chapter].keeper,chapters[state.chapter].midpoint,[{label:"Hold the road",run:()=>{}}]);
     state.wave++;setMessage("Wave cleared. Reinforce your defenses.");
    }
  }

  updateHud();
}

function gameLoop(timestamp) {
  // Multiplying dt makes 2x/3x speed affect every simulation system evenly.
  const dt = Math.min((timestamp - state.lastTime) / 1000 || 0, 0.05) * state.gameSpeed;
  state.lastTime = timestamp;
  if (!els.gameScreen.classList.contains("hidden")&&!document.querySelector("#storyDialog").open) update(dt);
  draw();
  requestAnimationFrame(gameLoop);
}

setupUi(resizeCanvas);
window.addEventListener("resize", resizeCanvas);

resizeCanvas();
resetMapRun();
requestAnimationFrame(gameLoop);
