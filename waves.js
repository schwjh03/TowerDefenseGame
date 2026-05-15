import { state } from "./state.js";
import { makeEnemy } from "./enemy.js";
import { setMessage, updateHud } from "./ui.js";

export function spawnWave() {
  if (state.waveActive) return;
  // Current rough wave formula: more enemies and health each wave, easy to tune later.
  const count = 8 + state.wave * 3;
  state.spawnQueue = Array.from({ length: count }, (_, i) => ({
    maxHp: 42 + state.wave * 12 + Math.floor(i / 6) * 15,
    speed: 44 + Math.min(state.wave * 4, 28),
    reward: 8 + Math.floor(state.wave / 2),
  }));
  state.spawnTimer = 0;
  state.waveActive = true;
  setMessage(`Wave ${state.wave} has begun.`);
  updateHud();
}

export function updateWaveSpawning(dt) {
  if (state.waveActive && state.spawnQueue.length) {
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      makeEnemy(state.spawnQueue.shift());
      state.spawnTimer = Math.max(0.45, 0.92 - state.wave * 0.04);
    }
  }
}
