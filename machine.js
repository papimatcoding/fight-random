'use strict';

/*
  Machine loadout layer.
  Chassis = movement/survivability + SPACE ability.
  Weapon = primary fire.
  Special = E.
  System = passive.
  This file intentionally sits after engine.js and before network/game.js.
*/

RARITY_LABEL.common='BÁSICO';
RARITY_LABEL.illegal='MERCADO NEGRO';
RARITY_LABEL.fusion='FUSIÓN';

const CHASSIS={
  mix:{id:'mix',name:'MIX',hp:155,largeHp:170,speed:225,radius:22,capacity:10,ability:'DASH',weight:'medium'},
  trucks:{id:'trucks',name:'TRUCKS',hp:212,largeHp:227,speed:160,radius:26,capacity:14,ability:'FORTIFICAR',weight:'heavy'},
  lizzy:{id:'lizzy',name:'LIZZY',hp:140,largeHp:155,speed:258,radius:19,capacity:7,ability:'INVISIBILIDAD',weight:'light'}
};

const WEAPONS={
  rivet:{id:'rivet',name:'RIVET-9',cost:2,range:650,class:'light',chassis:['mix','trucks','lizzy'],desc:'Torreta estándar. Fiable, rápida y barata.',rate:.48,damage:9.5,speed:610,size:5.8,recoil:10},
  lance:{id:'lance',name:'LANCE-50',cost:4,range:1100,class:'heavy',chassis:['mix','trucks'],desc:'Francotirador de enorme alcance. Castiga cada fallo con una recarga larga.',rate:1.32,damage:31,speed:980,size:6,recoil:82},
  scrapshot:{id:'scrapshot',name:'SCRAPSHOT',cost:3,range:320,class:'medium',chassis:['mix','trucks','lizzy'],desc:'Escopeta de seis fragmentos. Brutal pegado, mediocre a distancia.',rate:.78,damage:4.2,speed:570,size:4.8,recoil:54,pellets:6,spread:.42},
  sunline:{id:'sunline',name:'SUNLINE',cost:4,range:720,class:'medium',chassis:['mix','trucks','lizzy'],desc:'Haz continuo. Acumula calor hasta forzar una sobrecarga.',rate:.08,damage:2.45,recoil:3,heat:.058},
  piston:{id:'piston',name:'PISTON',cost:3,range:108,class:'medium',chassis:['mix','trucks','lizzy'],desc:'Puñetazo hidráulico frontal. Muchísimo retroceso para ambos.',rate:.78,damage:18,recoil:125,knock:520,arc:.76},
  grinder:{id:'grinder',name:'GRINDER',cost:4,range:142,class:'heavy',chassis:['mix','trucks'],desc:'Hacha rotatoria de corto alcance para presión sostenida.',rate:.58,damage:14.5,recoil:20,knock:210}
};

const SPECIALS={
  atlas:{id:'atlas',name:'ATLAS SHELL',cost:4,cd:7.5,desc:'Proyectil enorme, explosión y retroceso.',chassis:['mix','trucks','lizzy']},
  helltrail:{id:'helltrail',name:'HELLTRAIL',cost:4,cd:9,desc:'Secuencia incendiaria que corta rutas con fuego.',chassis:['mix','trucks','lizzy']},
  shiv:{id:'shiv',name:'SHIV',cost:3,cd:5.8,desc:'Corte frontal corto con alto daño instantáneo.',chassis:['mix','trucks','lizzy']},
  deadtrack:{id:'deadtrack',name:'DEAD TRACK',cost:3,cd:7,desc:'Deja cuatro minas temporales tras tu máquina.',chassis:['mix','trucks','lizzy']},
  hound:{id:'hound',name:'HOUND PACK',cost:5,cd:10,desc:'Micromisiles con guiado moderado. Presionan, no garantizan impacto.',chassis:['mix','trucks','lizzy']},
  trinity:{id:'trinity',name:'TRINITY DRIVE',cost:5,cd:11,desc:'Acelera la máquina y despliega tres cuchillas orbitales.',chassis:['mix','trucks','lizzy']}
};

const SYSTEMS={
  plating:{id:'plating',name:'PLACAS',cost:2,desc:'Reduce un 10% el daño recibido.'},
  siphon:{id:'siphon',name:'SIFÓN',cost:2,desc:'Recupera un 5% del daño infligido.'},
  overclock:{id:'overclock',name:'OVERCLOCK',cost:2,desc:'Aumenta un 10% la cadencia del arma.'},
  servos:{id:'servos',name:'SERVOS',cost:1,desc:'Aumenta un 8% la velocidad.'},
  cooling:{id:'cooling',name:'REFRIGERACIÓN',cost:2,desc:'Reduce un 12% los CD y mejora la disipación del láser.'},
  stabilizer:{id:'stabilizer',name:'ESTABILIZADOR',cost:1,desc:'Reduce el retroceso propio y el empuje recibido.'}
};

const DEFAULT_LOADOUT={
  mix:{weapon:'rivet',special:'atlas',system:'overclock'},
  trucks:{weapon:'rivet',special:'helltrail',system:'plating'},
  lizzy:{weapon:'rivet',special:'shiv',system:'servos'}
};

function moduleCost(loadout){
  return (WEAPONS[loadout?.weapon]?.cost||0)+(SPECIALS[loadout?.special]?.cost||0)+(SYSTEMS[loadout?.system]?.cost||0);
}
function moduleAllowed(chassis,def){return !!def&&(!def.chassis||def.chassis.includes(chassis))}
function loadoutValid(p,loadout=p.loadout){
  const c=CHASSIS[p.character]||CHASSIS.mix;
  return !!WEAPONS[loadout?.weapon]&&!!SPECIALS[loadout?.special]&&!!SYSTEMS[loadout?.system]&&
    moduleAllowed(p.character,WEAPONS[loadout.weapon])&&moduleAllowed(p.character,SPECIALS[loadout.special])&&
    moduleCost(loadout)<=c.capacity;
}
function loadoutSummary(p){
  const l=p.loadout||DEFAULT_LOADOUT[p.character]||DEFAULT_LOADOUT.mix;
  return (WEAPONS[l.weapon]?.name||'?')+' · '+(SPECIALS[l.special]?.name||'?')+' · '+(SYSTEMS[l.system]?.name||'?');
}

