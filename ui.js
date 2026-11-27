import {chapters,finishChapter} from "./campaign.js";
import {selectMap} from "./map.js";
import { canvas, els, entities, state, campaign, saveCampaign } from "./state.js";
import { beginTowerDrag, finishTowerDrag, getEvolutionTitle, getPathLevels, getPathNames, getPathUpgradeCost, getTowerStats, selectTowerAt, towerTypes, updateDragPosition, upgradeSelectedPath, canUpgradePath } from "./tower.js";
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

  hubCopy.fountain={title:"Iven / The letters",text:campaign.cleared>=2?chapters[1].end:"Iven waits by the water. Clear Ashen Road to follow him into the Drowned Archive.",label:"Camp conversation"};
  hubCopy.armory={title:"Sera / The last lamp",text:campaign.cleared>=3?chapters[2].end:"Sera tends a small flame. The Glasswood road opens after you recover the archive's letters.",label:"Camp conversation"};
  hubCopy.gate={title:"Three roads home",text:"Choose a chapter below. Each road has eight waves, a named guardian, and its own route through the landscape.",label:"Story campaign"};
  const copy = hubCopy[state.selectedHub];
  els.hubPanelLabel.textContent = copy.label;
  els.hubPanelTitle.textContent = copy.title;
  els.hubPanelText.textContent = copy.text;
  els.shrineUpgradeBox.classList.toggle("hidden", state.selectedHub !== "shrine");
  els.comingSoonButton.classList.add("hidden");
  renderChapterSelect();
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
  campaign.relics=state.relics;campaign.shrineLevel=state.shrineLevel;saveCampaign();
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
  const pathNames = getPathNames(state.selectedPlacedTower);
  const labels = towerTypes[state.selectedPlacedTower.type].labels;
  els.selectedTowerName.textContent = getEvolutionTitle(state.selectedPlacedTower);
  els.selectedTowerLevel.textContent = pathNames.map((pathName) => `${labels[pathName][0]}${paths[pathName]}`).join(" ");
  els.selectedTowerDamage.textContent = `Damage ${stats.damage}`;
  els.selectedTowerRange.textContent = `Range ${stats.range}`;

  els.pathButtons.forEach((button, index) => {
    const pathName = pathNames[index];
    button.dataset.path = pathName;
    const cost = getPathUpgradeCost(state.selectedPlacedTower, pathName);
    const locked = !canUpgradePath(state.selectedPlacedTower, pathName);
    const level = paths[pathName];
    button.textContent = `${labels[pathName]} ${level}/6 - ${locked ? "Locked" : `${cost}g`}`;
    button.disabled = locked || state.gold < cost;
  });

  els.upgradePanel.classList.remove("hidden");
}

export function updateHud() {
  els.lives.textContent = state.lives;
  els.gold.textContent = state.gold;
  els.wave.textContent = `${Math.min(state.wave,8)} / 8`;
  els.nextWaveButton.disabled = state.waveActive||state.runEnded;
  els.nextWaveButton.textContent = state.waveActive ? "Wave Running" : "Start Wave";
  updateUpgradePanel();
}

export function resetMapRun() {
  selectMap(state.chapter);state.runEnded=false;
  state.lives = state.routeChoice==="escort"?24:20;
  state.gold = getStartingGold()+(state.routeChoice==="scout"?40:0);
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

export function showHub() {
  els.startScreen.classList.add("hidden");
  els.gameScreen.classList.add("hidden");
  els.hubScreen.classList.remove("hidden");
  state.relics=campaign.relics;state.shrineLevel=campaign.shrineLevel;
  updateHubPanel();
}

function startMap(resizeCanvas) {
  els.hubScreen.classList.add("hidden");
  els.gameScreen.classList.remove("hidden");
  resizeCanvas();
  resetMapRun();setMessage(chapters[state.chapter].keeper+": Keep the road open. Start wave one when your defenses are ready.");
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
  els.beginMapButton.addEventListener("click",()=>{
 const c=chapters[state.chapter];openStory(c.keeper,c.intro,[
  {label:"Escort the travelers / +4 lives",run:()=>{state.routeChoice="escort";startMap(resizeCanvas);}},
  {label:"Scout the road / +40 gold",run:()=>{state.routeChoice="scout";startMap(resizeCanvas);}}
 ]);
 });
 document.querySelector("#returnCamp").addEventListener("click",()=>openStory("Return to camp?","Your campaign unlocks stay saved. This unfinished battle will restart on your next visit.",[{label:"Return to camp",run:showHub},{label:"Keep defending",run:()=>{}}]));
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

export function openStory(name,text,choices){
 const dialog=document.querySelector("#storyDialog");document.querySelector("#storyName").textContent=name;document.querySelector("#storyText").textContent=text;
 const row=document.querySelector("#storyChoices");row.replaceChildren();
 for(const choice of choices){const b=document.createElement("button");b.type="button";b.textContent=choice.label;b.addEventListener("click",()=>{dialog.close();choice.run();});row.append(b);}
 if(!dialog.open)dialog.showModal();
}
function renderChapterSelect(){
 const row=document.querySelector("#chapterSelect");row.hidden=state.selectedHub!=="gate";row.replaceChildren();
 chapters.forEach((c,i)=>{const b=document.createElement("button");b.type="button";b.disabled=i>campaign.cleared;b.textContent=`${i+1}. ${c.place}${i<campaign.cleared?" / Complete":i>campaign.cleared?" / Locked":""}`;b.classList.toggle("selected",state.chapter===i);b.onclick=()=>{state.chapter=i;updateHubPanel();};row.append(b);});
 const preview=document.createElement("p");preview.textContent=chapters[state.chapter].title+" / "+chapters[state.chapter].keeper;row.append(preview);
}
export function completeRun(won){
 if(state.runEnded)return;state.runEnded=true;state.waveActive=false;state.spawnQueue=[];
 const c=chapters[state.chapter];let gift="";
 if(won){const fresh=finishChapter(campaign,state.chapter,state.routeChoice);state.relics=campaign.relics;const saved=saveCampaign();gift=fresh?` You recovered ${3+state.chapter} relics. ${state.chapter<2?"The next road is open.":"The campaign is complete."}`:" This chapter is already recorded in your journal.";if(!saved)gift+=" Browser storage is unavailable; keep this tab open to retain progress.";}
 openStory(won?c.title:"The gate fell",won?c.end+gift:"The travelers retreat to the Hold. Your campaign unlocks are safe; try another placement or upgrade path.",[{label:won?"Return to the Hold":"Regroup at camp",run:showHub}]);
}
