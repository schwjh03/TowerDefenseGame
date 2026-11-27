import { entities, els, maxPathLevel, state } from "./state.js";
import { canvasPointFromEvent, distance, distanceToPath } from "./utils.js";
import { damageEnemy } from "./enemy.js";
import { setMessage, updateHud } from "./ui.js";

export const towerTypes = {
  aspirant: {
    cost: 65,
    range: 118,
    fireRate: 0.9,
    damage: 16,
    color: "#c8a85d",
    projectile: "#ffe8aa",
    splash: 0,
    paths: ["knight", "watcher", "pyre"],
    labels: { knight: "Knight", watcher: "Watcher", pyre: "Pyre" },
    baseMessage: "Aspirant placed. Choose an evolution path.",
  },
  flamebearer: {
    cost: 80,
    range: 132,
    fireRate: 0.72,
    damage: 9,
    color: "#e25b2e",
    projectile: "#f09a4a",
    splash: 0,
    paths: ["spread", "ice", "electric"],
    labels: { spread: "Spread", ice: "Ice", electric: "Electric" },
    baseMessage: "Flamebearer placed. Choose a fuel path.",
  },
};

export function getTowerName(typeName) {
  const names = { aspirant: "Aspirant", flamebearer: "Flamebearer" };
  return names[typeName] || "Tower";
}

export function getPathNames(towerOrType) {
  const typeName = typeof towerOrType === "string" ? towerOrType : towerOrType.type;
  return towerTypes[typeName].paths;
}

export function makePathLevels(typeName) {
  return Object.fromEntries(getPathNames(typeName).map((pathName) => [pathName, 0]));
}

export function getPathLevels(tower) {
  return tower.paths || makePathLevels(tower.type);
}

export function getMainPath(tower) {
  const paths = getPathLevels(tower);
  if (tower.mainPath) return tower.mainPath;
  const entries = Object.entries(paths).sort((a, b) => b[1] - a[1]);
  return entries[0][1] > 0 ? entries[0][0] : "aspirant";
}

export function getTotalPathLevels(tower) {
  const paths = getPathLevels(tower);
  return Object.values(paths).reduce((sum, level) => sum + level, 0);
}

export function canUpgradePath(tower, pathName) {
  const paths = getPathLevels(tower);
  if (!(pathName in paths)) return false;
  if (paths[pathName] >= maxPathLevel) return false;
  const chosenPathCount = Object.values(paths).filter((level) => level > 0).length;
  if (paths[pathName] === 0 && chosenPathCount >= 2) return false;
  // BTD-style lock-in: after a tier-3 choice, other paths are capped at tier 2.
  if (tower.mainPath) return pathName === tower.mainPath || paths[pathName] < 2;
  return paths[pathName] < 3;
}

export function getPathUpgradeCost(tower, pathName) {
  const paths = getPathLevels(tower);
  const nextLevel = paths[pathName] + 1;
  const pathBase = { knight: 12, watcher: 9, pyre: 14, spread: 11, ice: 13, electric: 15 };
  return pathBase[pathName] + nextLevel * 8 + getTotalPathLevels(tower) * 3;
}

export function getEvolutionTitle(tower) {
  const paths = getPathLevels(tower);
  const main = getMainPath(tower);
  if (tower.type === "flamebearer") {
    if (tower.mainPath === "spread" && paths.spread >= 3) return "Inferno Sprayer";
    if (tower.mainPath === "ice" && paths.ice >= 3) return "Frost Jet";
    if (tower.mainPath === "electric" && paths.electric >= 3) return "Storm Arc";
    if (main !== "aspirant") return `${towerTypes.flamebearer.labels[main]} Flamebearer`;
    return "Flamebearer";
  }
  if (tower.mainPath === "knight" && paths.knight >= 6) return "Golden Knight";
  if (tower.mainPath === "knight" && paths.knight >= 3) return "Silver Knight";
  if (tower.mainPath === "watcher" && paths.watcher >= 3) return "Blind Watcher";
  if (tower.mainPath === "pyre" && paths.pyre >= 6) return "Blood Pyre Wizard";
  if (tower.mainPath === "pyre" && paths.pyre >= 3) return "Pyre Wizard";
  if (main !== "aspirant") return `${main[0].toUpperCase()}${main.slice(1)} Aspirant`;
  return "Aspirant";
}