function machineBaseStats(id){
  const c=CHASSIS[id]||CHASSIS.mix;
  const common={spd:c.speed,shield:0,leech:0,damageReduction:0,knockTaken:1,dash:0,dc:0,dashWave:0,overdrive:0,
    fortifyReduction:0,fortifyDuration:0,fortifySlow:1,reactive:0,invisDuration:0,invisSpeed:1,predator:0,
    slashRange:112,slashDamage:30,slashArc:.78,execution:0,napalmRadius:42,napalmLife:4.6,firestorm:0,
    specialRadius:124,specialKnock:360,cluster:0};
  if(id==='trucks')Object.assign(common,{dc:5,fortifyReduction:.42,fortifyDuration:1.45,fortifySlow:.60});
  else if(id==='lizzy')Object.assign(common,{dc:5.4,invisDuration:1.85,invisSpeed:1.16});
  else Object.assign(common,{dc:1.9,dash:610});
  return common;
}
characterStats=machineBaseStats;
characterHp=function(id,mode){const c=CHASSIS[id]||CHASSIS.mix;return mode.players>2?c.largeHp:c.hp};

function blankMachineMods(){return{
  weaponDamage:1,weaponRate:1,weaponRange:1,recoil:1,spread:1,pellets:0,bounces:0,weaponFire:0,
  heatCap:1,heatGain:1,heatCool:1,laserRedline:0,pistonKnock:1,grinderRange:1,grinderDamage:1,
  specialCd:1,specialDamage:1,atlasRadius:1,atlasCluster:0,hellRadius:1,hellLife:1,hellRows:1,
  shivRange:1,shivDamage:1,shivExecute:0,mineCount:4,mineDamage:1,mineRadius:1,mineLife:6.5,
  missileCount:4,missileHoming:1,missileDamage:1,bladeDuration:1,bladeRadius:1,bladeCount:3,
  bladeDamage:1,rivetBreaker:0,sunPurge:0,pistonRecovery:0,grinderGuard:0,
  fusionCryo:0,fusionDragon:0,fusionSiege:0,fusionCrown:0,fusionPlatform:0,fusionSwarm:0
}}

function applySystem(p){
  const sys=p.loadout?.system;
  if(sys==='plating')p.s.damageReduction=.10;
  if(sys==='siphon')p.s.leech=.05;
  if(sys==='overclock')p.mod.weaponRate*=.90;
  if(sys==='servos')p.s.spd*=1.08;
  if(sys==='cooling'){p.mod.specialCd*=.88;p.mod.heatCool*=1.25}
  if(sys==='stabilizer'){p.mod.recoil*=.65;p.s.knockTaken=.80}
}
function resetMachineStats(p){
  p.s=machineBaseStats(p.character);
  p.mod=blankMachineMods();
  applySystem(p);
}

const legacyMakePlayer=makePlayer;
makePlayer=function(i,mode){
  const p=legacyMakePlayer(i,mode),load=clone(DEFAULT_LOADOUT[p.character]||DEFAULT_LOADOUT.mix);
  p.loadout=load;p.mod=blankMachineMods();p.weaponHeat=0;p.weaponLock=0;p.synergies=[];p.powers={};
  resetMachineStats(p);p.max=characterHp(p.character,mode);p.hp=p.max;p.r=CHASSIS[p.character].radius;
  return p
};

const legacyMakeGame=makeGame;
makeGame=function(modeId){const g=legacyMakeGame(modeId);g.mines=[];return g};

function setLoadout(i,slot,id){
  if(!host||game.phase!=='ready'||!game.connected[i]||game.ready[i])return false;
  const p=game.players[i],table=slot==='weapon'?WEAPONS:(slot==='special'?SPECIALS:(slot==='system'?SYSTEMS:null));
  if(!table?.[id]||!moduleAllowed(p.character,table[id]))return false;
  p.loadout={...(p.loadout||DEFAULT_LOADOUT[p.character]),[slot]:id};
  resetMachineStats(p);broadcast(true);return true
}

setCharacter=function(i,id){
  if(!host||game.phase!=='ready'||!game.connected[i]||game.ready[i]||!CHASSIS[id])return;
  const p=game.players[i],m=modeOf(),c=CHASSIS[id];
  p.character=id;p.loadout=clone(DEFAULT_LOADOUT[id]);p.max=characterHp(id,m);p.hp=p.max;p.r=c.radius;p.powers={};p.synergies=[];
  p.weaponHeat=0;p.weaponLock=0;p.specialCd=0;p.dc=0;p.fx={burn:0,burnDps:0,burnOwner:null,slow:0,slowFactor:1,shock:0,haste:0,fortify:0,reactiveReady:0,invisible:0,overcharge:0,bladeStorm:0,bladeTick:0};
  resetMachineStats(p);broadcast(true)
};

resetRoomAfterDisconnect=function(){
  if(!host||!game)return;
  const mode=game.mode,oldConnected=game.connected.slice(),oldPlayers=game.players.map(p=>({name:p.name,character:p.character,loadout:clone(p.loadout)}));
  game=makeGame(mode);game.connected[0]=true;
  for(const [seat,c] of hostConnections)game.connected[seat]=!!c.open;
  for(let i=0;i<oldConnected.length;i++){
    if(i===0)game.connected[i]=true;
    if(oldPlayers[i]){game.players[i].name=oldPlayers[i].name;game.players[i].character=oldPlayers[i].character;game.players[i].loadout=oldPlayers[i].loadout;game.players[i].max=characterHp(oldPlayers[i].character,modeOf());game.players[i].hp=game.players[i].max;game.players[i].r=CHASSIS[oldPlayers[i].character].radius;resetMachineStats(game.players[i])}
  }
  view=game;broadcast(true)
};

setReady=function(i,kind){
  if(!host||!game.connected[i])return;
  if(kind==='ready'&&game.phase==='ready'){
    if(!loadoutValid(game.players[i]))return;
    game.ready[i]=true;if(allReady(game.ready))startRound(true);broadcast(true)
  }
  if(kind==='rematch'&&game.phase==='end'){
    game.rematch[i]=true;
    if(allReady(game.rematch)){
      const mode=game.mode,saved=game.players.map(p=>({character:p.character,loadout:clone(p.loadout),name:p.name}));
      game=makeGame(mode);
      for(let s=0;s<modeOf().players;s++){
        game.connected[s]=s===0||!!hostConnections.get(s)?.open;
        const src=saved[s];game.players[s].name=src?.name||('P'+(s+1));game.players[s].character=src?.character||'mix';game.players[s].loadout=clone(src?.loadout||DEFAULT_LOADOUT[game.players[s].character]);game.players[s].max=characterHp(game.players[s].character,modeOf());game.players[s].hp=game.players[s].max;game.players[s].r=CHASSIS[game.players[s].character].radius;resetMachineStats(game.players[s])
      }
      game.ready=game.connected.slice();startRound(true)
    }
    broadcast(true)
  }
};

