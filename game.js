'use strict';
function buildText(p){const entries=Object.entries(p.powers);return entries.length?entries.slice(-3).map(([id,v])=>{const d=powerDef(id);return(d?d.name:id)+(v>1?' ×'+v:'')}).join(' · '):'sin mejoras'}
function scoreData(s){const m=modeOf(s);if(m.id==='teams')return[{label:'EQUIPO AZUL',score:s.teamScore[0],color:TEAM_COLORS[0]},{label:'EQUIPO ROSA',score:s.teamScore[1],color:TEAM_COLORS[1]}];return s.players.map(p=>({label:(p.i===me?'TÚ · ':'')+(p.name||('P'+(p.i+1))),score:p.score,color:PLAYER_COLORS[p.i]}))}
const GARAGE_KEY='fr-garage-build';
const CHASSIS_ORDER=['mix','trucks','lizzy'];
let garageBuild=loadGarageBuild(),pickerContext='garage',pickerSlot=null,weaponCompareTimer=null,trainingActive=false,trainingPreviousMode='duel',trainingSlots={A:null,B:null};
window.frQueueIntent='idle';

function blankGarageBuild(){return{character:'mix',loadout:{weapon:null,special:null,system:null}}}
function loadGarageBuild(){
  try{
    const x=JSON.parse(localStorage.getItem(GARAGE_KEY)||'null');if(!x||!CHASSIS[x.character])return blankGarageBuild();
    return{character:x.character,loadout:{weapon:WEAPONS[x.loadout?.weapon]?x.loadout.weapon:null,special:SPECIALS[x.loadout?.special]?x.loadout.special:null,system:SYSTEMS[x.loadout?.system]?x.loadout.system:null}}
  }catch{return blankGarageBuild()}
}
function saveGarageBuild(){try{localStorage.setItem(GARAGE_KEY,JSON.stringify(garageBuild))}catch{}}
function garageCanQueue(){return loadoutValid(garageBuild)}
function moduleTable(slot){return slot==='weapon'?WEAPONS:slot==='special'?SPECIALS:SYSTEMS}
function moduleLabel(slot){return slot==='weapon'?'ARMA':slot==='special'?'ESPECIAL':'SISTEMA'}
function chassisMeta(id){const c=CHASSIS[id]||CHASSIS.mix;return c.capacity+' puntos · '+c.ability}
function moduleName(slot,id){return moduleTable(slot)[id]?.name||'AÑADIR'}
function machineData(el,p){
  if(!el||!p)return;el.dataset.chassis=p.character||'mix';el.dataset.weapon=p.loadout?.weapon||'';el.dataset.special=p.loadout?.special||'';el.dataset.system=p.loadout?.system||''
}
function normalizeGarageForChassis(){
  const c=CHASSIS[garageBuild.character]||CHASSIS.mix;
  for(const slot of['weapon','special','system']){
    const table=moduleTable(slot),id=garageBuild.loadout[slot];
    if(id&&!moduleAllowed(garageBuild.character,table[id]))garageBuild.loadout[slot]=null
  }
  for(const slot of['system','special','weapon']){
    if(moduleCost(garageBuild.loadout)<=c.capacity)break;
    garageBuild.loadout[slot]=null
  }
}
function garageSetChassis(id){
  if(!CHASSIS[id])return;garageBuild.character=id;normalizeGarageForChassis();saveGarageBuild();renderGarage()
}
function garageCycle(dir){
  const i=CHASSIS_ORDER.indexOf(garageBuild.character),n=(i+dir+CHASSIS_ORDER.length)%CHASSIS_ORDER.length;garageSetChassis(CHASSIS_ORDER[n])
}
function renderGarage(){
  const c=CHASSIS[garageBuild.character]||CHASSIS.mix,cost=moduleCost(garageBuild.loadout),ok=garageCanQueue();
  machineData($('garageMachine'),garageBuild);
  $('garageChassisName').textContent=c.name;$('garageChassisMeta').textContent=chassisMeta(c.id);
  $('garageWeaponName').textContent=moduleName('weapon',garageBuild.loadout.weapon);
  const garageWeapon=WEAPONS[garageBuild.loadout.weapon];
  const garageWeaponStats=$('garageWeaponStats');if(garageWeaponStats)garageWeaponStats.textContent=garageWeapon?weaponDamageText(garageWeapon)+' · RANGO '+garageWeapon.range:'';
  $('garageSpecialName').textContent=moduleName('special',garageBuild.loadout.special);
  $('garageSystemName').textContent=moduleName('system',garageBuild.loadout.system);
  for(const b of document.querySelectorAll('[data-garage-slot]'))b.classList.toggle('filled',!!garageBuild.loadout[b.dataset.garageSlot]);
  $('garageCapacityText').textContent=cost+' / '+c.capacity;$('garageCapacityFill').style.width=Math.min(100,cost/c.capacity*100)+'%';
  $('garageCapacityFill').classList.toggle('over',cost>c.capacity);
  $('garageLoadoutWarning').textContent=ok?'Máquina lista para combatir.':(cost>c.capacity?'Capacidad superada. Desmonta una pieza.':'Monta arma, especial y sistema.');
  $('garageLoadoutWarning').classList.toggle('bad',!ok);
  $('quickPlayBtn').disabled=!ok;$('hostBtn').disabled=!ok;
  $('partyModeLabel').textContent=(MODES[selectedMode]?.name||selectedMode)+' · QUICKPLAY';
  const title=$('homeBuildTitle'),mods=$('homeBuildModules');if(title)title.textContent=c.name;if(mods)mods.textContent=[moduleName('weapon',garageBuild.loadout.weapon),moduleName('special',garageBuild.loadout.special),moduleName('system',garageBuild.loadout.system)].filter(x=>x!=='AÑADIR').join(' · ')||'Sin montar';
  const self=$('partySelfName');if(self)self.textContent=typeof frPlayerName==='function'?frPlayerName():'Jugador'
}
function cleanStatNumber(n){const v=Number(n);return Number.isInteger(v)?String(v):String(Number(v.toFixed(2)))}
function weaponDamageText(d){
  if(!d)return'';
  if(d.id==='scrapshot'){
    const pellets=d.pellets||1,total=d.damage*pellets;
    return 'DAÑO '+cleanStatNumber(d.damage)+' × '+pellets+' = '+cleanStatNumber(total);
  }
  if(d.id==='sunline'){
    const dps=d.damage/Math.max(.01,d.rate||.08);
    return 'DAÑO '+cleanStatNumber(d.damage)+'/tick · ~'+Math.round(dps)+' DPS';
  }
  return 'DAÑO '+cleanStatNumber(d.damage);
}
function weaponTheoreticalDps(d){
  if(!d)return 0;
  const hit=d.id==='scrapshot'?d.damage*(d.pellets||1):d.damage;
  return hit/Math.max(.01,d.rate||1)
}
function statDelta(label,next,prev,epsilon=.001,lowerBetter=false){
  if(Math.abs(next-prev)<=epsilon)return'<span class="same">'+label+' =</span>';
  const rising=next>prev,better=lowerBetter?!rising:rising;
  return'<span class="'+(better?'better':'worse')+'">'+label+' '+(rising?'↑':'↓')+'</span>'
}
function showWeaponCompare(prev,next){
  const box=$('weaponCompare');if(!box||!prev||!next||prev.id===next.id)return;
  box.innerHTML=
    statDelta('DPS',weaponTheoreticalDps(next),weaponTheoreticalDps(prev),.05)+
    statDelta('CADENCIA',1/(next.rate||1),1/(prev.rate||1),.01)+
    statDelta('ALCANCE',next.range||0,prev.range||0,.5)+
    statDelta('RETROCESO',next.recoil||0,prev.recoil||0,.5,true);
  box.classList.remove('hidden');box.classList.add('visible');
  clearTimeout(weaponCompareTimer);
  weaponCompareTimer=setTimeout(()=>{box.classList.remove('visible');setTimeout(()=>box.classList.add('hidden'),180)},1600)
}
function moduleCardStats(d,slot){
  if(slot==='weapon')return [weaponDamageText(d),d.range?'RANGO '+d.range:null,d.rate?'CAD '+d.rate.toFixed(2)+'s':null,d.recoil?'RETRO '+d.recoil:null].filter(Boolean).join(' · ');
  if(slot==='special')return 'CD '+d.cd.toFixed(1)+'s';
  return 'PASIVA'
}
function openModulePicker(slot,context='garage'){
  pickerContext=context;pickerSlot=slot;
  const state=context==='ready'?(host?game:view):null,p=context==='ready'&&me!=null?state?.players?.[me]:garageBuild;
  if(!p)return;
  const table=moduleTable(slot),grid=$('modulePickerGrid'),c=CHASSIS[p.character]||CHASSIS.mix;grid.innerHTML='';
  $('modulePickerKicker').textContent=moduleLabel(slot);$('modulePickerTitle').textContent='MONTA UNA PIEZA';
  if(context==='garage'){const remove=document.createElement('button');remove.className='module-choice module-remove';remove.innerHTML='<b>DESMONTAR</b>';remove.onclick=()=>chooseModule(null);grid.appendChild(remove)}
  for(const d of Object.values(table)){
    const candidate={...(p.loadout||{}),[slot]:d.id},compatible=moduleAllowed(p.character,d),fits=moduleCost(candidate)<=c.capacity,disabled=!compatible||!fits;
    const bt=document.createElement('button');bt.className='module-choice'+(disabled?' locked':'')+(p.loadout?.[slot]===d.id?' selected':'');bt.disabled=disabled;
    bt.innerHTML='<b>'+d.name+'</b><p>'+escapeGarage(d.desc||'')+'</p><small>'+escapeGarage(moduleCardStats(d,slot))+' · '+d.cost+'P</small>';
    bt.onclick=()=>chooseModule(d.id);grid.appendChild(bt)
  }
  $('modulePicker').classList.remove('hidden')
}
function closeModulePicker(){$('modulePicker').classList.add('hidden');pickerSlot=null}
function chooseModule(id){
  if(!pickerSlot)return;
  if(pickerContext==='garage'){
    const previousWeapon=pickerSlot==='weapon'?WEAPONS[garageBuild.loadout.weapon]:null;
    garageBuild.loadout[pickerSlot]=id;saveGarageBuild();renderGarage();
    if(pickerSlot==='weapon'&&id)showWeaponCompare(previousWeapon,WEAPONS[id])
  }else{
    if(me==null)return;
    if(id==null)return;
    if(host)setLoadout(me,pickerSlot,id);else conn?.send({type:'loadout',slot:pickerSlot,id});
    garageBuild.character=(host?game:view)?.players?.[me]?.character||garageBuild.character;garageBuild.loadout[pickerSlot]=id;saveGarageBuild()
  }
  closeModulePicker()
}
function renderReadyParty(s){
  const box=$('readyPartySlots');box.innerHTML='';const m=modeOf(s),friendly=window.frQueueIntent==='friendly';
  for(let i=0;i<m.players;i++){
    if(!friendly&&!s.connected[i])continue;
    const p=s.players[i],connected=!!s.connected[i],el=document.createElement('div');el.className='ready-party-slot'+(connected?' connected':' empty');
    el.innerHTML=connected?'<span style="--pc:'+PLAYER_COLORS[i]+'">'+(i+1)+'</span><b>'+escapeGarage(p.name||('P'+(i+1)))+'</b><small>'+String(p.character||'mix').toUpperCase()+' · '+(s.ready[i]?'LISTO':'PREPARANDO')+'</small>':'<span>+</span><b>INVITAR</b><small>slot libre</small>';
    box.appendChild(el)
  }
}
function escapeGarage(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function renderReadyMachine(p,locked){
  if(!p)return;const c=CHASSIS[p.character]||CHASSIS.mix,cost=moduleCost(p.loadout),ok=loadoutValid(p);
  machineData($('readyMachine'),p);$('readyChassisName').textContent=c.name;$('readyChassisMeta').textContent=chassisMeta(c.id);
  $('readyWeaponName').textContent=moduleName('weapon',p.loadout?.weapon);$('readySpecialName').textContent=moduleName('special',p.loadout?.special);$('readySystemName').textContent=moduleName('system',p.loadout?.system);
  for(const b of document.querySelectorAll('[data-ready-slot]')){b.disabled=locked;b.classList.toggle('filled',!!p.loadout?.[b.dataset.readySlot])}
  $('readyChassisPrev').disabled=locked;$('readyChassisNext').disabled=locked;
  $('capacityText').textContent=cost+' / '+c.capacity;$('capacityFill').style.width=Math.min(100,cost/c.capacity*100)+'%';$('capacityFill').classList.toggle('over',cost>c.capacity);
  $('loadoutWarning').textContent=ok?loadoutSummary(p):(cost>c.capacity?'Capacidad superada.':'Monta los tres módulos.');$('loadoutWarning').classList.toggle('bad',!ok)
}
function readyCycleChassis(dir){
  const state=host?game:view,p=me!=null?state?.players?.[me]:null;if(!p)return;const i=CHASSIS_ORDER.indexOf(p.character),id=CHASSIS_ORDER[(i+dir+CHASSIS_ORDER.length)%CHASSIS_ORDER.length];
  if(host)setCharacter(me,id);else conn?.send({type:'character',id});
  garageBuild.character=id;garageBuild.loadout=clone(DEFAULT_LOADOUT[id]);saveGarageBuild()
}
function applyGarageToLocalGame(){
  if(!garageCanQueue()||me==null)return false;
  if(host){
    setCharacter(me,garageBuild.character);
    for(const slot of['weapon','special','system'])setLoadout(me,slot,garageBuild.loadout[slot])
  }else{
    conn?.send({type:'character',id:garageBuild.character});
    for(const slot of['weapon','special','system'])conn?.send({type:'loadout',slot,id:garageBuild.loadout[slot]})
  }
  return true
}
function setQueueIntent(kind){window.frQueueIntent=kind||'idle'}
window.applyGarageToLocalGame=applyGarageToLocalGame;window.garageCanQueue=garageCanQueue;window.setQueueIntent=setQueueIntent;

function configureTrainingMachine(p){
  p.character=garageBuild.character;
  p.loadout=clone(garageBuild.loadout);
  p.powers={};p.synergies=[];p.weaponHeat=0;p.weaponLock=0;p.specialCd=0;p.dc=0;p.shot=0;
  p.max=characterHp(p.character,MODES.duel);p.hp=p.max;p.r=CHASSIS[p.character].radius;p.alive=true;
  p.stats=combatStats();resetMachineStats(p);
  p.fx={burn:0,burnDps:0,burnOwner:null,slow:0,slowFactor:1,shock:0,haste:0,fortify:0,reactiveReady:0,invisible:0,overcharge:0,bladeStorm:0,bladeTick:0}
}
function resetTrainingMetrics(){
  if(!game?.training)return;
  game.trainingMetrics={total:0,best:0,events:[],startedAt:performance.now()};
  if(game.players[0])game.players[0].stats=combatStats()
}
function clearTrainingProjectiles(){
  if(!game?.training)return;
  game.bullets=[];game.fires=[];game.mines=[];game.effects=[];game.feedback=[];game.killfeed=[];
  const p=game.players[0];if(p){p.weaponHeat=0;p.weaponLock=0;p.specialCd=0;p.dc=0;p.shot=0;p.ps=0;p.pd=0;p.fx.burn=0;p.fx.slow=0;p.fx.fortify=0;p.fx.invisible=0;p.fx.bladeStorm=0;p.fx.bladeTick=0}
}
function trainingUpgradeGroup(id){
  if(id.startsWith('sys_'))return'system';
  if(id.startsWith('mix_')||id.startsWith('trucks_')||id.startsWith('lizzy_'))return'chassis';
  if(id.startsWith('atlas_')||id.startsWith('hell_')||id.startsWith('shiv_')||id.startsWith('mine_')||id.startsWith('hound_')||id.startsWith('trinity_'))return'special';
  return'weapon'
}
function trainingGroupTitle(group,p){
  if(group==='weapon')return'ARMA · '+(WEAPONS[p.loadout?.weapon]?.name||'—');
  if(group==='special')return'ESPECIAL · '+(SPECIALS[p.loadout?.special]?.name||'—');
  if(group==='system')return'SISTEMA · '+(SYSTEMS[p.loadout?.system]?.name||'—');
  return'CHASIS · '+(CHASSIS[p.character]?.name||p.character)
}
function compatibleTrainingUpgrades(p){
  return Object.entries(GENERAL).filter(([,d])=>!d.eligible||d.eligible(p))
}
function rebuildTrainingMachine(powers={},source=null){
  if(!game?.training)return;
  const p=game.players[0],x=p.x,y=p.y,a=p.a,name=p.name;
  if(source){p.character=source.character;p.loadout=clone(source.loadout)}
  p.max=characterHp(p.character,MODES.duel);p.hp=p.max;p.r=CHASSIS[p.character].radius;p.alive=true;
  p.x=x;p.y=y;p.a=a;p.name=name;p.synergies=[];p.powers={};
  resetMachineStats(p);
  for(const [id,countRaw] of Object.entries(powers||{})){
    const d=GENERAL[id];if(!d||d.eligible&&!d.eligible(p))continue;
    const count=Math.max(0,Math.min(d.max||1,Number(countRaw)||0));
    for(let n=0;n<count;n++){if(d.apply)d.apply(p,game,true);p.powers[id]=(p.powers[id]||0)+1}
  }
  p.fx={burn:0,burnDps:0,burnOwner:null,slow:0,slowFactor:1,shock:0,haste:0,fortify:0,reactiveReady:p.s.reactive?1:0,invisible:0,overcharge:0,bladeStorm:0,bladeTick:0};
  p.weaponHeat=0;p.weaponLock=0;p.specialCd=0;p.dc=0;p.shot=0;p.ps=0;p.pd=0;
  clearTrainingProjectiles();resetTrainingMetrics();applyTrainingDummyMode(game.trainingDummyMode||'fixed',false);
  $('trainingBuildName').textContent=(CHASSIS[p.character]?.name||p.character)+' · '+(WEAPONS[p.loadout.weapon]?.name||'ARMA');
  renderTrainingUpgradePanel()
}
function setTrainingUpgradeLevel(id,level){
  if(!game?.training)return;
  const p=game.players[0],d=GENERAL[id];if(!d||d.eligible&&!d.eligible(p))return;
  const desired=clone(p.powers||{}),next=Math.max(0,Math.min(d.max||1,level));
  if(next)desired[id]=next;else delete desired[id];
  rebuildTrainingMachine(desired)
}
function renderTrainingUpgradePanel(){
  if(!game?.training)return;
  const p=game.players[0],root=$('trainingUpgradeGroups');if(!root)return;root.innerHTML='';
  const groups={weapon:[],special:[],chassis:[],system:[]};
  for(const [id,d] of compatibleTrainingUpgrades(p))groups[trainingUpgradeGroup(id)].push([id,d]);
  for(const group of ['weapon','special','chassis','system']){
    if(!groups[group].length)continue;
    const section=document.createElement('section');section.className='training-upgrade-group';
    const head=document.createElement('h4');head.textContent=trainingGroupTitle(group,p);section.appendChild(head);
    for(const [id,d] of groups[group]){
      const level=p.powers[id]||0,max=d.max||1,row=document.createElement('div');row.className='training-upgrade-row rarity-'+d.rarity;
      row.innerHTML='<div class="training-upgrade-copy"><span>'+escapeGarage(RARITY_LABEL[d.rarity]||d.rarity)+'</span><b>'+escapeGarage(d.name)+'</b><p>'+escapeGarage(d.desc)+'</p></div><div class="training-stepper"><button data-minus type="button">−</button><strong>'+level+' / '+max+'</strong><button data-plus type="button">+</button></div>';
      const minus=row.querySelector('[data-minus]'),plus=row.querySelector('[data-plus]');minus.disabled=level<=0;plus.disabled=level>=max;
      minus.onclick=()=>setTrainingUpgradeLevel(id,level-1);plus.onclick=()=>setTrainingUpgradeLevel(id,level+1);
      section.appendChild(row)
    }
    root.appendChild(section)
  }
}
function repositionTrainingDummy(reset=true){
  if(!game?.training)return;
  const d=game.players[1];game.trainingDummyAnchor={x:1030,y:380};d.x=1030;d.y=380;d.vx=d.vy=0;d.a=Math.PI;d.hp=d.max;d.alive=true;
  if(reset)resetTrainingMetrics()
}
function applyTrainingDummyMode(mode='fixed',reset=true){
  if(!game?.training)return;
  const valid=['fixed','free','tank'];game.trainingDummyMode=valid.includes(mode)?mode:'fixed';
  const d=game.players[1];d.s.damageReduction=game.trainingDummyMode==='tank'?.35:0;
  d.s.knockTaken=game.trainingDummyMode==='fixed'?0:(game.trainingDummyMode==='tank'?.45:1);
  d.r=game.trainingDummyMode==='tank'?36:30;
  repositionTrainingDummy(false);
  if(reset)resetTrainingMetrics()
}
function cycleTrainingDummy(){
  if(!game?.training)return;
  const modes=['fixed','free','tank'],i=modes.indexOf(game.trainingDummyMode||'fixed');
  applyTrainingDummyMode(modes[(i+1)%modes.length])
}
function trainingMetricSnapshot(s=game){
  const m=s?.trainingMetrics||{total:0,best:0,events:[],startedAt:performance.now()},now=performance.now(),p=s?.players?.[0];
  m.events=m.events.filter(e=>now-e.t<=5000);
  const elapsed=Math.max(.25,Math.min(5,(now-m.startedAt)/1000)),damage5=m.events.reduce((sum,e)=>sum+e.d,0),burst=m.events.filter(e=>now-e.t<=1000).reduce((sum,e)=>sum+e.d,0);
  return{total:m.total,dps:damage5/elapsed,burst,best:m.best,accuracy:p?.stats?.shots?p.stats.hits/p.stats.shots*100:0}
}
function trainingBuildLabel(p=game?.players?.[0]){
  if(!p)return'—';const count=Object.values(p.powers||{}).reduce((a,b)=>a+b,0);
  return(CHASSIS[p.character]?.name||p.character)+' · '+(WEAPONS[p.loadout?.weapon]?.name||'ARMA')+(count?' · '+count+' mods':'')
}
function saveTrainingSlot(slot){
  if(!game?.training||!['A','B'].includes(slot))return;
  const p=game.players[0];trainingSlots[slot]={character:p.character,loadout:clone(p.loadout),powers:clone(p.powers||{}),metrics:trainingMetricSnapshot(),label:trainingBuildLabel(p)};
  renderTrainingSlots()
}
function loadTrainingSlot(slot){
  const snap=trainingSlots[slot];if(!game?.training||!snap)return;
  rebuildTrainingMachine(snap.powers,snap);renderTrainingSlots()
}
function fmtMetric(v){return Math.round(Number(v)||0)}
function metricPercent(next,base){
  if(!base)return next?'nuevo':'=';
  const pct=(next-base)/Math.abs(base)*100;if(Math.abs(pct)<.5)return'=';
  return(pct>0?'+':'')+Math.round(pct)+'%'
}
function renderTrainingSlots(){
  for(const slot of ['A','B']){
    const snap=trainingSlots[slot],label=$('training'+slot+'Label'),stats=$('training'+slot+'Stats'),load=$('trainingLoad'+slot);
    if(label)label.textContent=snap?snap.label:'vacía';
    if(stats)stats.textContent=snap?('DPS '+fmtMetric(snap.metrics.dps)+' · BURST '+fmtMetric(snap.metrics.burst)+' · MÁX '+cleanStatNumber(snap.metrics.best)):'—';
    if(load)load.disabled=!snap
  }
  const diff=$('trainingDiff'),a=trainingSlots.A,b=trainingSlots.B;if(!diff)return;
  if(!a||!b){diff.textContent='Guarda A y B para comparar.';return}
  diff.innerHTML='B vs A · <span>DPS '+metricPercent(b.metrics.dps,a.metrics.dps)+'</span><span>BURST '+metricPercent(b.metrics.burst,a.metrics.burst)+'</span><span>MÁX '+metricPercent(b.metrics.best,a.metrics.best)+'</span><span>PREC '+metricPercent(b.metrics.accuracy,a.metrics.accuracy)+'</span>'
}
function startTestRange(){
  if(!garageCanQueue()){status('Completa una máquina válida antes de probarla.',true);return}
  if(typeof closeNetworking==='function')closeNetworking();
  trainingPreviousMode=selectedMode;trainingActive=true;host=false;me=0;code='';
  game=makeGame('duel');game.training=true;game.trainingNoCooldowns=false;game.trainingDummyMode='fixed';
  const trainingMap=MAPS.findIndex(m=>m.training);game.map=trainingMap>=0?trainingMap:0;
  game.connected=[true,true];game.ready=[true,true];game.phase='play';game.round=1;
  game.bullets=[];game.pickups=[];game.barrels=[];game.fires=[];game.mines=[];game.effects=[];game.feedback=[];game.killfeed=[];
  configureTrainingMachine(game.players[0]);
  const p=game.players[0];p.name=typeof frPlayerName==='function'?frPlayerName():'TÚ';p.x=330;p.y=380;p.a=0;
  const d=game.players[1];d.name='DUMMY';d.character='trucks';d.loadout=clone(DEFAULT_LOADOUT.trucks);d.powers={};d.synergies=[];resetMachineStats(d);d.r=30;d.max=1000000000;d.hp=d.max;d.alive=true;
  d.fx={burn:0,burnDps:0,burnOwner:null,slow:0,slowFactor:1,shock:0,haste:0,fortify:0,reactiveReady:0,invisible:0,overcharge:0,bladeStorm:0,bladeTick:0};
  applyTrainingDummyMode('fixed',false);remoteInputs[1]=blankInput();view=game;resetTrainingMetrics();
  Object.assign(mine,blankInput());mine.ax=d.x;mine.ay=d.y;
  $('lobby').classList.add('hidden');$('roomPanel').classList.add('hidden');$('gameWrap').classList.remove('hidden');$('fullscreenBtn').classList.remove('hidden');$('trainingHud').classList.remove('hidden');$('trainingUpgrades').classList.add('hidden');
  $('trainingBuildName').textContent=trainingBuildLabel(p);
  $('scoreboard').innerHTML='';$('centerMessage').classList.add('hidden');
  $('modeName').textContent='PRUEBAS';$('roundNum').textContent='—';$('mapName').textContent='BANCO';if(typeof net==='function')net('local',true);
  renderTrainingUpgradePanel();renderTrainingSlots()
}
function exitTestRange(){
  trainingActive=false;
  Object.assign(mine,blankInput());
  game=view=null;me=null;host=false;selectedMode=trainingPreviousMode;
  $('trainingHud').classList.add('hidden');$('trainingUpgrades').classList.add('hidden');$('gameWrap').classList.add('hidden');$('roomPanel').classList.add('hidden');$('fullscreenBtn').classList.add('hidden');$('lobby').classList.remove('hidden');if(typeof net==='function')net('offline',false);
  renderGarage();showLobbyView('hangar')
}
function renderTrainingHud(s){
  if(!s?.training)return;
  const snap=trainingMetricSnapshot(s),p=s.players[0],dummyLabel={fixed:'FIJO',free:'LIBRE',tank:'TANQUE'}[s.trainingDummyMode]||'FIJO';
  $('trainingDamage').textContent=Math.round(snap.total);
  $('trainingDps').textContent=Math.round(snap.dps);
  $('trainingBurst').textContent=Math.round(snap.burst);
  $('trainingBest').textContent=cleanStatNumber(snap.best);
  $('trainingAccuracy').textContent=Math.round(snap.accuracy)+'%';
  $('trainingCooldownBtn').textContent=s.trainingNoCooldowns?'CD DESACTIVADOS':'CD NORMALES';
  $('trainingDummyBtn').textContent='DUMMY · '+dummyLabel;
  $('trainingBuildName').textContent=trainingBuildLabel(p)
}
function syncUI(s){if(!s)return;if(s.training){renderTrainingHud(s);$('readyOverlay').classList.add('hidden');$('upgradeOverlay').classList.add('hidden');$('matchOverlay').classList.add('hidden');return}const m=modeOf(s);$('modeName').textContent=m.name;$('roundNum').textContent=s.round;$('mapName').textContent=mapDef(s).name;
  const sb=$('scoreboard');sb.innerHTML='';for(const item of scoreData(s)){const el=document.createElement('div');el.className='score-pill';el.style.borderColor=item.color+'66';el.innerHTML='<span style="color:'+item.color+'">'+item.label+'</span><b>'+item.score+'</b>';sb.appendChild(el)}
  const msg=$('centerMessage');if(s.phase==='count'){msg.textContent=Math.ceil(s.count);msg.classList.remove('hidden')}else if(s.phase==='round'){msg.textContent='RONDA TERMINADA';msg.classList.remove('hidden')}else msg.classList.add('hidden');
  readyUI(s);draftUI(s);endUI(s)
}
function readyUI(s){
  const o=$('readyOverlay');if(s.phase!=='ready'){o.classList.add('hidden');return}
  o.classList.remove('hidden');const m=modeOf(s),connected=s.connected.filter(Boolean).length,full=connected===m.players,mineReady=me!=null&&!!s.ready[me],readyCount=s.ready.filter(Boolean).length,p=me!=null?s.players[me]:null,valid=!!p&&loadoutValid(p),quick=window.frQueueIntent==='quick';
  renderReadyParty(s);renderReadyMachine(p,mineReady||me==null);
  $('readyTitle').textContent=!full?(quick?'BUSCANDO...':'SALA AMISTOSA'):(mineReady?'MÁQUINA CERRADA':'ÚLTIMO AJUSTE');
  $('readySubtitle').textContent=!full?(quick?'Tu máquina ya está en cola. El rival/equipo aparecerá al encontrarlo.':'Comparte el código de sala e invita a quien quieras.'):(mineReady?'Esperando al resto.':'Revisa la máquina y confirma.');
  $('readyBtn').disabled=!full||mineReady||me==null||!valid;$('readyBtn').textContent=!full?(quick?'BUSCANDO RIVALES':'ESPERANDO JUGADORES'):(mineReady?'LISTO ✓':'LISTO');
  $('readyState').textContent=connected+' / '+m.players+' conectados · '+readyCount+' / '+m.players+' listos'
}
function draftUI(s){const o=$('upgradeOverlay');if(s.phase!=='pick'||me==null){o.classList.add('hidden');o.dataset.sig='';pickLock=false;return}o.classList.remove('hidden');const opts=s.opts[me]||[],chosen=s.picked[me],p=s.players[me],sig=opts.join('|')+'|'+chosen+'|'+p.lossStreak;if(o.dataset.sig===sig)return;o.dataset.sig=sig;$('upgradeCards').innerHTML='';opts.forEach((id,n)=>{const d=powerDef(id);if(!d)return;const bt=document.createElement('button');bt.className='power-card rarity-'+d.rarity;bt.disabled=chosen!=null;const unlock=SYNERGIES.find(sy=>sy.requires.includes(id)&&!hasSynergy(p,sy.id)&&sy.requires.every(req=>req===id||(p.powers[req]||0)>0));bt.innerHTML='<span class="rarity">'+RARITY_LABEL[d.rarity]+'</span><h3>'+d.name+'</h3><p>'+d.desc+'</p>'+(unlock?'<span class="synergy-hint">SINERGIA → '+unlock.name+'</span>':'')+'<span class="lvl">NIVEL '+(p.powers[id]||0)+' / '+(d.max||1)+'</span>';bt.onclick=()=>{if(pickLock)return;pickLock=true;if(host)chooseUpgrade(0,n);else conn?.send({type:'pick',n})};$('upgradeCards').appendChild(bt)});const luck=p.lossStreak?(' · Comeback luck +'+p.lossStreak):'';$('upgradeKicker').textContent='ELIGE TU MEJORA'+luck;$('pickStatus').textContent=chosen==null?'El draft solo ofrece modificaciones compatibles con tu chasis y los módulos montados. Mercado Negro altera las reglas de una pieza.':'Elegido. Esperando al resto…'}
function resultForMe(s){if(!s.matchWinner||me==null)return false;if(s.matchWinner.type==='player')return s.matchWinner.seat===me;return s.players[me].team===s.matchWinner.team}
function accuracy(p){return p.stats.shots?Math.round(p.stats.hits/p.stats.shots*100):0}
function endUI(s){const o=$('matchOverlay');if(s.phase!=='end'||me==null){o.classList.add('hidden');return}o.classList.remove('hidden');const win=resultForMe(s),p=s.players[me];$('matchTitle').textContent=win?'VICTORIA':'DERROTA';$('matchSubtitle').textContent=win?'Has ganado la partida.':'Has perdido la partida.';$('statDamage').textContent=Math.round(p.stats.damage);$('statAccuracy').textContent=accuracy(p)+'%';$('statKills').textContent=p.stats.kills;$('statPickups').textContent=p.stats.pickups;const ready=!!s.rematch[me],count=s.rematch.filter(Boolean).length,m=modeOf(s);$('rematchBtn').disabled=ready;$('rematchBtn').textContent=ready?'REVANCHA LISTA ✓':'LISTO PARA REVANCHA';$('rematchStatus').textContent=ready?(count===m.players?'Reiniciando…':'Esperando al resto…'):(count?count+' / '+m.players+' ya están listos.':'La revancha empieza cuando todos acepten.')}

function drawGrid(ww,hh){ctx.strokeStyle='#151b2a';ctx.lineWidth=1;for(let x=0;x<ww;x+=48){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,hh);ctx.stroke()}for(let y=0;y<hh;y+=48){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(ww,y);ctx.stroke()}}
function drawArenaScore(s){}
function drawBarrels(p,i){const shown=Math.min(7,p.s.n),perp=p.a+Math.PI/2;for(let k=0;k<shown;k++){const off=(k-(shown-1)/2)*6.5,ox=Math.cos(perp)*off,oy=Math.sin(perp)*off;ctx.strokeStyle=PLAYER_COLORS[i];ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(p.x+ox,p.y+oy);ctx.lineTo(p.x+ox+Math.cos(p.a)*39,p.y+oy+Math.sin(p.a)*39);ctx.stroke()}}
function drawHpAbove(p){
  if(p.fx?.invisible>0&&p.i!==me)return;
  const w=96,h=11,x=p.x-w/2,y=p.y-52,ratio=Math.max(0,p.hp/p.max);ctx.fillStyle='#05070bdd';ctx.fillRect(x-2,y-2,w+4,h+4);ctx.fillStyle=ratio>.45?PLAYER_COLORS[p.i]:(ratio>.2?'#ffd166':'#ff596f');ctx.fillRect(x,y,w*ratio,h);ctx.strokeStyle='#ffffff40';ctx.lineWidth=1.5;ctx.strokeRect(x,y,w,h);ctx.font='900 11px system-ui';ctx.textAlign='center';ctx.fillStyle='#f7f9ff';ctx.fillText(game?.training&&p.i===1?('DUMMY · '+({fixed:'FIJO',free:'LIBRE',tank:'TANQUE'}[game.trainingDummyMode]||'FIJO')):(Math.max(0,Math.ceil(p.hp))+' / '+p.max),p.x,y-6);
  if(p.i===me){
    ctx.font='900 9px system-ui';const c=CHASSIS[p.character]||CHASSIS.mix,sp=SPECIALS[p.loadout?.special]||SPECIALS.atlas,wdef=WEAPONS[p.loadout?.weapon]||WEAPONS.rivet;
    const basic=p.character==='trucks'?(p.fx?.fortify>0?'FORTIFICADO':(p.dc<=0?'FORTIFICAR':p.dc.toFixed(1)+'s')):p.character==='lizzy'?(p.fx?.invisible>0?'INVISIBLE '+p.fx.invisible.toFixed(1)+'s':(p.dc<=0?'INVISIBILIDAD':p.dc.toFixed(1)+'s')):(p.dc<=0?'DASH':p.dc.toFixed(1)+'s');
    let text=wdef.name+' · SPACE '+basic+' · E '+(p.specialCd<=0?sp.name:p.specialCd.toFixed(1)+'s');
    if(wdef.id==='sunline')text+=' · '+(p.weaponLock>0?'SOBRECARGA '+p.weaponLock.toFixed(1)+'s':'CALOR '+Math.round((p.weaponHeat||0)/(p.mod?.heatCap||1)*100)+'%');
    if(p.fx?.overcharge>0)text+=' · NÚCLEO '+p.fx.overcharge.toFixed(1)+'s';
    ctx.fillStyle='#c9d1df';ctx.fillText(text,p.x,y+h+17)
  }
}
function drawMix(p,n){const color=PLAYER_COLORS[p.i];ctx.save();if(p.inv&&Math.floor(n/70)%2===0)ctx.globalAlpha=.38;ctx.shadowColor=color;ctx.shadowBlur=18;ctx.fillStyle=color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#0a0d15';ctx.beginPath();ctx.arc(p.x,p.y,14,0,Math.PI*2);ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();ctx.arc(p.x,p.y,18,0,Math.PI*2);ctx.stroke();drawBarrels(p,p.i);ctx.restore()}
function drawTrucks(p,n){const color=PLAYER_COLORS[p.i];ctx.save();if(p.inv&&Math.floor(n/70)%2===0)ctx.globalAlpha=.38;ctx.translate(p.x,p.y);ctx.rotate(p.a);ctx.shadowColor=color;ctx.shadowBlur=18;ctx.fillStyle='#202833';ctx.fillRect(-27,-22,52,44);ctx.shadowBlur=0;ctx.fillStyle='#0b0f14';ctx.fillRect(-29,-25,50,8);ctx.fillRect(-29,17,50,8);ctx.fillStyle=color;ctx.globalAlpha*=.85;ctx.fillRect(-20,-16,38,32);ctx.globalAlpha=1;ctx.fillStyle='#141a22';ctx.beginPath();ctx.arc(0,0,15,0,Math.PI*2);ctx.fill();const shown=Math.min(6,p.s.n),spread=6.5;ctx.strokeStyle=color;ctx.lineWidth=6;for(let k=0;k<shown;k++){const off=(k-(shown-1)/2)*spread;ctx.beginPath();ctx.moveTo(8,off);ctx.lineTo(39,off);ctx.stroke()}if(p.fx?.fortify>0){ctx.strokeStyle='#dce3eb';ctx.lineWidth=4;ctx.shadowColor='#dce3eb';ctx.shadowBlur=12;ctx.strokeRect(-34,-30,68,60)}ctx.restore()}
function drawLizzy(p,n){const color=PLAYER_COLORS[p.i],hidden=p.fx?.invisible>0;ctx.save();if(hidden&&p.i!==me){ctx.restore();return}ctx.globalAlpha=hidden ? .24 : 1;ctx.translate(p.x,p.y);ctx.rotate(p.a);ctx.shadowColor=color;ctx.shadowBlur=hidden?10:18;ctx.fillStyle='#14121c';ctx.beginPath();ctx.moveTo(23,0);ctx.lineTo(-15,-17);ctx.lineTo(-23,0);ctx.lineTo(-15,17);ctx.closePath();ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=3;ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(15,-4);ctx.lineTo(39,0);ctx.lineTo(15,4);ctx.closePath();ctx.fill();ctx.fillStyle='#f2ecff';ctx.beginPath();ctx.arc(1,0,6,0,Math.PI*2);ctx.fill();ctx.restore()}
function drawMountedWeapon(p,n){
  if(p.fx?.invisible>0&&p.i!==me)return;
  const id=p.loadout?.weapon||'rivet',color=PLAYER_COLORS[p.i];ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a);ctx.strokeStyle=color;ctx.fillStyle='#cfd7e4';ctx.shadowColor=color;ctx.shadowBlur=8;
  if(id==='lance'){ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(58,0);ctx.stroke();ctx.fillRect(50,-6,18,12)}
  else if(id==='scrapshot'){ctx.lineWidth=5;for(const y of[-8,0,8]){ctx.beginPath();ctx.moveTo(9,y*.45);ctx.lineTo(39,y);ctx.stroke()}ctx.fillRect(34,-12,10,24)}
  else if(id==='sunline'){ctx.fillStyle='#ff657b';ctx.fillRect(10,-7,32,14);ctx.fillStyle='#fff';ctx.fillRect(37,-3,10,6)}
  else if(id==='piston'){ctx.fillStyle='#d5b16a';ctx.fillRect(8,-9,34,18);ctx.fillStyle='#ece3c9';ctx.fillRect(38,-14,18,28)}
  else if(id==='grinder'){const a=n*.012;ctx.translate(39,0);ctx.rotate(a);ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-24,0);ctx.lineTo(24,0);ctx.stroke();ctx.beginPath();ctx.arc(0,0,8,0,Math.PI*2);ctx.fill()}
  else{ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(43,0);ctx.stroke();ctx.fillRect(37,-6,10,12)}
  ctx.restore()
}
function drawBladeOrbit(p,n){
  if(p.fx?.bladeStorm<=0||p.fx?.invisible>0&&p.i!==me)return;
  const count=p.mod?.bladeCount||3,r=72*(p.mod?.bladeRadius||1);ctx.save();ctx.translate(p.x,p.y);ctx.strokeStyle='#ff6d80';ctx.fillStyle='#e8edf4';ctx.shadowColor='#ff536c';ctx.shadowBlur=13;
  for(let i=0;i<count;i++){const a=n*.009+i*Math.PI*2/count,x=Math.cos(a)*r,y=Math.sin(a)*r;ctx.save();ctx.translate(x,y);ctx.rotate(a+Math.PI/2);ctx.beginPath();ctx.moveTo(0,-13);ctx.lineTo(5,10);ctx.lineTo(0,16);ctx.lineTo(-5,10);ctx.closePath();ctx.fill();ctx.restore()}ctx.restore()
}
function drawTurret(p,n){if(p.character==='trucks')drawTrucks(p,n);else if(p.character==='lizzy')drawLizzy(p,n);else drawMix(p,n);drawMountedWeapon(p,n);drawBladeOrbit(p,n);if(!(p.fx?.invisible>0&&p.i!==me)&&p.shield){ctx.strokeStyle='#f8fbff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,p.r+10,0,Math.PI*2);ctx.stroke()}if(!(p.fx?.invisible>0&&p.i!==me)&&p.fx.burn>0){ctx.strokeStyle='#ff7a52';ctx.beginPath();ctx.arc(p.x,p.y,p.r+14,0,Math.PI*2);ctx.stroke()}if(!(p.fx?.invisible>0&&p.i!==me)&&p.fx.slow>0){ctx.strokeStyle='#75bfff';ctx.beginPath();ctx.arc(p.x,p.y,p.r+18,0,Math.PI*2);ctx.stroke()}drawHpAbove(p)}
const seenEffects=new Set(),seenFeedback=new Set();
let audioCtx=null;
function ensureAudio(){try{audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();return audioCtx}catch{return null}}
function sound(freq=320,dur=.04,gain=.025,type='square',endFreq=null){const ac=ensureAudio();if(!ac)return;try{const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(freq,ac.currentTime);if(endFreq)o.frequency.exponentialRampToValueAtTime(Math.max(20,endFreq),ac.currentTime+dur);g.gain.setValueAtTime(gain,ac.currentTime);g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+dur);o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+dur)}catch{}}
function noise(dur=.1,gain=.025,cutoff=900){const ac=ensureAudio();if(!ac)return;try{const len=Math.max(1,Math.floor(ac.sampleRate*dur)),buf=ac.createBuffer(1,len,ac.sampleRate),arr=buf.getChannelData(0);for(let i=0;i<len;i++)arr[i]=(Math.random()*2-1)*(1-i/len);const src=ac.createBufferSource(),filter=ac.createBiquadFilter(),g=ac.createGain();src.buffer=buf;filter.type='lowpass';filter.frequency.value=cutoff;g.gain.value=gain;src.connect(filter);filter.connect(g);g.connect(ac.destination);src.start()}catch{}}
function effectSound(e){
  if(e.type==='shot'){sound(170+(e.owner||0)*22,.035,.010,'square',115);return}
  if(e.type==='cannon'){noise(.18,.052,650);sound(82,.22,.045,'sawtooth',42);return}
  if(e.type==='barrel'){noise(.16,.045,900);sound(95,.17,.036,'triangle',48);return}
  if(['explosion','cluster','reactive'].includes(e.type)){noise(.10,.025,1200);sound(125,.10,.018,'triangle',70);return}
  if(e.type==='slash'){sound(720,.07,.028,'sawtooth',180);return}
  if(e.type==='muzzle'){sound(210,.06,.018,'square',120);return}
  if(e.type==='fortify'){sound(92,.10,.025,'triangle',65);return}
  if(e.type==='cloak'){sound(440,.13,.018,'sine',820);return}
  if(e.type==='reveal'){sound(760,.08,.015,'sine',360);return}
  if(e.type==='beam'){sound(560,.045,.008,'sawtooth',510);return}
  if(e.type==='piston'){sound(115,.09,.032,'square',62);noise(.07,.018,700);return}
  if(e.type==='axeSwing'){sound(260,.08,.018,'sawtooth',150);return}
  if(e.type==='mine'){noise(.12,.032,850);sound(105,.12,.025,'triangle',55);return}
  if(e.type==='trinity'){sound(390,.18,.024,'sawtooth',690);return}
}


