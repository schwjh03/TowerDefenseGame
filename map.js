import {chapters} from "./campaign.js";
export const path=chapters[0].path.map(([x,y])=>({x,y}));
export function selectMap(index){const c=chapters[index];if(!c)return false;path.splice(0,path.length,...c.path.map(([x,y])=>({x,y})));return true;}