const legacyStartRound=startRound;
startRound=function(first=false){
  legacyStartRound(first);
  game.mines=[];
  for(const p of game.players){
    p.weaponHeat=0;p.weaponLock=0;p.fx.bladeStorm=0;p.fx.bladeTick=0;
    resetMachineStats(p);
    // Re-apply permanent round upgrades after base/system reset.
    for(const [id,count] of Object.entries(p.powers||{})){
      const d=GENERAL[id];if(!d?.apply)continue;
      for(let n=0;n<count;n++)d.apply(p,game,true)
    }
    p.hp=p.max;
  }
  broadcast(true)
};

for(const k of Object.keys(GENERAL))delete GENERAL[k];
for(const k of Object.keys(ABILITY_UPGRADES))delete ABILITY_UPGRADES[k];
for(const c of Object.values(CHARACTERS))c.abilityUpgrades={legendary:[],illegal:[]};
SYNERGIES.length=0;

function req(slot,id){return p=>p.loadout?.[slot]===id}
function addUpgrade(id,name,desc,rarity,max,eligible,apply){GENERAL[id]={name,desc,rarity,max,eligible,apply}}

// RIVET-9
addUpgrade('rivet_feed','Motor de alimentación','RIVET-9 cicla un 11% más rápido.','common',2,req('weapon','rivet'),p=>p.mod.weaponRate*=.89);
addUpgrade('rivet_heavy','Remaches densos','Más daño y un poco más de retroceso propio.','rare',2,req('weapon','rivet'),p=>{p.mod.weaponDamage*=1.13;p.mod.recoil*=1.08});
addUpgrade('rivet_split','Receptor dividido','RIVET-9 dispara un proyectil adicional con ligera apertura.','epic',1,req('weapon','rivet'),p=>p.mod.pellets++);
addUpgrade('rivet_breaker','Remache de ruptura','Cada quinto ciclo dispara un remache pesado de daño aumentado.','epic',1,req('weapon','rivet'),p=>p.mod.rivetBreaker=1);

// LANCE-50
addUpgrade('lance_chamber','Cámara larga','Aumenta daño y alcance del LANCE-50.','common',2,req('weapon','lance'),p=>{p.mod.weaponDamage*=1.10;p.mod.weaponRange*=1.08});
addUpgrade('lance_brake','Freno de boca','Reduce mucho el retroceso propio del LANCE-50.','rare',1,req('weapon','lance'),p=>p.mod.recoil*=.58);
addUpgrade('lance_unsafe','Carga sin homologar','Disparo mucho más violento: +38% daño, +30% retroceso.','illegal',1,req('weapon','lance'),p=>{p.mod.weaponDamage*=1.38;p.mod.recoil*=1.30});

// SCRAPSHOT
addUpgrade('scrap_choke','Estrangulador','Reduce la dispersión de SCRAPSHOT.','common',2,req('weapon','scrapshot'),p=>p.mod.spread*=.82);
addUpgrade('scrap_pellet','Tambor fragmentario','Añade un fragmento por disparo.','rare',2,req('weapon','scrapshot'),p=>p.mod.pellets++);
addUpgrade('scrap_dragon','Carga térmica','Los fragmentos aplican una quemadura breve.','epic',1,req('weapon','scrapshot'),p=>p.mod.weaponFire=1);

// SUNLINE
addUpgrade('sun_sink','Disipador cerámico','Más margen térmico y mejor refrigeración.','common',2,req('weapon','sunline'),p=>{p.mod.heatCap*=1.16;p.mod.heatCool*=1.14});
addUpgrade('sun_focus','Lente focal','Aumenta daño y alcance del haz.','rare',2,req('weapon','sunline'),p=>{p.mod.weaponDamage*=1.10;p.mod.weaponRange*=1.08});
addUpgrade('sun_purge','Purga de emergencia','Al sobrecalentarse, SUNLINE descarga una onda defensiva alrededor de la máquina.','epic',1,req('weapon','sunline'),p=>p.mod.sunPurge=1);
addUpgrade('sun_redline','Lente Redline','Por encima del 70% de calor el haz causa mucho más daño, pero se calienta antes.','illegal',1,req('weapon','sunline'),p=>{p.mod.laserRedline=1;p.mod.heatGain*=1.18});

// PISTON
addUpgrade('piston_hyd','Hidráulica reforzada','Más daño para PISTON.','common',2,req('weapon','piston'),p=>p.mod.weaponDamage*=1.13);
addUpgrade('piston_recovery','Retorno hidráulico','Conectar PISTON recupera parte de la habilidad del chasis.','rare',1,req('weapon','piston'),p=>p.mod.pistonRecovery=1);
addUpgrade('piston_shock','Cabezal de impacto','Aumenta brutalmente el empuje del puñetazo.','epic',1,req('weapon','piston'),p=>p.mod.pistonKnock*=1.35);
addUpgrade('piston_double','Doble carrera','PISTON recupera el golpe mucho antes.','illegal',1,req('weapon','piston'),p=>p.mod.weaponRate*=.66);

// GRINDER
addUpgrade('grinder_shaft','Eje extendido','Aumenta el alcance del hacha.','common',2,req('weapon','grinder'),p=>p.mod.grinderRange*=1.12);
addUpgrade('grinder_edge','Dientes de carburo','Aumenta el daño de GRINDER.','rare',2,req('weapon','grinder'),p=>p.mod.grinderDamage*=1.12);
addUpgrade('grinder_guard','Pantalla de chispas','Durante cada barrido de GRINDER recibes menos daño durante un instante.','epic',1,req('weapon','grinder'),p=>p.mod.grinderGuard=1);
addUpgrade('grinder_twin','Rotor gemelo','Dos pasadas por ciclo con daño individual reducido.','legendary',1,req('weapon','grinder'),p=>p.mod.pellets++);