function drawEffects(s){if(!s?.effects)return;for(const e of s.effects){if(!seenEffects.has(e.id)){seenEffects.add(e.id);effectSound(e);if(seenEffects.size>1400)seenEffects.clear();if(['barrel','cannon'].includes(e.type))shake=Math.max(shake,e.type==='cannon'?24:18)}const t=1-e.life/e.duration,alpha=Math.max(0,e.life/e.duration);ctx.save();
  if(e.type==='slash'){ctx.translate(e.x,e.y);ctx.globalAlpha=alpha;ctx.strokeStyle='#f4efff';ctx.shadowColor='#b7a7ff';ctx.shadowBlur=18;ctx.lineWidth=7*(1-t)+2;ctx.beginPath();ctx.arc(0,0,e.radius*.52,-1.05,1.05);ctx.stroke();ctx.restore();continue}
  if(e.type==='cloak'||e.type==='reveal'){ctx.globalAlpha=alpha*.9;ctx.strokeStyle=e.color;ctx.lineWidth=3;ctx.beginPath();ctx.arc(e.x,e.y,e.radius*(.35+.65*t),0,Math.PI*2);ctx.stroke();ctx.restore();continue}
  if(e.type==='beam'){ctx.globalAlpha=alpha;ctx.strokeStyle=e.color;ctx.shadowColor=e.color;ctx.shadowBlur=18;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x2,e.y2);ctx.stroke();ctx.lineWidth=2;ctx.strokeStyle='#fff4f5';ctx.stroke();ctx.restore();continue}
  if(e.type==='piston'){ctx.globalAlpha=alpha;ctx.strokeStyle=e.color;ctx.lineWidth=12*(1-t)+3;ctx.beginPath();ctx.moveTo(e.x-Math.cos(0)*0,e.y);ctx.arc(e.x,e.y,e.radius*(.35+.6*t),-.55,.55);ctx.stroke();ctx.restore();continue}
  if(e.type==='axeSwing'){ctx.globalAlpha=alpha;ctx.strokeStyle=e.color;ctx.shadowColor=e.color;ctx.shadowBlur=12;ctx.lineWidth=5;ctx.beginPath();ctx.arc(e.x,e.y,e.radius*.78,-2.5+Math.PI*2*t,-.4+Math.PI*2*t);ctx.stroke();ctx.restore();continue}

  ctx.globalCompositeOperation='lighter';const grad=ctx.createRadialGradient(e.x,e.y,0,e.x,e.y,e.radius);grad.addColorStop(0,e.color+'dd');grad.addColorStop(.22,e.color+'88');grad.addColorStop(1,e.color+'00');ctx.globalAlpha=.75*alpha;ctx.fillStyle=grad;ctx.beginPath();ctx.arc(e.x,e.y,e.radius*(.45+.55*t),0,Math.PI*2);ctx.fill();ctx.globalAlpha=alpha;ctx.strokeStyle=e.color;ctx.lineWidth=Math.max(2,8*(1-t));ctx.beginPath();ctx.arc(e.x,e.y,e.radius*(.18+.82*t),0,Math.PI*2);ctx.stroke();const seed=(e.id||'x').split('').reduce((a,ch)=>a+ch.charCodeAt(0),0),count=e.type==='cannon'?18:e.type==='barrel'?14:8;for(let k=0;k<count;k++){const a=(Math.PI*2/count)*k+seed*.013,dist=e.radius*t*(.45+((k*37)%100)/180);ctx.globalAlpha=alpha*.9;ctx.fillStyle=k%2?e.color:'#fff2cc';ctx.beginPath();ctx.arc(e.x+Math.cos(a)*dist,e.y+Math.sin(a)*dist,2+(k%3),0,Math.PI*2);ctx.fill()}ctx.restore()}}
