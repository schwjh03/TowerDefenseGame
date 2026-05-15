import { entities, els, maxPathLevel, state } from "./state.js";
import { canvasPointFromEvent, distance, distanceToPath } from "./utils.js";
import { damageEnemy } from "./enemy.js";
import { setMessage, updateHud } from "./ui.js";

export const towerTypes = {
  aspirant: { cost: 65, range: 118, fireRate: 0.9, damage: 16, color: "#c8a85d", projectile: "#ffe8aa", splash: 0 },
};

export function getTowerName(typeName) {
  const names = { aspirant: "Aspirant" };
  return names[typeName] || "Tower";
}

export function getPathLevels(tower) {
  return tower.paths || { knight: 0, watcher: 0, pyre: 0 };
}

export function getMainPath(tower) {
  const paths = getPathLevels(tower);
  if (tower.mainPath) return tower.mainPath;
  const entries = Object.entries(paths).sort((a, b) => b[1] - a[1]);
  return entries[0][1] > 0 ? entries[0][0] : "aspirant";
}

export function getTotalPathLevels(tower) {
  const paths = getPathLevels(tower);
  return paths.knight + paths.watcher + paths.pyre;
}

export function canUpgradePath(tower, pathName) {
  const paths = getPathLevels(tower);
  if (paths[pathName] >= maxPathLevel) return false;
  // BTD-style lock-in: after a tier-3 choice, other paths are capped at tier 2.
  if (tower.mainPath) return pathName === tower.mainPath || paths[pathName] < 2;
  return paths[pathName] < 3;
}

export function getPathUpgradeCost(tower, pathName) {
  const paths = getPathLevels(tower);
  const nextLevel = paths[pathName] + 1;
  const pathBase = { knight: 12, watcher: 9, pyre: 14 };
  return pathBase[pathName] + nextLevel * 8 + getTotalPathLevels(tower) * 3;
}

export function getEvolutionTitle(tower) {
  const paths = getPathLevels(tower);
  const main = getMainPath(tower);
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

    if (stats.melee) {
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
    paths: { knight: 0, watcher: 0, pyre: 0 },
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
  // Each Aspirant starts pathless; upgrades mutate these path counters later.
  const placedTower = {
    x: tower.x,
    y: tower.y,
    type: tower.type,
    paths: { knight: 0, watcher: 0, pyre: 0 },
    mainPath: null,
    cooldown: 0.15,
  };
  entities.towers.push(placedTower);
  state.selectedPlacedTower = placedTower;
  setMessage("Aspirant placed. Choose an evolution path.");
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
    setMessage("That path is locked by your tier-3 choice.");
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