// Specials
addUpgrade('atlas_siege','Recámara de asedio','ATLAS SHELL gana radio y reduce recarga.','legendary',1,req('special','atlas'),p=>{p.mod.atlasRadius*=1.20;p.mod.specialCd*=.84});
addUpgrade('atlas_cluster','Carga de racimo','ATLAS SHELL genera tres detonaciones secundarias.','illegal',1,req('special','atlas'),p=>p.mod.atlasCluster=1);
addUpgrade('hell_napalm','Compuesto de napalm','HELLTRAIL deja zonas mayores y más duraderas.','legendary',1,req('special','helltrail'),p=>{p.mod.hellRadius*=1.22;p.mod.hellLife*=1.35});
addUpgrade('hell_manifold','Colector doble','HELLTRAIL lanza dos líneas paralelas.','illegal',1,req('special','helltrail'),p=>p.mod.hellRows=2);
addUpgrade('shiv_edge','Hoja extendida','SHIV gana alcance y daño.','legendary',1,req('special','shiv'),p=>{p.mod.shivRange*=1.20;p.mod.shivDamage*=1.16});
addUpgrade('shiv_exec','Protocolo de ejecución','SHIV causa daño adicional por debajo del 35% de vida.','illegal',1,req('special','shiv'),p=>p.mod.shivExecute=1);
addUpgrade('mine_pack','Carga compactada','Las minas ganan radio y daño.','legendary',1,req('special','deadtrack'),p=>{p.mod.mineDamage*=1.20;p.mod.mineRadius*=1.15});
addUpgrade('mine_black','Lote fantasma','DEAD TRACK deja dos minas adicionales. Siguen caducando.','illegal',1,req('special','deadtrack'),p=>p.mod.mineCount+=2);
addUpgrade('hound_bus','Bus de objetivos','Los misiles corrigen mejor su trayectoria.','legendary',1,req('special','hound'),p=>p.mod.missileHoming*=1.35);
addUpgrade('hound_breach','Jaula abierta','HOUND PACK lanza dos misiles adicionales.','illegal',1,req('special','hound'),p=>p.mod.missileCount+=2);
addUpgrade('trinity_ring','Anillo sin fricción','TRINITY DRIVE dura más y aumenta el radio orbital.','legendary',1,req('special','trinity'),p=>{p.mod.bladeDuration*=1.24;p.mod.bladeRadius*=1.14});
addUpgrade('trinity_fourth','Cuarta cuchilla','TRINITY DRIVE añade una cuarta cuchilla.','illegal',1,req('special','trinity'),p=>p.mod.bladeCount++);

// Chassis
addUpgrade('mix_vector','Vector reforzado','El Dash gana impulso, reduce recarga y libera una onda al terminar.','legendary',1,p=>p.character==='mix',p=>{p.s.dash*=1.20;p.s.dc*=.84;p.s.dashWave=1});
addUpgrade('mix_overdrive','Propulsor de mercado negro','Reduce agresivamente la recarga del Dash.','illegal',1,p=>p.character==='mix',p=>p.s.overdrive=1);
addUpgrade('trucks_laminate','Blindaje laminado','Fortificar reduce más daño y dura más.','legendary',1,p=>p.character==='trucks',p=>{p.s.fortifyReduction=.58;p.s.fortifyDuration+=.40});
addUpgrade('trucks_reactive','Blindaje reactivo','El primer impacto durante Fortificar libera una onda de empuje.','illegal',1,p=>p.character==='trucks',p=>p.s.reactive=1);
addUpgrade('lizzy_adaptive','Camuflaje adaptativo','Invisibilidad dura más y acelera más a LIZZY.','legendary',1,p=>p.character==='lizzy',p=>{p.s.invisDuration+=.55;p.s.invisSpeed*=1.09;p.s.dc*=.86});
addUpgrade('lizzy_predator','Depredadora','Salir de invisibilidad con SHIV potencia el golpe y devuelve recarga si conecta.','illegal',1,p=>p.character==='lizzy'&&p.loadout?.special==='shiv',p=>p.s.predator=1);

// Systems
addUpgrade('sys_plating','Segunda capa','PLACAS aumenta su reducción de daño.','rare',1,req('system','plating'),p=>p.s.damageReduction+=.05);
addUpgrade('sys_siphon','Sifón profundo','SIFÓN roba un 2.5% adicional.','rare',1,req('system','siphon'),p=>p.s.leech+=.025);
addUpgrade('sys_clock','Reloj forzado','OVERCLOCK aumenta aún más la cadencia, con más retroceso.','epic',1,req('system','overclock'),p=>{p.mod.weaponRate*=.90;p.mod.recoil*=1.10});
addUpgrade('sys_servos','Servos afinados','SERVOS añade un 6% adicional de velocidad.','rare',1,req('system','servos'),p=>p.s.spd*=1.06);
addUpgrade('sys_cooling','Líneas criogénicas','REFRIGERACIÓN mejora CD y disipación térmica.','rare',1,req('system','cooling'),p=>{p.mod.specialCd*=.92;p.mod.heatCool*=1.18});
addUpgrade('sys_stable','Anclaje inercial','ESTABILIZADOR reduce todavía más ambos retrocesos.','rare',1,req('system','stabilizer'),p=>{p.mod.recoil*=.78;p.s.knockTaken*=.88});

function hasAnyPower(p,ids){return ids.some(id=>(p.powers?.[id]||0)>0)}
function fusionReq(weapon,special=null,system=null,powers=[]){
  return p=>p.loadout?.weapon===weapon&&(!special||p.loadout?.special===special)&&(!system||p.loadout?.system===system)&&hasAnyPower(p,powers)
}
addUpgrade('fusion_swarm','MATRIZ DE ENJAMBRE','RIVET-9 alimenta el guiado: sus impactos recortan la recarga de HOUND PACK.','fusion',1,
  fusionReq('rivet','hound',null,['rivet_split','rivet_breaker','hound_bus']),p=>p.mod.fusionSwarm=1);
addUpgrade('fusion_platform','PLATAFORMA DE TIRO','LANCE-50 + ESTABILIZADOR: disparar casi inmóvil potencia el tiro y reduce su retroceso.','fusion',1,
  fusionReq('lance',null,'stabilizer',['lance_chamber','lance_brake','sys_stable']),p=>p.mod.fusionPlatform=1);
addUpgrade('fusion_dragon','BOCA DE DRAGÓN','SCRAPSHOT almacena la combustión de HELLTRAIL; el siguiente disparo descarga munición incendiaria reforzada.','fusion',1,
  fusionReq('scrapshot','helltrail',null,['scrap_dragon','hell_napalm']),p=>p.mod.fusionDragon=1);
addUpgrade('fusion_cryo','CIRCUITO CRIOGÉNICO','SUNLINE + REFRIGERACIÓN: el haz frío al inicio del ciclo térmico causa daño adicional.','fusion',1,
  fusionReq('sunline',null,'cooling',['sun_sink','sun_focus','sys_cooling']),p=>p.mod.fusionCryo=1);
addUpgrade('fusion_siege','MARTILLO DE ASEDIO','PISTON + ATLAS SHELL: cada impacto hidráulico genera una microonda y acelera la recarga de ATLAS.','fusion',1,
  fusionReq('piston','atlas',null,['piston_shock','piston_recovery','atlas_siege']),p=>p.mod.fusionSiege=1);
addUpgrade('fusion_crown','CORONA DENTADA','GRINDER + TRINITY DRIVE: durante TRINITY el hacha gana alcance y prolonga ligeramente el anillo al conectar.','fusion',1,
  fusionReq('grinder','trinity',null,['grinder_edge','grinder_twin','trinity_ring']),p=>p.mod.fusionCrown=1);

