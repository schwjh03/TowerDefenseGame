export const chapters = [
 {title:'The road of lanterns',keeper:'Edda, the bell keeper',place:'Ashen Road',boss:'The Hollow Marshal',colors:['#1c2118','#343527','#101711'],
  intro:'My sister left a lantern at every bend so the last families could find the Hold. Now the Marshal follows those lights. Hold the road while I bring the travelers in. Please leave the lanterns burning.',
  midpoint:'Edda: The first families reached us. One child brought a lantern of his own. The Marshal is following the last wagon; he arrives in wave eight.',
  end:'The wagon creaks through the gate. Edda counts every face twice, then hangs one more lantern beside the bell. The road is quiet for the first time in years.',
  path:[[-40,430],[170,430],[250,260],[450,248],[560,480],[790,500],[910,335],[1090,340],[1330,214]]},
 {title:'Letters beneath the water',keeper:'Iven, the ferryman',place:'Drowned Archive',boss:'The Inkbound Warden',colors:['#101e29','#243d42','#0b141e'],
  intro:'They drowned the archive to stop the Warden. My mother kept the letters there. Edda says you can hold a road. Can you hold a bridge while I bring our names back?',
  midpoint:'Iven: I found the letters. They were addressed to people still waiting in the Hold. The Warden has risen from the vault; keep the bridge until the eighth tide.',
  end:'Iven sets a box of damp letters beside the campfire. Edda finds one in her sister’s handwriting. Nobody speaks until the paper has dried.',
  path:[[-40,250],[210,250],[210,470],[445,470],[445,200],[740,200],[740,445],[1030,445],[1330,300]]},
 {title:'A fire for the morning',keeper:'Sera, the last lamplighter',place:'Glasswood Ridge',boss:'The Crown of Cinders',colors:['#291b2c','#483348','#161323'],
  intro:'The Crown feeds on every fire we abandon. I have one lamp left, and it will not last the night. Edda brought the people. Iven brought their stories. Help me bring them a morning.',
  midpoint:'Sera: Dawn is close. The Crown has gathered every wandering ember. Watch the final wave; we only need one lamp to stay alight.',
  end:'Morning touches the ridge. Sera puts out her lamp, not because it has failed, but because she can finally see. In the Hold, the first bell rings for breakfast.',
  path:[[-40,410],[175,410],[175,200],[410,200],[540,430],[750,430],[875,230],[1080,230],[1330,410]]},
];
export function cleanCampaign(raw) {
 const int=(v,d,lo,hi)=>Number.isSafeInteger(v)?Math.min(hi,Math.max(lo,v)):d;
 const r=raw&&typeof raw==='object'?raw:{};
 return {cleared:int(r.cleared,0,0,3),relics:int(r.relics,3,0,100),shrineLevel:int(r.shrineLevel,1,1,4),choices:Array.from({length:3},(_,i)=>r.choices?.[i]==='escort'?'escort':r.choices?.[i]==='scout'?'scout':null)};
}
export function finishChapter(progress,index,choice) {
 if (!Number.isInteger(index)||index<0||index>2||index>progress.cleared||!['escort','scout'].includes(choice)) return false;
 if(index<progress.cleared)return false;
 progress.cleared++;progress.relics=Math.min(100,progress.relics+3+index);progress.choices[index]=choice;return true;
}
export function chapterWave(chapter,wave) {
 if(!Number.isInteger(chapter)||chapter<0||chapter>2||!Number.isInteger(wave)||wave<1||wave>8)return [];
 const group=Array.from({length:6+wave*2+chapter*2},(_,i)=>({maxHp:30+wave*11+chapter*18+(i%5===0?18:0),speed:(i%4===0?75:43)+wave*2+chapter*4,reward:9+Math.floor(wave/2),kind:i%4===0?'runner':'guard'}));
 if(wave===8)group.push({maxHp:1100+chapter*550,speed:27+chapter*3,reward:150,kind:'boss',name:chapters[chapter].boss});
 return group;
}