function drawStorm(s){const st=s?.storm;if(!st)return;const remain=st.start-st.elapsed;if(st.active){ctx.save();ctx.fillStyle='rgba(91,38,130,.23)';ctx.beginPath();ctx.rect(0,0,worldW(s),worldH(s));ctx.arc(worldW(s)/2,worldH(s)/2,Math.max(0,st.radius),0,Math.PI*2,true);ctx.fill('evenodd');ctx.strokeStyle='#bd67ff';ctx.shadowColor='#bd67ff';ctx.shadowBlur=16;ctx.lineWidth=4;ctx.beginPath();ctx.arc(worldW(s)/2,worldH(s)/2,st.radius,0,Math.PI*2);ctx.stroke();ctx.restore();ctx.save();ctx.font='900 13px system-ui';ctx.textAlign='center';ctx.fillStyle='#d59aff';ctx.fillText('TORMENTA',worldW(s)/2,54);ctx.restore()}else if(remain<=8&&remain>0){ctx.save();ctx.font='900 13px system-ui';ctx.textAlign='center';ctx.fillStyle='#c79be6';ctx.fillText('TORMENTA EN '+Math.ceil(remain)+' s',worldW(s)/2,54);ctx.restore()}}
function drawPickup(it,n){const d=PICKUPS[it.type],pulse=1+Math.sin(n*.006+it.x*.01)*.08;ctx.save();ctx.translate(it.x,it.y);ctx.scale(pulse,pulse);ctx.shadowColor=d.color;ctx.shadowBlur=18;ctx.fillStyle='#080c13dd';ctx.strokeStyle=d.color;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,22,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle=d.color;ctx.strokeStyle=d.color;ctx.lineWidth=5;ctx.lineCap='round';ctx.lineJoin='round';if(it.type==='heal'){ctx.fillRect(-4,-13,8,26);ctx.fillRect(-13,-4,26,8)}else if(it.type==='haste'){for(const y of [6,-5]){ctx.beginPath();ctx.moveTo(-10,y+7);ctx.lineTo(0,y-3);ctx.lineTo(10,y+7);ctx.stroke()}}else{ctx.beginPath();ctx.moveTo(0,-13);ctx.lineTo(12,-8);ctx.lineTo(10,6);ctx.quadraticCurveTo(0,16,-10,6);ctx.lineTo(-12,-8);ctx.closePath();ctx.fill()}ctx.restore()}
function drawGroundFires(s,n){for(const f of s.fires||[]){const life=f.life/f.maxLife;ctx.save();ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(f.x,f.y,3,f.x,f.y,f.radius);g.addColorStop(0,'rgba(255,205,96,'+(.45*life)+')');g.addColorStop(.5,'rgba(255,94,34,'+(.30*life)+')');g.addColorStop(1,'rgba(255,54,18,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(f.x,f.y,f.radius,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(255,116,52,'+(.55*life)+')';ctx.lineWidth=2;for(let k=0;k<5;k++){const a=k*1.27+n*.0015+f.x*.01,r=f.radius*(.25+(k%3)*.14);ctx.beginPath();ctx.moveTo(f.x+Math.cos(a)*r*.35,f.y+Math.sin(a)*r*.35);ctx.quadraticCurveTo(f.x+Math.cos(a+.3)*r*.7,f.y+Math.sin(a+.3)*r*.7-8,f.x+Math.cos(a)*r,f.y+Math.sin(a)*r);ctx.stroke()}ctx.restore()}}
function drawCore(s,n){if(s.mode!=='core'||!s.core)return;const core=s.core,[cx,cy]=corePoint(s);ctx.save();if(core.active){const pulse=1+Math.sin(n*.007)*.05;ctx.translate(cx,cy);ctx.scale(pulse,pulse);ctx.shadowColor='#7df9ff';ctx.shadowBlur=24;ctx.strokeStyle='#7df9ff';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,92,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle='#7df9ff22';ctx.beginPath();ctx.arc(0,0,82,0,Math.PI*2);ctx.fill();if(core.capturer!=null&&core.progress>0){ctx.strokeStyle=PLAYER_COLORS[core.capturer];ctx.lineWidth=9;ctx.beginPath();ctx.arc(0,0,101,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,core.progress/core.required));ctx.stroke()}ctx.fillStyle='#dffcff';ctx.font='900 12px system-ui';ctx.textAlign='center';ctx.fillText('NÚCLEO',0,4)}else if(core.respawn<=5){ctx.fillStyle='#83cbd4';ctx.font='900 12px system-ui';ctx.textAlign='center';ctx.fillText('NÚCLEO EN '+Math.ceil(core.respawn)+' s',cx,cy)}ctx.restore()}
function drawFeedback(s){for(const f of s.feedback||[]){const first=!seenFeedback.has(f.id);if(first){seenFeedback.add(f.id);if(seenFeedback.size>1400)seenFeedback.clear();if(f.owner===me&&f.type==='hit')sound(f.value>=24?420:300,.045,f.value>=24?.04:.022);if(f.owner===me&&f.type==='elimination')sound(150,.13,.055,'sawtooth');if(f.owner===me&&f.type==='core')sound(620,.12,.04,'sine');if(f.owner===me&&f.type==='rarity'){sound(f.label?.includes('MERCADO NEGRO')?110:520,.34,.045,f.label?.includes('MERCADO NEGRO')?'sawtooth':'sine',f.label?.includes('MERCADO NEGRO')?55:880)}if(f.owner===me&&f.type==='synergy')sound(330,.22,.035,'triangle',660)}const life=Math.max(0,f.life/f.maxLife),rise=(1-life)*28;if(f.type==='hit'&&f.owner===me){ctx.save();ctx.globalAlpha=life;ctx.translate(f.x,f.y-rise);ctx.strokeStyle=f.value>=24?'#ffd166':'#ffffff';ctx.lineWidth=f.value>=24?4:2.5;const d=f.value>=24?12:8;ctx.beginPath();ctx.moveTo(-d,-d);ctx.lineTo(-3,-3);ctx.moveTo(d,-d);ctx.lineTo(3,-3);ctx.moveTo(-d,d);ctx.lineTo(-3,3);ctx.moveTo(d,d);ctx.lineTo(3,3);ctx.stroke();ctx.font=(f.value>=24?'950 20px':'900 14px')+' system-ui';ctx.textAlign='center';ctx.fillStyle=f.value>=24?'#ffd166':'#f7f9ff';ctx.fillText(Math.round(f.value),0,-16);ctx.restore()}else if(f.type==='elimination'&&(f.owner===me||f.target===me)){ctx.save();ctx.globalAlpha=Math.min(1,life*1.8);ctx.font='950 30px system-ui';ctx.textAlign='center';ctx.fillStyle=f.owner===me?'#ffd166':'#ff596f';ctx.fillText(f.owner===me?'ELIMINACIÓN':'ELIMINADO',worldW(s)/2,worldH(s)*.22);ctx.restore()}else if(f.type==='core'&&f.owner===me){ctx.save();ctx.globalAlpha=life;ctx.font='950 28px system-ui';ctx.textAlign='center';ctx.fillStyle='#7df9ff';ctx.fillText('SOBRECARGA',worldW(s)/2,worldH(s)*.28);ctx.restore()}else if((f.type==='rarity'||f.type==='synergy')&&f.owner===me){ctx.save();ctx.globalAlpha=Math.min(1,life*1.5);ctx.textAlign='center';ctx.font='950 13px system-ui';ctx.fillStyle=f.type==='synergy'?'#7df9ff':(f.label?.includes('MERCADO NEGRO')?'#ff4f68':'#ffbf55');ctx.fillText(f.type==='synergy'?'SINERGIA ACTIVADA':'MEJORA ESPECIAL',worldW(s)/2,worldH(s)*.20);ctx.font='950 30px system-ui';ctx.fillText(f.label||'',worldW(s)/2,worldH(s)*.20+38);ctx.restore()}}}
function drawKillfeed(s){const list=(s.killfeed||[]).slice(0,4);if(!list.length)return;ctx.save();ctx.textAlign='right';let y=82;for(const k of list){const killer=k.killer==null?'ENTORNO':(s.players[k.killer]?.name||('P'+(k.killer+1))),victim=s.players[k.victim]?.name||('P'+(k.victim+1)),alpha=Math.min(1,k.life/.5);ctx.globalAlpha=alpha;ctx.font='900 11px system-ui';const text=killer+'  →  '+victim,w=ctx.measureText(text).width+18,x=worldW(s)-58;ctx.fillStyle='#070a11cc';ctx.fillRect(x-w,y-15,w,24);ctx.fillStyle=k.killer==null?'#9ba5b7':PLAYER_COLORS[k.killer];ctx.fillText(killer,x-ctx.measureText('  →  '+victim).width,y);ctx.fillStyle='#758198';ctx.fillText('  →  ',x-ctx.measureText(victim).width,y);ctx.fillStyle=PLAYER_COLORS[k.victim]||'#fff';ctx.fillText(victim,x,y);y+=29}ctx.restore()}
function drawMine(m,n){
  const armed=m.arm<=0,pulse=1+Math.sin(n*.01+m.x)*.05;ctx.save();ctx.translate(m.x,m.y);ctx.scale(pulse,pulse);ctx.shadowColor=armed?'#ffcf5c':'#7d8797';ctx.shadowBlur=armed?10:3;ctx.fillStyle='#171b22';ctx.strokeStyle=armed?'#ffcf5c':'#7d8797';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,0,m.r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle=armed?'#ffcf5c':'#7d8797';ctx.beginPath();ctx.arc(0,0,4,0,Math.PI*2);ctx.fill();ctx.restore()
}
function drawBarrel(b){if(!b.alive)return;ctx.save();ctx.shadowColor='#ff643f';ctx.shadowBlur=12;ctx.fillStyle='#8d2f24';ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#ff9b61';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#1a0d0b';ctx.font='900 18px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('!',b.x,b.y+1);ctx.restore()}
function draw(s,n){ctx.clearRect(0,0,W,H);const map=MAPS[s?.map||0],ww=map.w||W,hh=map.h||H,sx=W/ww,sy=H/hh;ctx.save();ctx.scale(sx,sy);const grad=ctx.createLinearGradient(0,0,ww,hh);grad.addColorStop(0,map.bg);grad.addColorStop(1,'#07090f');ctx.fillStyle=grad;ctx.fillRect(0,0,ww,hh);drawGrid(ww,hh);ctx.strokeStyle='#303a52';ctx.lineWidth=2;ctx.strokeRect(48,48,ww-96,hh-96);for(const o of map.obs){ctx.fillStyle='#121827';ctx.fillRect(o.x,o.y,o.w,o.h);ctx.strokeStyle='#303a52';ctx.strokeRect(o.x,o.y,o.w,o.h)}if(s){drawStorm(s);drawCore(s,n);s.barrels.forEach(drawBarrel);(s.mines||[]).forEach(m=>drawMine(m,n));(s.pickups||[]).forEach(it=>drawPickup(it,n));drawGroundFires(s,n);s.bullets.forEach(b=>{const bc=b.groundFire?'#ff793f':b.special?'#ffd19a':b.fire?'#ff7a52':b.frost?'#75bfff':b.shock?'#ffe26f':PLAYER_COLORS[b.owner];ctx.save();ctx.shadowColor=bc;ctx.shadowBlur=(b.special||b.groundFire)?24:12;if(b.special){const g=ctx.createRadialGradient(b.x-5,b.y-5,2,b.x,b.y,b.r);g.addColorStop(0,'#fff8dc');g.addColorStop(.35,'#ffc15c');g.addColorStop(1,'#7c351c');ctx.fillStyle=g}else ctx.fillStyle=bc;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();if(b.special){ctx.strokeStyle='#fff0c2';ctx.lineWidth=3;ctx.stroke()}ctx.restore()});drawEffects(s);s.players.forEach(p=>{if(p.alive)drawTurret(p,n)});drawFeedback(s);drawKillfeed(s)}ctx.restore()}
function frame(n){const dt=Math.min(.05,(n-lastFrame)/1000);lastFrame=n;if(trainingActive&&game){sim(dt);view=game}else if(!host&&conn?.open&&me!=null){sendAccumulator+=dt;if(sendAccumulator>.033){sendAccumulator=0;conn.send({type:'input',k:mine})}}const s=trainingActive?game:(host?game:view);if(shake){ctx.save();ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);shake*=.8;draw(s,n);ctx.restore()}else draw(s,n);syncUI(s);requestAnimationFrame(frame)}