availableIds=function(i,rarity,exclude=[]){
  const p=game.players[i];
  if(rarity==='legendary'&&game.round<3)return[];
  if(rarity==='illegal'&&game.round<5)return[];
  return Object.keys(GENERAL).filter(id=>{
    const d=GENERAL[id];return d.rarity===rarity&&!exclude.includes(id)&&(p.powers[id]||0)<(d.max||1)&&(!d.eligible||d.eligible(p))
  })
};

const MODULAR_RARITY_CURVE=[
  {common:70,rare:27,epic:3,legendary:0,illegal:0},
  {common:64,rare:29,epic:7,legendary:0,illegal:0},
  {common:59,rare:30,epic:10.65,legendary:.35,illegal:0},
  {common:55,rare:29.3,epic:15,legendary:.7,illegal:0},
  {common:52,rare:29,epic:17.85,legendary:1,illegal:.15},
  {common:49,rare:28.5,epic:20.8,legendary:1.4,illegal:.3},
  {common:46,rare:28,epic:23.75,legendary:1.8,illegal:.45}
];

rarityWeights=function(player){
  const round=Math.max(1,Math.min(7,game?.round||1)),streak=Math.max(0,Math.min(3,player?.lossStreak||0));
  const w={...MODULAR_RARITY_CURVE[round-1]};
  if(streak){
    const shift=streak*3;
    w.common=Math.max(24,w.common-shift);
    w.rare+=streak*.8;
    w.epic+=streak*2;
    if(round>=3)w.legendary+=streak*.15;
    if(round>=5)w.illegal+=streak*.05;
  }
  return w
};

function weightedRarity(weights,allowHigh=true){
  const entries=Object.entries(weights).filter(([r,w])=>w>0&&(allowHigh||!(r==='legendary'||r==='illegal')));
  const total=entries.reduce((sum,[,w])=>sum+w,0);
  let roll=Math.random()*Math.max(.0001,total);
  for(const [r,w] of entries){roll-=w;if(roll<=0)return r}
  return entries.at(-1)?.[0]||'common'
}
function degradeRarity(i,rolled,exclude=[]){
  const order={
    illegal:['illegal','legendary','epic','rare','common'],
    legendary:['legendary','epic','rare','common'],
    epic:['epic','rare','common'],
    rare:['rare','common','epic'],
    common:['common','rare','epic']
  }[rolled]||['common','rare','epic'];
  for(const r of order)if(availableIds(i,r,exclude).length)return r;
  return null
}
function rollModularRarity(i,exclude=[],allowHigh=true){
  const rolled=weightedRarity(rarityWeights(game.players[i]),allowHigh);
  return degradeRarity(i,rolled,exclude)
}
rollRarity=function(i,exclude=[]){return rollModularRarity(i,exclude,true)||'common'};
makeOptions=function(i){
  const out=[];let highTierSeen=false;
  for(let slot=0;slot<3;slot++){
    const rarity=rollModularRarity(i,out,!highTierSeen);if(!rarity)break;
    const pool=availableIds(i,rarity,out);if(!pool.length)break;
    const id=pool[Math.floor(Math.random()*pool.length)];out.push(id);
    const d=GENERAL[id];if(d&&(d.rarity==='legendary'||d.rarity==='illegal'))highTierSeen=true
  }
  return out
};
powerDef=function(id){return GENERAL[id]||null};
applyPower=function(i,id){
  const p=game.players[i],d=GENERAL[id];if(!d||(!d.eligible?false:!d.eligible(p)))return;
  p.powers[id]=(p.powers[id]||0)+1;if(d.apply)d.apply(p,game,false);
  if(d.rarity==='legendary'||d.rarity==='illegal')addFeedback('rarity',p.x,p.y,0,p.i,null,d.name+' · '+RARITY_LABEL[d.rarity])
};
updateSynergies=function(){};
hasSynergy=function(){return false};