export function getTowerStats(tower) {
  const base = towerTypes[tower.type];
  const paths = getPathLevels(tower);
  const main = getMainPath(tower);
  const shrineDamageBonus = 1 + (state.shrineLevel - 1) * 0.06;
  const total = getTotalPathLevels(tower);
  if (tower.type === "flamebearer") {
    return {
      range: Math.round(base.range + paths.spread * 9 + paths.ice * 8 + paths.electric * 12),
      fireRate: Math.max(base.fireRate - paths.electric * 0.045 - paths.spread * 0.02, 0.36),
      damage: Math.round((base.damage + paths.spread * 2 + paths.ice * 3 + paths.electric * 4 + total) * shrineDamageBonus),
      cone: Math.min(0.62 + paths.spread * 0.18, 1.55),
      element: paths.electric > paths.ice && paths.electric >= Math.max(paths.spread, 1) ? "electric" : paths.ice >= Math.max(paths.spread, 1) ? "ice" : "fire",
      flame: true,
    };
  }
  return {
    range: Math.round(base.range + paths.watcher * 22 + paths.pyre * 8 + paths.knight * 6),
    fireRate: Math.max(base.fireRate - paths.watcher * 0.07 - paths.knight * 0.025, 0.42),
    damage: Math.round((base.damage + paths.knight * 9 + paths.watcher * 5 + paths.pyre * 10 + total * 2) * shrineDamageBonus),
    splash: paths.pyre >= 2 ? 34 + paths.pyre * 9 : 0,
    melee: paths.knight > 0 && (main === "knight" || paths.knight >= Math.max(paths.watcher, paths.pyre)),
    projectile: main === "pyre" ? "#f09a4a" : "#ffe8aa",
  };
}

function isPointerOverUi(event) {
  return [document.querySelector(".hud"), document.querySelector(".tower-panel")].some((element) => {
    const rect = element.getBoundingClientRect();
    return event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
  });
}

function getPlacementIssue(point, typeName, event) {
  const type = towerTypes[typeName];
  const margin = 32;
  if (!type) return "Unknown tower.";
  if (state.gold < type.cost) return `Need ${type.cost} gold for that tower.`;
  if (event && isPointerOverUi(event)) return "Drop towers on the battlefield, away from the controls.";
  if (point.x < margin || point.y < margin || point.x > window.innerWidth - margin || point.y > window.innerHeight - margin) {
    return "Place towers fully inside the battlefield.";
  }
  if (distanceToPath(point) < 58) return "Towers cannot be placed on the road.";
  if (entities.towers.some((tower) => distance(tower, point) < 58)) return "Too close to another tower.";
  return "";
}

export function updateTowers(dt) {
  for (const tower of entities.towers) {
    tower.cooldown -= dt;
    if (tower.cooldown > 0) continue;

    const stats = getTowerStats(tower);
    // Target the enemy furthest along the route so towers focus leaks first.
    const target = entities.enemies
      .filter((enemy) => distance(tower, enemy) <= stats.range)
      .sort((a, b) => b.progress - a.progress)[0];

    if (!target) continue;

    tower.cooldown = stats.fireRate;
    tower.attackTimer = 0.68;
    tower.attackAngle = Math.atan2(target.y - tower.y, target.x - tower.x);

    if (stats.flame) {
      applyFlamethrowerAttack(tower, stats);
    } else if (stats.melee) {
      damageEnemy(target, stats.damage);
      entities.particles.push({
        x: target.x,
        y: target.y,
        r: 12,
        life: 0.28,
        color: "rgba(255, 232, 180, 0.55)",
        slash: true,
        angle: tower.attackAngle,
      });
    } else {
      entities.projectiles.push({
        x: tower.x,
        y: tower.y,
        target,
        speed: getMainPath(tower) === "pyre" ? 330 : 460,
        damage: stats.damage,
        splash: stats.splash,
        color: stats.projectile,
      });
    }
  }
}