function pointerPos(e){const r=cv.getBoundingClientRect(),state=trainingActive?game:(host?game:view),ww=state?worldW(state):W,hh=state?worldH(state):H;mine.ax=(e.clientX-r.left)*ww/r.width;mine.ay=(e.clientY-r.top)*hh/r.height}
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;if(['KeyW','KeyA','KeyS','KeyD','Space','KeyE'].includes(e.code))e.preventDefault();if(e.code==='KeyW')mine.u=1;if(e.code==='KeyS')mine.d=1;if(e.code==='KeyA')mine.l=1;if(e.code==='KeyD')mine.r=1;if(e.code==='Space')mine.dash=1;if(e.code==='KeyE')mine.special=1},{passive:false});
addEventListener('keyup',e=>{if(e.code==='KeyW')mine.u=0;if(e.code==='KeyS')mine.d=0;if(e.code==='KeyA')mine.l=0;if(e.code==='KeyD')mine.r=0;if(e.code==='Space')mine.dash=0;if(e.code==='KeyE')mine.special=0});
cv.onpointermove=pointerPos;cv.addEventListener('pointerdown',()=>{try{ensureAudio()?.resume?.()}catch{}},{once:true});cv.onpointerdown=e=>{pointerPos(e);if(e.button===0)mine.fire=1};addEventListener('pointerup',()=>mine.fire=0);addEventListener('blur',()=>{mine.u=mine.d=mine.l=mine.r=mine.fire=mine.dash=mine.special=0});