function weaponDef(p){return WEAPONS[p.loadout?.weapon]||WEAPONS.rivet}
function specialDef(p){return SPECIALS[p.loadout?.special]||SPECIALS.atlas}
function weaponRate(p){return Math.max(.07,weaponDef(p).rate*p.mod.weaponRate*(p.fx?.overcharge>0?.84:1))}
function specialCooldown(p){return specialDef(p).cd*p.mod.specialCd}
function selfRecoil(p,amount){const q=amount*p.mod.recoil;p.vx-=Math.cos(p.a)*q;p.vy-=Math.sin(p.a)*q}
function bulletLife(range,speed){return Math.max(.15,range/Math.max(1,speed))}
function spawnBullet(p,a,def,extra={}){
  const pace=tempo(),speed=(def.speed||600)*pace,range=(def.range||650)*p.mod.weaponRange;
  game.bullets.push({x:p.x+Math.cos(a)*34,y:p.y+Math.sin(a)*34,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,
    r:def.size||5.5,owner:p.i,dmg:def.damage*p.mod.weaponDamage,bounces:p.mod.bounces||0,homing:0,boom:0,
    fire:p.mod.weaponFire||0,frost:0,shock:0,life:bulletLife(range,speed),...extra})
}
function angleDelta(a,b){return Math.abs(((a-b+Math.PI*3)%(Math.PI*2))-Math.PI)}
function nearestInCone(p,range,arc){
  let best=null,dist=Infinity;
  for(const t of game.players){
    if(!t.alive||!isEnemy(p.i,t.i))continue;
    const dx=t.x-p.x,dy=t.y-p.y,d=Math.hypot(dx,dy),ang=Math.atan2(dy,dx);
    if(d<=range+t.r&&angleDelta(ang,p.a)<=arc/2&&!lineBlocked(p.x,p.y,t.x,t.y)&&d<dist){best=t;dist=d}
  }
  return best
}
function laserShot(p,w){
  if(p.weaponLock>0)return;
  p.weaponHeat+=w.heat*p.mod.heatGain;
  const cap=p.mod.heatCap;
  let range=w.range*p.mod.weaponRange,x2=p.x+Math.cos(p.a)*range,y2=p.y+Math.sin(p.a)*range;
  const steps=Math.ceil(range/12);
  for(let i=2;i<=steps;i++){
    const t=i/steps,x=p.x+(x2-p.x)*t,y=p.y+(y2-p.y)*t;
    let stop=false;
    if(x<48||y<48||x>worldW()-48||y>worldH()-48)stop=true;
    for(const o of obstacles())if(x>o.x&&x<o.x+o.w&&y>o.y&&y<o.y+o.h){stop=true;break}
    if(stop){x2=x;y2=y;break}
  }
  const dx=x2-p.x,dy=y2-p.y,len=Math.hypot(dx,dy)||1;
  let hit=null,hitT=Infinity;
  for(const t of game.players){
    if(!t.alive||!isEnemy(p.i,t.i))continue;
    const rx=t.x-p.x,ry=t.y-p.y,proj=Math.max(0,Math.min(len,(rx*dx+ry*dy)/len)),cx=p.x+dx/len*proj,cy=p.y+dy/len*proj,perp=Math.hypot(t.x-cx,t.y-cy);
    if(perp<t.r+7&&proj<hitT&&!lineBlocked(p.x,p.y,t.x,t.y)){hit=t;hitT=proj}
  }
  if(hit){x2=p.x+dx/len*hitT;y2=p.y+dy/len*hitT;let dmg=w.damage*p.mod.weaponDamage;if(p.mod.laserRedline&&p.weaponHeat>cap*.70)dmg*=1.38;damageRaw(hit,dmg,p.i,false,Math.cos(p.a)*22,Math.sin(p.a)*22);p.stats.hits++;addFeedback('hit',hit.x,hit.y,dmg,p.i,hit.i)}
  p.stats.shots++;game.effects.push({id:Math.random().toString(36).slice(2),type:'beam',x:p.x,y:p.y,x2,y2,radius:6,color:'#ff5f73',duration:.11,life:.11,owner:p.i});
  selfRecoil(p,w.recoil);
  if(p.weaponHeat>=cap){p.weaponHeat=cap;p.weaponLock=1.25;addFeedback('overheat',p.x,p.y,0,p.i,null,'SOBRECARGA')}
}
function damageMeleeBarrel(barrel,amount,source){
  if(!barrel?.alive)return false;
  barrel.hp-=amount;shake=Math.max(shake,4);
  if(barrel.hp<=0)explodeBarrel(barrel,source);
  else addEffect('barrelHit',barrel.x,barrel.y,28,'#ff9c58',.12,source);
  return true
}
function meleeCandidate(p,range,arc){
  let best=null,bestD=Infinity;
  for(const t of game.players){
    if(!t.alive||!isEnemy(p.i,t.i))continue;
    const dx=t.x-p.x,dy=t.y-p.y,d=Math.hypot(dx,dy);
    if(d>range+t.r||angleDelta(Math.atan2(dy,dx),p.a)>arc/2||lineBlocked(p.x,p.y,t.x,t.y))continue;
    if(d<bestD){bestD=d;best={type:'player',target:t,d}}
  }
  for(const barrel of game.barrels||[]){
    if(!barrel.alive)continue;
    const dx=barrel.x-p.x,dy=barrel.y-p.y,d=Math.hypot(dx,dy);
    if(d>range+barrel.r||angleDelta(Math.atan2(dy,dx),p.a)>arc/2||lineBlocked(p.x,p.y,barrel.x,barrel.y))continue;
    if(d<bestD){bestD=d;best={type:'barrel',target:barrel,d}}
  }
  return best
}
function pushDirectionalEffect(type,p,radius,color,duration,extra={}){
  if(!game.effects)game.effects=[];
  game.effects.push({id:Math.random().toString(36).slice(2),type,x:p.x,y:p.y,a:p.a,radius,color,duration,life:duration,owner:p.i,...extra})
}
function pistonShot(p,w){
  const range=w.range,arc=.76,target=meleeCandidate(p,range,arc);p.stats.shots++;
  pushDirectionalEffect('piston',p,range,'#ffd37d',.22);
  selfRecoil(p,w.recoil);
  if(!target)return;
  const dmg=w.damage*p.mod.weaponDamage,knock=w.knock*p.mod.pistonKnock;
  if(target.type==='barrel'){damageMeleeBarrel(target.target,dmg*1.25,p.i);p.stats.hits++;return}
  damageRaw(target.target,dmg,p.i,false,Math.cos(p.a)*knock,Math.sin(p.a)*knock);p.stats.hits++;addFeedback('hit',target.target.x,target.target.y,dmg,p.i,target.target.i)
}
function grinderShot(p,w){
  const range=w.range*p.mod.grinderRange,arc=1.55,passes=1+(p.mod.pellets>0?1:0),dmg=w.damage*p.mod.weaponDamage*p.mod.grinderDamage*(passes>1?1.55:1);p.stats.shots+=passes;
  pushDirectionalEffect('axeSwing',p,range,'#d8e2ef',.28,{passes});
  selfRecoil(p,w.recoil);
  for(const t of game.players){
    if(!t.alive||!isEnemy(p.i,t.i))continue;const dx=t.x-p.x,dy=t.y-p.y,d=Math.hypot(dx,dy);
    if(d>range+t.r||angleDelta(Math.atan2(dy,dx),p.a)>arc/2||lineBlocked(p.x,p.y,t.x,t.y))continue;
    damageRaw(t,dmg,p.i,false,Math.cos(p.a)*w.knock,Math.sin(p.a)*w.knock);p.stats.hits++;addFeedback('hit',t.x,t.y,dmg,p.i,t.i)
  }
  for(const barrel of game.barrels||[]){
    if(!barrel.alive)continue;const dx=barrel.x-p.x,dy=barrel.y-p.y,d=Math.hypot(dx,dy);
    if(d>range+barrel.r||angleDelta(Math.atan2(dy,dx),p.a)>arc/2||lineBlocked(p.x,p.y,barrel.x,barrel.y))continue;
    if(damageMeleeBarrel(barrel,dmg*1.35,p.i))p.stats.hits++
  }
}

fire=function(p){
  const w=weaponDef(p);revealPlayer(p);
  if(w.id==='sunline'){laserShot(p,w);return}
  if(w.id==='piston'){pistonShot(p,w);return}
  if(w.id==='grinder'){grinderShot(p,w);return}
  addEffect('shot',p.x+Math.cos(p.a)*28,p.y+Math.sin(p.a)*28,24,PLAYER_COLORS[p.i],.08,p.i);
  if(w.id==='scrapshot'){
    const pellets=w.pellets+p.mod.pellets;p.stats.shots+=pellets;
    for(let i=0;i<pellets;i++){const t=pellets===1?0:(i/(pellets-1)-.5),a=p.a+t*w.spread*p.mod.spread;spawnBullet(p,a,w,{dmg:w.damage*p.mod.weaponDamage})}
  }else if(w.id==='rivet'){
    const n=1+p.mod.pellets;p.stats.shots+=n;
    for(let i=0;i<n;i++){const t=n===1?0:(i/(n-1)-.5),a=p.a+t*.14;spawnBullet(p,a,w)}
  }else{p.stats.shots++;spawnBullet(p,p.a,w)}
  selfRecoil(p,w.recoil)
};