function applyFlamethrowerAttack(tower, stats) {
  const damage = stats.element === "ice" ? Math.floor(stats.damage * 0.82) : stats.damage;
  const color = stats.element === "ice" ? "rgba(130, 220, 255, 0.62)" : stats.element === "electric" ? "rgba(175, 220, 255, 0.72)" : "rgba(240, 104, 48, 0.58)";
  for (const enemy of [...entities.enemies]) {
    const dist = distance(tower, enemy);
    if (dist > stats.range) continue;
    const angleToEnemy = Math.atan2(enemy.y - tower.y, enemy.x - tower.x);
    const angleDelta = Math.abs(Math.atan2(Math.sin(angleToEnemy - tower.attackAngle), Math.cos(angleToEnemy - tower.attackAngle)));
    if (angleDelta > stats.cone) continue;

    damageEnemy(enemy, damage);
    if (stats.element === "ice") enemy.speed = Math.max(enemy.speed * 0.985, 26);
    entities.particles.push({ x: enemy.x, y: enemy.y, r: 8, life: 0.22, color });
  }
  entities.particles.push({
    x: tower.x,
    y: tower.y,
    r: 18 + stats.cone * 18,
    life: 0.18,
    color,
    cone: true,
    angle: tower.attackAngle,
    arc: stats.cone,
    range: stats.range,
  });
}

export function updateTowerAnimations(dt) {
  for (const tower of entities.towers) {
    tower.attackTimer = Math.max((tower.attackTimer || 0) - dt, 0);
  }
}

export function updateDragPosition(event) {
  if (!state.draggedTower) return;
  const point = canvasPointFromEvent(event);
  const issue = getPlacementIssue(point, state.draggedTower.type, event);
  state.draggedTower.x = point.x;
  state.draggedTower.y = point.y;
  state.draggedTower.valid = !issue;
  state.draggedTower.issue = issue;
}

export function beginTowerDrag(event, typeName) {
  state.selectedTower = typeName;
  state.selectedPlacedTower = null;
  els.towerCards.forEach((button) => button.classList.toggle("selected", button.dataset.tower === typeName));
  state.draggedTower = {
    ...canvasPointFromEvent(event),
    type: typeName,
    paths: makePathLevels(typeName),
    mainPath: null,
    cooldown: 0,
    valid: false,
    issue: "",
  };
  updateDragPosition(event);
  setMessage(`Dragging ${getTowerName(typeName)}. Release on open ground.`);
  updateHud();
}

export function finishTowerDrag(event) {
  if (!state.draggedTower) return;
  updateDragPosition(event);
  const tower = state.draggedTower;
  state.draggedTower = null;

  if (!tower.valid) {
    setMessage(tower.issue || "That tower cannot be placed there.");
    return;
  }

  const type = towerTypes[tower.type];
  state.gold -= type.cost;
  // Towers start pathless; upgrades mutate these path counters later.
  const placedTower = {
    x: tower.x,
    y: tower.y,
    type: tower.type,
    paths: makePathLevels(tower.type),
    mainPath: null,
    cooldown: 0.15,
  };
  entities.towers.push(placedTower);
  state.selectedPlacedTower = placedTower;
  setMessage(type.baseMessage);
  updateHud();
}

export function selectTowerAt(event) {
  if (state.draggedTower) return;
  const point = canvasPointFromEvent(event);
  const tower = entities.towers
    .filter((placedTower) => distance(placedTower, point) <= 30)
    .sort((a, b) => distance(a, point) - distance(b, point))[0];

  if (!tower) {
    state.selectedPlacedTower = null;
    setMessage("Drag a tower onto open ground to place it.");
    updateHud();
    return;
  }

  state.selectedPlacedTower = tower;
  setMessage(`${getEvolutionTitle(tower)} selected.`);
  updateHud();
}

export function upgradeSelectedPath(pathName) {
  if (!state.selectedPlacedTower) return;
  if (!canUpgradePath(state.selectedPlacedTower, pathName)) {
    setMessage("That path is locked. Each tower can train only two upgrade paths.");
    return;
  }

  const cost = getPathUpgradeCost(state.selectedPlacedTower, pathName);
  if (state.gold < cost) {
    setMessage(`Need ${cost} gold for that path.`);
    return;
  }

  state.gold -= cost;
  state.selectedPlacedTower.paths[pathName] += 1;
  if (!state.selectedPlacedTower.mainPath && state.selectedPlacedTower.paths[pathName] >= 3) {
    state.selectedPlacedTower.mainPath = pathName;
    setMessage(`${getEvolutionTitle(state.selectedPlacedTower)} path locked in. Other paths can reach tier 2.`);
  } else {
    setMessage(`${getEvolutionTitle(state.selectedPlacedTower)} upgraded: ${pathName} tier ${state.selectedPlacedTower.paths[pathName]}.`);
  }
  state.selectedPlacedTower.cooldown = Math.min(state.selectedPlacedTower.cooldown, 0.12);
  updateHud();
}
