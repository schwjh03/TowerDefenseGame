export const canvas = document.querySelector("#gameCanvas");
export const ctx = canvas.getContext("2d");

export const els = {
  startScreen: document.querySelector("#startScreen"),
  hubScreen: document.querySelector("#hubScreen"),
  gameScreen: document.querySelector("#gameScreen"),
  playButton: document.querySelector("#playButton"),
  beginMapButton: document.querySelector("#beginMapButton"),
  nextWaveButton: document.querySelector("#nextWave"),
  speedButtons: [...document.querySelectorAll(".speed-button")],
  lives: document.querySelector("#lives"),
  gold: document.querySelector("#gold"),
  wave: document.querySelector("#wave"),
  relics: document.querySelector("#relics"),
  hubPanelLabel: document.querySelector("#hubPanelLabel"),
  hubPanelTitle: document.querySelector("#hubPanelTitle"),
  hubPanelText: document.querySelector("#hubPanelText"),
  shrineUpgradeBox: document.querySelector("#shrineUpgradeBox"),
  shrineLevel: document.querySelector("#shrineLevel"),
  startingGoldBonus: document.querySelector("#startingGoldBonus"),
  repairShrineButton: document.querySelector("#repairShrineButton"),
  comingSoonButton: document.querySelector("#comingSoonButton"),
  hubNodes: [...document.querySelectorAll(".hub-node")],
  message: document.querySelector("#message"),
  upgradePanel: document.querySelector("#upgradePanel"),
  selectedTowerName: document.querySelector("#selectedTowerName"),
  selectedTowerLevel: document.querySelector("#selectedTowerLevel"),
  selectedTowerDamage: document.querySelector("#selectedTowerDamage"),
  selectedTowerRange: document.querySelector("#selectedTowerRange"),
  pathButtons: [...document.querySelectorAll(".path-button")],
  towerCards: [...document.querySelectorAll(".tower-card")],
};

export const state = {
  selectedTower: "aspirant",
  lives: 20,
  gold: 120,
  wave: 1,
  waveActive: false,
  spawnQueue: [],
  spawnTimer: 0,
  lastTime: 0,
  gameSpeed: 1,
  draggedTower: null,
  selectedPlacedTower: null,
  relics: 3,
  shrineLevel: 1,
  selectedHub: "shrine",
};

export const entities = {
  towers: [],
  enemies: [],
  projectiles: [],
  particles: [],
};

export const maxPathLevel = 6;