function fireAtlas(p){
  const a=p.a,speed=500*tempo(),radius=136*p.mod.atlasRadius;p.stats.shots++;
  game.bullets.push({x:p.x+Math.cos(a)*42,y:p.y+Math.sin(a)*42,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:20,owner:p.i,
    dmg:18*p.mod.specialDamage,bounces:0,homing:0,boom:0,fire:0,frost:0,shock:0,life:2.35,special:true,specialRadius:radius,
    specialKnock:400,cluster:p.mod.atlasCluster});addEffect('muzzle',p.x+Math.cos(a)*32,p.y+Math.sin(a)*32,58,'#ffd8a8',.20,p.i)
}
function fireHelltrail(p){
  const rows=p.mod.hellRows>1?[-20,20]:[0],count=7,a=p.a,perp=a+Math.PI/2,pace=tempo();
  for(const off of rows)for(let k=0;k<count;k++){const delay=k*.085,x=p.x+Math.cos(a)*(30+k*18)+Math.cos(perp)*off,y=p.y+Math.sin(a)*(30+k*18)+Math.sin(perp)*off;game.bullets.push({x,y,vx:Math.cos(a)*(425+18*k)*pace,vy:Math.sin(a)*(425+18*k)*pace,r:9,owner:p.i,dmg:5.2*p.mod.specialDamage,bounces:0,homing:0,boom:0,fire:0,frost:0,shock:0,life:.78+delay,groundFire:true,napalmRadius:48*p.mod.hellRadius,napalmLife:5.0*p.mod.hellLife,napalmDamage:.9*p.mod.specialDamage})}
  p.stats.shots+=count*rows.length;addEffect('muzzle',p.x+Math.cos(a)*36,p.y+Math.sin(a)*36,72,'#ff813d',.26,p.i)
}
function fireShiv(p){
  const wasInvisible=p.fx.invisible>0,predator=wasInvisible&&p.s.predator;revealPlayer(p);
  const range=118*p.mod.shivRange*(predator?1.10:1),arc=.84,base=32*p.mod.shivDamage*p.mod.specialDamage+(predator?6:0);let hitAny=false;
  addEffect('slash',p.x+Math.cos(p.a)*range*.52,p.y+Math.sin(p.a)*range*.52,range,'#e9e4ff',.28,p.i);
  for(const t of game.players){if(!t.alive||!isEnemy(p.i,t.i))continue;const dx=t.x-p.x,dy=t.y-p.y,d=Math.hypot(dx,dy);if(d>range+t.r||angleDelta(Math.atan2(dy,dx),p.a)>arc/2||lineBlocked(p.x,p.y,t.x,t.y))continue;let damage=base;if(p.mod.shivExecute&&t.hp/t.max<.35)damage*=1.38;damage*=Math.max(.72,1-d/(range*2.2));damageRaw(t,damage,p.i,false,Math.cos(p.a)*220,Math.sin(p.a)*220);addFeedback('hit',t.x,t.y,damage,p.i,t.i);p.stats.hits++;hitAny=true}
  if(predator&&hitAny)p.dc=Math.max(0,p.dc-p.s.dc*.42);if(hitAny)shake=Math.max(shake,12)
}
function placeMines(p){
  const count=p.mod.mineCount,life=p.mod.mineLife;
  for(let k=0;k<count;k++){const back=32+k*28,side=(k%2?1:-1)*12,x=p.x-Math.cos(p.a)*back+Math.cos(p.a+Math.PI/2)*side,y=p.y-Math.sin(p.a)*back+Math.sin(p.a+Math.PI/2)*side;game.mines.push({id:Math.random().toString(36).slice(2),x,y,owner:p.i,r:14,arm:.30,life,maxLife:life,damage:20*p.mod.mineDamage*p.mod.specialDamage,radius:80*p.mod.mineRadius,created:performance.now()})}
  const mineMine=game.mines.filter(m=>m.owner===p.i);while(mineMine.length>6+(p.mod.mineCount-4)){const old=mineMine.shift(),idx=game.mines.indexOf(old);if(idx>=0)game.mines.splice(idx,1)}
}
function fireHound(p){
  const count=p.mod.missileCount,spread=.34,a=p.a,pace=tempo();p.stats.shots+=count;
  for(let k=0;k<count;k++){const off=count===1?0:(k/(count-1)-.5)*spread,aa=a+off,speed=405*pace;game.bullets.push({x:p.x+Math.cos(aa)*34,y:p.y+Math.sin(aa)*34,vx:Math.cos(aa)*speed,vy:Math.sin(aa)*speed,r:7,owner:p.i,dmg:7.5*p.mod.missileDamage*p.mod.specialDamage,bounces:0,homing:1.08*p.mod.missileHoming,boom:1,fire:0,frost:0,shock:0,life:3.0,missile:true})}
  addEffect('muzzle',p.x+Math.cos(a)*30,p.y+Math.sin(a)*30,58,'#9ad8ff',.20,p.i)
}
function fireTrinity(p){p.fx.bladeStorm=4.0*p.mod.bladeDuration;p.fx.bladeTick=0;addEffect('trinity',p.x,p.y,90*p.mod.bladeRadius,'#ff697d',.40,p.i)}

fireSpecial=function(p){
  revealPlayer(p);
  const id=p.loadout?.special||'atlas';
  if(id==='helltrail')fireHelltrail(p);
  else if(id==='shiv')fireShiv(p);
  else if(id==='deadtrack')placeMines(p);
  else if(id==='hound')fireHound(p);
  else if(id==='trinity')fireTrinity(p);
  else fireAtlas(p)
};

const legacyUpdateStatuses=updateStatuses;
updateStatuses=function(dt){
  legacyUpdateStatuses(dt);
  for(const p of game.players){
    if(!p.alive)continue;
    p.weaponLock=Math.max(0,(p.weaponLock||0)-dt);
    const cool=.34*p.mod.heatCool*(p.weaponLock>0?1.35:1);p.weaponHeat=Math.max(0,(p.weaponHeat||0)-cool*dt);
    if(p.fx.bladeStorm>0)p.fx.bladeStorm=Math.max(0,p.fx.bladeStorm-dt)
  }
};