function showLobbyView(name='home'){
  const map={home:'lobbyHome',hangar:'lobbyHangar',friends:'lobbyFriends',rooms:'lobbyRooms',ranking:'lobbyRanking',history:'lobbyHistory'};
  for(const id of Object.values(map))$(id)?.classList.toggle('hidden',id!==map[name]);
  if(name==='hangar')renderGarage();
}
for(const b of document.querySelectorAll('.mode-card'))b.addEventListener('click',()=>{selectedMode=b.dataset.mode;document.querySelectorAll('.mode-card').forEach(x=>x.classList.toggle('selected',x===b));renderGarage()});
for(const b of document.querySelectorAll('[data-garage-slot]'))b.addEventListener('click',()=>openModulePicker(b.dataset.garageSlot,'garage'));
for(const b of document.querySelectorAll('[data-ready-slot]'))b.addEventListener('click',()=>openModulePicker(b.dataset.readySlot,'ready'));
$('garageChassisPrev').onclick=()=>garageCycle(-1);$('garageChassisNext').onclick=()=>garageCycle(1);
$('readyChassisPrev').onclick=()=>readyCycleChassis(-1);$('readyChassisNext').onclick=()=>readyCycleChassis(1);
$('modulePickerClose').onclick=closeModulePicker;$('modulePicker').addEventListener('pointerdown',e=>{if(e.target===$('modulePicker'))closeModulePicker()});
$('friendPickerClose').onclick=()=>$('friendPicker').classList.add('hidden');
$('friendPicker').addEventListener('pointerdown',e=>{if(e.target===$('friendPicker'))$('friendPicker').classList.add('hidden')});
$('inviteFriendBtn').onclick=()=>{if(typeof frRenderSocial==='function')frRenderSocial();$('friendPicker').classList.remove('hidden')};
$('editProfileBtn').onclick=()=>$('profileEdit').classList.toggle('hidden');
for(const b of document.querySelectorAll('[data-lobby-view]'))b.onclick=()=>showLobbyView(b.dataset.lobbyView);
for(const b of document.querySelectorAll('[data-lobby-home]'))b.onclick=()=>showLobbyView('home');
$('hostBtn').onclick=()=>{if(!garageCanQueue()){status('Completa una máquina válida.',true);return}$('roomVisibility').value='private';setQueueIntent('friendly');hostGame()};
$('joinForm').onsubmit=e=>{e.preventDefault();setQueueIntent('friendly');joinGame($('roomInput').value)};
$('roomInput').oninput=e=>e.target.value=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);
$('leaveBtn').onclick=()=>{const u=new URL(location.href);u.searchParams.delete('room');history.replaceState({},'',u);setQueueIntent('idle');clean();renderGarage();showLobbyView('home')};
$('copyBtn').onclick=async()=>{const u=new URL(location.href);u.searchParams.set('room',code);try{await navigator.clipboard.writeText(u.toString());$('copyBtn').textContent='COPIADO';setTimeout(()=>$('copyBtn').textContent='COPIAR ENLACE',1200)}catch{prompt('Copia el enlace:',u.toString())}};
$('readyBtn').onclick=()=>{if(me==null)return;const state=host?game:view,p=state?.players?.[me];if(p&&loadoutValid(p)){garageBuild={character:p.character,loadout:clone(p.loadout)};saveGarageBuild()}if(host)setReady(me,'ready');else conn?.send({type:'ready'})};
$('rematchBtn').onclick=()=>{if(me==null)return;if(host)setReady(me,'rematch');else conn?.send({type:'rematch'})};
$('testRangeBtn').onclick=startTestRange;
$('trainingExitBtn').onclick=exitTestRange;
$('trainingResetBtn').onclick=resetTrainingMetrics;
$('trainingDummyBtn').onclick=cycleTrainingDummy;
$('trainingCooldownBtn').onclick=()=>{if(game?.training){game.trainingNoCooldowns=!game.trainingNoCooldowns;renderTrainingHud(game)}};
$('trainingUpgradesBtn').onclick=()=>{$('trainingUpgrades').classList.toggle('hidden');renderTrainingUpgradePanel()};
$('trainingUpgradesClose').onclick=()=>$('trainingUpgrades').classList.add('hidden');
$('trainingClearUpgrades').onclick=()=>rebuildTrainingMachine({});
$('trainingSaveA').onclick=()=>saveTrainingSlot('A');$('trainingSaveB').onclick=()=>saveTrainingSlot('B');
$('trainingLoadA').onclick=()=>loadTrainingSlot('A');$('trainingLoadB').onclick=()=>loadTrainingSlot('B');
$('fullscreenBtn').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('canvasFrame').requestFullscreen()}catch(e){console.warn(e)}};
document.addEventListener('fullscreenchange',()=>{$('fullscreenBtn').textContent=document.fullscreenElement?'SALIR DE PANTALLA COMPLETA':'PANTALLA COMPLETA'});
renderGarage();showLobbyView('home');
const invite=new URL(location.href).searchParams.get('room');if(invite)$('roomInput').value=invite.toUpperCase().slice(0,6);
if(typeof Peer==='undefined')status('No se pudo cargar la conexión online. Recarga.',true);else if(invite){setQueueIntent('friendly');setTimeout(()=>joinGame(invite),0);}
requestAnimationFrame(frame);