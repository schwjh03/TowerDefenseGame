import {chapterWave} from "./campaign.js";
import { state } from "./state.js";
import { makeEnemy } from "./enemy.js";
import { setMessage, updateHud } from "./ui.js";

export function spawnWave() {
  if (state.waveActive||state.runEnded||state.lives<=0) return;
  state.spawnQueue=chapterWave(state.chapter,state.wave);
  if(!state.spawnQueue.length||state.runEnded)return;
  state.spawnTimer = 0;
  state.waveActive = true;
  setMessage(state.wave===8?`${state.spawnQueue.at(-1).name} approaches. Final wave!`:`Wave ${state.wave} of 8 has begun.`);
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