movePlayer=function(p,k,dt){
  if(!p.alive)return;const over=p.fx.overcharge>0?1.35:1;p.shot=Math.max(0,p.shot-dt*over);p.dc=Math.max(0,p.dc-dt*over);p.dt=Math.max(0,p.dt-dt);p.specialCd=Math.max(0,p.specialCd-dt*over);p.inv=Math.max(0,p.inv-dt);
  const ax=k.ax-p.x,ay=k.ay-p.y;if(Math.abs(ax)+Math.abs(ay)>1)p.a=Math.atan2(ay,ax);
  let x=k.r-k.l,y=k.d-k.u,m=Math.hypot(x,y)||1;x/=m;y/=m;
  if(k.dash&&!p.pd&&p.dc<=0){
    if(p.character==='mix'){if(!x&&!y){x=Math.cos(p.a);y=Math.sin(p.a)}p.vx=x*p.s.dash;p.vy=y*p.s.dash;p.dt=.18;p.inv=.16;p.dc=p.s.dc;if(p.s.overdrive)p.dc*=.68;p.stats.dashes++;addEffect('dash',p.x,p.y,70,PLAYER_COLORS[p.i],.24,p.i)}
    else if(p.character==='trucks'){p.fx.fortify=p.s.fortifyDuration;p.fx.reactiveReady=p.s.reactive?1:0;p.dc=p.s.dc;addEffect('fortify',p.x,p.y,58,'#b7c1cf',.30,p.i)}
    else{p.fx.invisible=p.s.invisDuration;p.dc=p.s.dc;addEffect('cloak',p.x,p.y,64,'#aa9cff',.30,p.i)}
  }p.pd=k.dash;
  const pace=tempo(),fortifyMove=p.fx.fortify>0?p.s.fortifySlow:1,invisMove=p.fx.invisible>0?p.s.invisSpeed:1,coreMove=p.fx.overcharge>0?1.15:1,bladeMove=p.fx.bladeStorm>0?1.20:1;
  if(p.dt<=0){const q=1-Math.exp(-13*dt),speed=p.s.spd*pace*p.fx.slowFactor*(p.fx.haste>0?1.32:1)*fortifyMove*invisMove*coreMove*bladeMove;p.vx+=(x*speed-p.vx)*q;p.vy+=(y*speed-p.vy)*q}else{p.vx*=.88;p.vy*=.88}
  p.x+=p.vx*dt;p.y+=p.vy*dt;collidePlayer(p);
  if(k.fire&&p.shot<=0){if(weaponDef(p).id==='sunline'&&p.weaponLock>0)p.shot=.06;else{fire(p);p.shot=weaponRate(p)}}
  if(k.special&&!p.ps&&p.specialCd<=0){fireSpecial(p);p.specialCd=specialCooldown(p)}p.ps=k.special;
  if(p.character==='mix'&&p.s.dashWave&&p.dt<=0&&p.prevDt>0)dashShockwave(p);p.prevDt=p.dt
};

function explodeMine(m){
  addEffect('mine',m.x,m.y,m.radius,'#ffcf5c',.36,m.owner);shake=Math.max(shake,12);
  for(const p of game.players){if(!p.alive||!isEnemy(m.owner,p.i))continue;const d=Math.hypot(p.x-m.x,p.y-m.y);if(d<m.radius+p.r){const fall=Math.max(.3,1-d/m.radius),dx=(p.x-m.x)/(d||1),dy=(p.y-m.y)/(d||1),damage=m.damage*fall;damageRaw(p,damage,m.owner,false,dx*185*fall,dy*185*fall);addFeedback('hit',p.x,p.y,damage,m.owner,p.i)}}
}
function updateMines(dt){
  for(let i=game.mines.length-1;i>=0;i--){const m=game.mines[i];m.life-=dt;m.arm-=dt;if(m.life<=0){game.mines.splice(i,1);continue}if(m.arm>0)continue;let trigger=false;for(const p of game.players){if(!p.alive||!isEnemy(m.owner,p.i))continue;if(Math.hypot(p.x-m.x,p.y-m.y)<m.r+p.r+10){trigger=true;break}}if(trigger){game.mines.splice(i,1);explodeMine(m)}}
}
function updateBladeStorm(dt){
  for(const p of game.players){if(!p.alive||p.fx.bladeStorm<=0)continue;p.fx.bladeTick-=dt;if(p.fx.bladeTick>0)continue;p.fx.bladeTick=.18;const radius=76*p.mod.bladeRadius;
    for(const t of game.players){if(!t.alive||!isEnemy(p.i,t.i))continue;const d=Math.hypot(t.x-p.x,t.y-p.y);if(d<radius+t.r&&!lineBlocked(p.x,p.y,t.x,t.y)){const dmg=2.7*p.mod.bladeDamage*p.mod.specialDamage,dx=(t.x-p.x)/(d||1),dy=(t.y-p.y)/(d||1);damageRaw(t,dmg,p.i,false,dx*55,dy*55)}}
  }
}
const legacyUpdateGroundFires=updateGroundFires;
updateGroundFires=function(dt){legacyUpdateGroundFires(dt);updateMines(dt);updateBladeStorm(dt)};

const legacyDamageRaw=damageRaw;
damageRaw=function(target,amount,source,allowFriendly,kx,ky){
  if(target?.s){amount*=1-(target.s.damageReduction||0);kx=(kx||0)*(target.s.knockTaken||1);ky=(ky||0)*(target.s.knockTaken||1)}
  const trainingHit=!!game?.training&&target?.i===1&&source===0,before=trainingHit?target.hp:0;
  legacyDamageRaw(target,amount,source,allowFriendly,kx,ky);
  if(trainingHit&&game?.trainingMetrics){
    const dealt=Math.max(0,before-target.hp);
    if(dealt>0){
      const metrics=game.trainingMetrics,now=performance.now();
      metrics.total+=dealt;
      metrics.best=Math.max(metrics.best,dealt);
      metrics.events.push({t:now,d:dealt});
      if(metrics.events.length>500)metrics.events.splice(0,metrics.events.length-500);
    }
    // The test dummy is effectively immortal; metrics keep the real dealt amount.
    target.hp=target.max;
    target.alive=true;
    game.phase='play';
  }
};

// Fix storm start radius so map corners are not already outside when it activates.
updateStorm=function(dt){
  const st=game.storm;if(!st)return;const startRadius=Math.hypot(worldW(),worldH())/2+24;st.elapsed+=dt;if(st.elapsed<st.start){st.active=false;st.radius=startRadius;return}st.active=true;const t=Math.min(1,(st.elapsed-st.start)/st.duration);st.radius=startRadius+(st.minRadius-startRadius)*t;const dps=8+18*t;for(const p of game.players){if(!p.alive)continue;const ww=worldW(),hh=worldH(),dx=p.x-ww/2,dy=p.y-hh/2,d=Math.hypot(dx,dy);if(d>st.radius){const over=Math.min(1,(d-st.radius)/140),push=50+120*t;p.vx+=(-dx/(d||1))*push*dt;p.vy+=(-dy/(d||1))*push*dt;damageRaw(p,dps*(.55+.45*over)*dt,null,true,0,0)}}
};
