import { canvas, els, entities, state } from "./state.js";
import { beginTowerDrag, finishTowerDrag, getEvolutionTitle, getPathLevels, getPathUpgradeCost, getTowerStats, selectTowerAt, updateDragPosition, upgradeSelectedPath, canUpgradePath } from "./tower.js";
import { spawnWave } from "./waves.js";

export function setMessage(text) {
  els.message.textContent = text;
}

export function getStartingGold() {
  return 120 + (state.shrineLevel - 1) * 25;
}

export function updateHubPanel() {
  const hubCopy = {
    shrine: {
      title: "Broken Shrine",
      text: "Repair the shrine to gain more starting gold and a small damage blessing for all towers.",
      label: "Upgradeable",
    },
    fountain: {
      title: "Blood Fountain",
      text: "A future challenge place for cursed waves, boss enemies, and riskier rewards.",
      label: "Coming Later",
    },
    armory: {
      title: "Ruined Armory",
      text: "A future tower unlock area where new defenses, artifacts, and hero-style units can live.",
      label: "Coming Later",
    },
    gate: {
      title: "Map Gate",
      text: "Enter the current single route. More maps can branch out from here later.",
      label: "Map Select",
    },
  };

  const copy = hubCopy[state.selectedHub];
  els.hubPanelLabel.textContent = copy.label;
  els.hubPanelTitle.textContent = copy.title;
  els.hubPanelText.textContent = copy.text;
  els.shrineUpgradeBox.classList.toggle("hidden", state.selectedHub !== "shrine");
  els.comingSoonButton.classList.toggle("hidden", state.selectedHub === "shrine" || state.selectedHub === "gate");
  els.beginMapButton.classList.toggle("hidden", state.selectedHub !== "gate");
  els.beginMapButton.textContent = "Begin Map";
  els.hubNodes.forEach((node) => node.classList.toggle("selected", node.dataset.hub === state.selectedHub));

  els.relics.textContent = state.relics;
  els.shrineLevel.textContent = state.shrineLevel;
  els.startingGoldBonus.textContent = `+${getStartingGold() - 120}`;

  if (state.shrineLevel >= 4) {
    els.repairShrineButton.textContent = "Shrine Fully Repaired";
    els.repairShrineButton.disabled = true;
  } else {
    const cost = state.shrineLevel + 1;
    els.repairShrineButton.textContent = `Repair Shrine ${cost} Relics`;
    els.repairShrineButton.disabled = state.relics < cost;
  }
}

function repairShrine() {
  if (state.shrineLevel >= 4) return;
  const cost = state.shrineLevel + 1;
  if (state.relics < cost) return;
  state.relics -= cost;
  state.shrineLevel += 1;
  updateHubPanel();
}

function updateUpgradePanel() {
  if (!state.selectedPlacedTower || !entities.towers.includes(state.selectedPlacedTower)) {
    state.selectedPlacedTower = null;
    els.upgradePanel.classList.add("hidden");
    return;
  }

  const stats = getTowerStats(state.selectedPlacedTower);
  const paths = getPathLevels(state.selectedPlacedTower);
  els.selectedTowerName.textContent = getEvolutionTitle(state.selectedPlacedTower);
  els.selectedTowerLevel.textContent = `K${paths.knight} W${paths.watcher} P${paths.pyre}`;
  els.selectedTowerDamage.textContent = `Damage ${stats.damage}`;
  els.selectedTowerRange.textContent = `Range ${stats.range}`;

  els.pathButtons.forEach((button) => {
    const pathName = button.dataset.path;
    const cost = getPathUpgradeCost(state.selectedPlacedTower, pathName);
    const locked = !canUpgradePath(state.selectedPlacedTower, pathName);
    const level = paths[pathName];
    button.textContent = `${pathName[0].toUpperCase()}${pathName.slice(1)} ${level}/6 - ${locked ? "Locked" : `${cost}g`}`;
    button.disabled = locked || state.gold < cost;
  });

  els.upgradePanel.classList.remove("hidden");
}

export function updateHud() {
  els.lives.textContent = state.lives;
  els.gold.textContent = state.gold;
  els.wave.textContent = state.wave;
  els.nextWaveButton.disabled = state.waveActive;
  els.nextWaveButton.textContent = state.waveActive ? "Wave Running" : "Start Wave";
  updateUpgradePanel();
}

export function resetMapRun() {
  state.lives = 20;
  state.gold = getStartingGold();
  state.wave = 1;
  state.waveActive = false;
  state.spawnQueue = [];
  state.spawnTimer = 0;
  state.draggedTower = null;
  state.selectedPlacedTower = null;
  entities.towers.length = 0;
  entities.enemies.length = 0;
  entities.projectiles.length = 0;
  entities.particles.length = 0;
  setMessage("Drag a tower onto open ground to place it.");
  updateHud();
}

function showHub() {
  els.startScreen.classList.add("hidden");
  els.gameScreen.classList.add("hidden");
  els.hubScreen.classList.remove("hidden");
  updateHubPanel();
}

function startMap(resizeCanvas) {
  els.hubScreen.classList.add("hidden");
  els.gameScreen.classList.remove("hidden");
  resizeCanvas();
  resetMapRun();
}

export function setupUi(resizeCanvas) {
  els.playButton.addEventListener("click", showHub);

  els.hubNodes.forEach((node) => {
    node.addEventListener("click", () => {
      state.selectedHub = node.dataset.hub;
      updateHubPanel();
    });
  });

  els.repairShrineButton.addEventListener("click", repairShrine);
  els.beginMapButton.addEventListener("click", () => startMap(resizeCanvas));
  els.nextWaveButton.addEventListener("click", spawnWave);

  els.speedButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.gameSpeed = Number(button.dataset.speed);
      els.speedButtons.forEach((speedButton) => speedButton.classList.toggle("selected", speedButton === button));
    });
  });

  els.pathButtons.forEach((button) => {
    button.addEventListener("click", () => upgradeSelectedPath(button.dataset.path));
  });

  els.towerCards.forEach((card) => {
    card.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      card.setPointerCapture(event.pointerId);
      beginTowerDrag(event, card.dataset.tower);
    });
  });

  canvas.addEventListener("click", selectTowerAt);
  window.addEventListener("pointermove", updateDragPosition);
  window.addEventListener("pointerup", finishTowerDrag);
}
