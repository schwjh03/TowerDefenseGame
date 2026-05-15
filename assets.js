function makeImage(src) {
  const image = new Image();
  image.src = src;
  return image;
}

export const knightImage = makeImage("assets/knight.png");
export const knightSwingImage = makeImage("assets/knight-swing.png");

export const evolutionImages = {
  peasant: makeImage("assets/evolutions/peasant.png"),
  knightT2: makeImage("assets/evolutions/knight-t2.png"),
  knightT3: makeImage("assets/evolutions/knight-t3.png"),
  watcherT2: makeImage("assets/evolutions/watcher-t2.png"),
  watcherT3: makeImage("assets/evolutions/watcher-t3.png"),
  pyreT2: makeImage("assets/evolutions/pyre-t2.png"),
  pyreT3: makeImage("assets/evolutions/pyre-t3.png"),
  pyreT6: makeImage("assets/evolutions/pyre-t6.png"),
  peasantAttack: makeImage("assets/evolutions/peasant-attack.png"),
  knightT2Attack: makeImage("assets/evolutions/knight-t2-attack.png"),
  knightT3Attack: makeImage("assets/evolutions/knight-t3-attack.png"),
  watcherT2Attack: makeImage("assets/evolutions/watcher-t2-attack.png"),
  watcherT3Attack: makeImage("assets/evolutions/watcher-t3-attack.png"),
  pyreT2Attack: makeImage("assets/evolutions/pyre-t2-attack.png"),
  pyreT3Attack: makeImage("assets/evolutions/pyre-t3-attack.png"),
};
