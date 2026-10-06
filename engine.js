'use strict';

const $=id=>document.getElementById(id);
const cv=$('game'),ctx=cv.getContext('2d');
const W=1280,H=720,PFX='fight-random-';
const PLAYER_COLORS=['#47e8ff','#ff4fa3','#63f3a5','#ffad57'];
const TEAM_COLORS=['#47e8ff','#ff4fa3'];
const RARITY_LABEL={common:'COMÚN',rare:'RARO',epic:'ÉPICO',legendary:'LEGENDARIO',illegal:'ILEGAL'};

const MODES={
  duel:{id:'duel',name:'1V1',players:2,win:5,baseHp:150,teams:[0,1]},
  ffa3:{id:'ffa3',name:'1V1V1',players:3,win:4,baseHp:165,teams:null},
  teams:{id:'teams',name:'2V2',players:4,win:5,baseHp:165,teams:[0,1,0,1]}
};

const GENERAL={
  multi:{name:'Disparo múltiple',desc:'Añade un proyectil por disparo. El daño individual se reduce al acumular niveles.',rarity:'common',max:3},
  rapid:{name:'Cadencia',desc:'Reduce el intervalo entre disparos un 12%. Efecto decreciente por nivel.',rarity:'common',max:4},
  speed:{name:'Movilidad',desc:'Aumenta la velocidad de movimiento un 9%.',rarity:'common',max:3},
  tank:{name:'Blindaje',desc:'Aumenta la vida máxima en 18 y recupera 18 de vida al obtenerla.',rarity:'common',max:4},
  caliber:{name:'Calibre',desc:'Aumenta el daño base de los proyectiles en 1.6.',rarity:'common',max:4},
  heavy:{name:'Munición pesada',desc:'Aumenta daño, tamaño y retroceso del proyectil a cambio de una ligera pérdida de velocidad.',rarity:'rare',max:4},
  bounce:{name:'Ricochet',desc:'Los proyectiles pueden rebotar una vez adicional.',rarity:'rare',max:3},
  dash:{name:'Propulsión',desc:'Reduce la recarga del dash y aumenta ligeramente su impulso.',rarity:'rare',max:3},
  shield:{name:'Escudo',desc:'Bloquea un impacto adicional al inicio de cada ronda.',rarity:'rare',max:3},
  leech:{name:'Recuperación',desc:'Convierte una pequeña parte del daño directo infligido en vida.',rarity:'rare',max:3},
  fire:{name:'Incendiaria',desc:'Los impactos aplican una quemadura breve de daño reducido.',rarity:'epic',max:3},
  frost:{name:'Criogénica',desc:'Los impactos ralentizan temporalmente al objetivo.',rarity:'epic',max:3},
  shock:{name:'Electrificada',desc:'Los impactos acumulan carga; al alcanzar el umbral liberan daño adicional.',rarity:'epic',max:3},
  homing:{name:'Guiado',desc:'Los proyectiles corrigen de forma limitada su trayectoria hacia enemigos.',rarity:'epic',max:3},
  boom:{name:'Carga explosiva',desc:'Los proyectiles generan una explosión de área al impactar.',rarity:'epic',max:3}
};

const CHARACTERS={
  mix:{
    id:'mix',
    name:'MIX',
    abilityUpgrades:{
      legendary:['mix_vector','mix_shell'],
      illegal:['mix_overdrive','mix_cluster']
    }
  }
};

const ABILITY_UPGRADES={
  mix_vector:{name:'Vector reforzado',desc:'El dash gana un 22% de impulso, reduce su recarga un 18% y genera una onda de retroceso al finalizar.',rarity:'legendary',max:1},
  mix_shell:{name:'Recámara de asedio',desc:'La Bola de cañón reduce su recarga un 18% y aumenta el radio y el retroceso de su explosión.',rarity:'legendary',max:1},
  mix_overdrive:{name:'Sobrecarga cinética',desc:'El dash obtiene una segunda carga virtual: si se usa al estar listo, su siguiente recarga se reduce drásticamente.',rarity:'illegal',max:1},
  mix_cluster:{name:'Munición de racimo',desc:'La Bola de cañón libera tres explosiones secundarias de menor potencia tras detonar.',rarity:'illegal',max:1}
};

const MAPS=[
  {
    name:'PILARES',bg:'#0b1020',
    obs:[{x:600,y:155,w:80,h:125},{x:600,y:440,w:80,h:125}],
    pickupSpawns:[[310,150],[970,150],[310,570],[970,570],[640,360]],
    barrels:[[460,360],[820,360],[640,105]]
  },
  {
    name:'CRUCE',bg:'#10111b',
    obs:[{x:545,y:325,w:190,h:70},{x:605,y:130,w:70,h:145},{x:605,y:445,w:70,h:145}],
    pickupSpawns:[[250,145],[1030,145],[250,575],[1030,575],[470,360],[810,360]],
    barrels:[[390,255],[890,465],[890,255],[390,465]]
  },
  {
    name:'CUATRO ESQUINAS',bg:'#0b1218',
    obs:[{x:330,y:190,w:125,h:65},{x:825,y:190,w:125,h:65},{x:330,y:465,w:125,h:65},{x:825,y:465,w:125,h:65}],
    pickupSpawns:[[640,120],[640,600],[220,360],[1060,360],[640,360]],
    barrels:[[500,250],[780,250],[500,470],[780,470]]
  }
];

const SPAWNS={
  duel:[[175,360],[1105,360]],
  ffa3:[[640,110],[220,575],[1060,575]],
  teams:[[175,220],[1105,220],[175,500],[1105,500]]
};

const PICKUPS={
  heal:{label:'CURACIÓN',color:'#54f59a'},
  shield:{label:'ESCUDO',color:'#f4f6ff'},
  haste:{label:'VELOCIDAD',color:'#ffd166'}
};

let peer=null,conn=null,host=false,me=null,code='',selectedMode='duel';
let game=null,view=null,timer=null,lastFrame=performance.now(),sendAccumulator=0,pickLock=false,shake=0;
const hostConnections=new Map();
const reservedSeats=new Set();
const remoteInputs={};
const mine=blankInput();

function blankInput(){return{u:0,d:0,l:0,r:0,fire:0,dash:0,special:0,ax:W/2,ay:H/2}}
function clone(v){return JSON.parse(JSON.stringify(v))}
function modeOf(g=game){return MODES[g?.mode||selectedMode]||MODES.duel}
function characterDef(p){return CHARACTERS[p.character]||CHARACTERS.mix}
function powerDef(id){return GENERAL[id]||ABILITY_UPGRADES[id]||null}
function playerTeam(index,g=game){const m=modeOf(g);return m.teams?m.teams[index]:index}
function isEnemy(a,b,g=game){if(a===b)return false;const m=modeOf(g);return !m.teams||playerTeam(a,g)!==playerTeam(b,g)}

function baseStats(){return{spd:225,rate:.52,dmg:10.5,bs:560,size:6,n:1,bounce:0,homing:0,boom:0,dash:610,dc:1.65,shield:0,knock:72,fire:0,frost:0,shock:0,leech:0,specialCd:8.5,specialRadius:124,specialKnock:360,dashWave:0,overdrive:0,cluster:0}}
function combatStats(){return{shots:0,hits:0,damage:0,pickups:0,dashes:0,kills:0,deaths:0}}
function makePlayer(i,mode){const hp=mode.baseHp+5;return{i,team:mode.teams?mode.teams[i]:i,character:'mix',x:0,y:0,vx:0,vy:0,r:22,hp,max:hp,alive:true,score:0,lossStreak:0,a:i%2?Math.PI:0,shot:0,dc:0,dt:0,inv:0,pd:0,shield:0,s:baseStats(),powers:{},fx:{burn:0,burnDps:0,burnOwner:null,slow:0,slowFactor:1,shock:0,haste:0},specialCd:0,ps:0,stats:combatStats()}}
function makeGame(modeId){const m=MODES[modeId]||MODES.duel;return{mode:m.id,phase:'ready',round:1,count:0,t:0,map:Math.floor(Math.random()*MAPS.length),connected:Array(m.players).fill(false),ready:Array(m.players).fill(false),rematch:Array(m.players).fill(false),players:Array.from({length:m.players},(_,i)=>makePlayer(i,m)),teamScore:[0,0],bullets:[],pickups:[],barrels:[],effects:[],storm:{elapsed:0,start:34,duration:26,radius:760,minRadius:145,active:false},pickupTimer:7,opts:Array.from({length:m.players},()=>[]),picked:Array(m.players).fill(null),matchWinner:null}}
function connectedCount(){return game?game.connected.filter(Boolean).length:0}
function allConnected(){const m=modeOf();return !!game&&connectedCount()===m.players}
function allReady(arr){return allConnected()&&arr.every(Boolean)}

function resetRoomAfterDisconnect(){if(!host||!game)return;const mode=game.mode;const oldConnected=game.connected.slice();game=makeGame(mode);game.connected[0]=true;for(const [seat,c] of hostConnections)game.connected[seat]=!!c.open;for(let i=0;i<oldConnected.length;i++)if(i===0)game.connected[i]=true;view=game;broadcast(true)}

function chooseMap(){let old=game.map,n=old;while(MAPS.length>1&&n===old)n=Math.floor(Math.random()*MAPS.length);game.map=n}
function spawnFor(i){return SPAWNS[game.mode][i]||[W/2,H/2]}
function resetBarrels(){game.barrels=MAPS[game.map].barrels.map((p,i)=>({id:i,x:p[0],y:p[1],r:23,hp:22,max:22,alive:true}))}
function startRound(first=false){if(!first)chooseMap();game.phase='count';game.count=2.5;game.bullets=[];game.pickups=[];game.pickupTimer=6.5;game.picked=Array(modeOf().players).fill(null);game.opts=Array.from({length:modeOf().players},()=>[]);game.effects=[];game.storm={elapsed:0,start:34,duration:26,radius:760,minRadius:145,active:false};resetBarrels();game.players.forEach((p,i)=>{const sp=spawnFor(i);p.x=sp[0];p.y=sp[1];p.vx=p.vy=0;p.hp=p.max;p.alive=true;p.shot=p.dc=p.dt=0;p.specialCd=0;p.inv=.45;p.pd=p.ps=0;p.shield=p.s.shield;p.fx={burn:0,burnDps:0,burnOwner:null,slow:0,slowFactor:1,shock:0,haste:0}});broadcast(true)}

function rarityWeights(player){const s=Math.min(3,player.lossStreak||0);const tables=[
  {common:61,rare:30,epic:8.2,legendary:.7,illegal:.1},
  {common:55,rare:31,epic:11.5,legendary:2.1,illegal:.4},
  {common:49,rare:31.5,epic:15,legendary:3.7,illegal:.8},
  {common:44,rare:30.5,epic:18,legendary:5.8,illegal:1.7}
];return tables[s]}
function availableIds(i,rarity,exclude=[]){const p=game.players[i];if(rarity==='legendary'||rarity==='illegal'){
  if(rarity==='legendary'&&game.round<3)return[];
  if(rarity==='illegal'&&game.round<5)return[];
  const ids=characterDef(p).abilityUpgrades[rarity]||[];
  return ids.filter(id=>{const d=ABILITY_UPGRADES[id];return d&&!exclude.includes(id)&&(p.powers[id]||0)<(d.max||1)})
}
return Object.keys(GENERAL).filter(id=>{const d=GENERAL[id];return d.rarity===rarity&&!exclude.includes(id)&&(p.powers[id]||0)<d.max})}
function rollRarity(i,exclude=[]){const p=game.players[i],weights=rarityWeights(p),valid=[];for(const r of Object.keys(weights)){if(availableIds(i,r,exclude).length)valid.push([r,weights[r]])}if(!valid.length)return'common';const total=valid.reduce((s,x)=>s+x[1],0);let roll=Math.random()*total;for(const [r,w] of valid){roll-=w;if(roll<=0)return r}return valid[valid.length-1][0]}
function makeOptions(i){const out=[];for(let slot=0;slot<3;slot++){
  let rarity=rollRarity(i,out),pool=availableIds(i,rarity,out);
  if(!pool.length){const fallback=['epic','rare','common'].flatMap(r=>availableIds(i,r,out));pool=fallback}
  if(!pool.length)break;
  out.push(pool[Math.floor(Math.random()*pool.length)])
}return out}
function applyPower(i,id){const p=game.players[i],d=powerDef(id);if(!d)return;p.powers[id]=(p.powers[id]||0)+1;
  switch(id){
    case'multi':p.s.n++;break;
    case'rapid':p.s.rate*=.88;break;
    case'speed':p.s.spd*=1.09;break;
    case'tank':p.max+=18;p.hp=Math.min(p.max,p.hp+18);break;
    case'caliber':p.s.dmg+=1.6;break;
    case'heavy':p.s.dmg+=3;p.s.size+=1.1;p.s.knock+=16;p.s.bs*=.965;break;
    case'bounce':p.s.bounce++;break;
    case'dash':p.s.dc*=.89;p.s.dash*=1.075;break;
    case'shield':p.s.shield++;break;
    case'leech':p.s.leech+=.055;break;
    case'fire':p.s.fire++;break;
    case'frost':p.s.frost++;break;
    case'shock':p.s.shock++;break;
    case'homing':p.s.homing+=.42;break;
    case'boom':p.s.boom++;break;
    case'mix_vector':p.s.dash*=1.22;p.s.dc*=.82;p.s.dashWave=1;break;
    case'mix_shell':p.s.specialCd*=.82;p.s.specialRadius*=1.20;p.s.specialKnock*=1.24;break;
    case'mix_overdrive':p.s.overdrive=1;break;
    case'mix_cluster':p.s.cluster=1;break;
    default: if(typeof d.apply==='function')d.apply(p,game);
  }
}
function chooseUpgrade(i,n){if(!host||game.phase!=='pick'||game.picked[i]!=null||!game.connected[i])return;const id=game.opts[i][n];if(!id)return;game.picked[i]=n;applyPower(i,id);if(game.picked.every((x,idx)=>!game.connected[idx]||x!=null))game.t=.9;broadcast(true)}

function setReady(i,kind){if(!host||!game.connected[i])return;
  if(kind==='ready'&&game.phase==='ready'){game.ready[i]=true;if(allReady(game.ready))startRound(true);broadcast(true)}
  if(kind==='rematch'&&game.phase==='end'){game.rematch[i]=true;if(allReady(game.rematch)){const mode=game.mode;game=makeGame(mode);for(let s=0;s<modeOf().players;s++)game.connected[s]=s===0||!!hostConnections.get(s)?.open;game.ready=game.connected.slice();startRound(true)}broadcast(true)}
}

function updateLossStreaks(winners){game.players.forEach(p=>{if(winners.includes(p.i))p.lossStreak=0;else p.lossStreak=Math.min(3,(p.lossStreak||0)+1)})}
function finishRound(winnerSeat=null,winnerTeam=null){if(game.phase!=='play')return;const m=modeOf();let winners=[];
  if(m.id==='teams'){
    if(winnerTeam!=null){game.teamScore[winnerTeam]++;winners=game.players.filter(p=>p.team===winnerTeam).map(p=>p.i);updateLossStreaks(winners);if(game.teamScore[winnerTeam]>=m.win){game.phase='end';game.matchWinner={type:'team',team:winnerTeam};game.rematch=Array(m.players).fill(false);broadcast(true);return}}
  }else if(winnerSeat!=null){game.players[winnerSeat].score++;winners=[winnerSeat];updateLossStreaks(winners);if(game.players[winnerSeat].score>=m.win){game.phase='end';game.matchWinner={type:'player',seat:winnerSeat};game.rematch=Array(m.players).fill(false);broadcast(true);return}}
  game.phase='round';game.t=1.45;broadcast(true)
}
function checkRoundEnd(){if(game.phase!=='play')return;const m=modeOf(),alive=game.players.filter(p=>p.alive);
  if(m.id==='teams'){
    const aliveTeams=[0,1].filter(t=>game.players.some(p=>p.alive&&p.team===t));
    if(aliveTeams.length<=1)finishRound(null,aliveTeams.length===1?aliveTeams[0]:null)
  }else if(alive.length<=1)finishRound(alive.length===1?alive[0].i:null,null)
}
function eliminate(target,source){if(!target.alive)return;target.alive=false;target.hp=0;target.stats.deaths++;target.vx=target.vy=0;if(source!=null&&source!==target.i&&game.players[source])game.players[source].stats.kills++;checkRoundEnd()}

function sim(dt){if(!game)return;
  if(game.phase==='ready'||game.phase==='end')return;
  if(game.phase==='count'){game.count-=dt;if(game.count<=0)game.phase='play';return}
  if(game.phase==='round'){game.t-=dt;if(game.t<=0){game.round++;game.phase='pick';game.opts=game.players.map((_,i)=>makeOptions(i));game.picked=Array(modeOf().players).fill(null);pickLock=false;broadcast(true)}return}
  if(game.phase==='pick'){if(game.picked.every((x,i)=>!game.connected[i]||x!=null)){game.t-=dt;if(game.t<=0)startRound(false)}return}
  if(game.phase!=='play')return;
  game.players.forEach((p,i)=>movePlayer(p,inputFor(i),dt));
  updateStatuses(dt);if(game.phase!=='play')return;
  updateStorm(dt);if(game.phase!=='play')return;
  updateEffects(dt);
  updateBullets(dt);if(game.phase!=='play')return;
  updatePickups(dt)
}
function inputFor(i){if(i===0)return mine;return remoteInputs[i]||blankInput()}
function updateStatuses(dt){for(const p of game.players){if(!p.alive)continue;
  if(p.fx.burn>0){p.fx.burn-=dt;const amount=p.fx.burnDps*dt;damageRaw(p,amount,p.fx.burnOwner,false,0,0);if(game.phase!=='play')return}
  if(p.fx.slow>0)p.fx.slow-=dt;else p.fx.slowFactor=1;
  if(p.fx.haste>0)p.fx.haste-=dt
}}
function movePlayer(p,k,dt){if(!p.alive)return;p.shot=Math.max(0,p.shot-dt);p.dc=Math.max(0,p.dc-dt);p.dt=Math.max(0,p.dt-dt);p.specialCd=Math.max(0,p.specialCd-dt);p.inv=Math.max(0,p.inv-dt);
  const ax=k.ax-p.x,ay=k.ay-p.y;if(Math.abs(ax)+Math.abs(ay)>1)p.a=Math.atan2(ay,ax);
  let x=k.r-k.l,y=k.d-k.u,m=Math.hypot(x,y)||1;x/=m;y/=m;
  if(k.dash&&!p.pd&&p.dc<=0){if(!x&&!y){x=Math.cos(p.a);y=Math.sin(p.a)}p.vx=x*p.s.dash;p.vy=y*p.s.dash;p.dt=.18;p.inv=.16;p.dc=p.s.dc;if(p.s.overdrive)p.dc*=.68;p.stats.dashes++;addEffect('dash',p.x,p.y,70,PLAYER_COLORS[p.i],.24,p.i)}p.pd=k.dash;
  if(p.dt<=0){const q=1-Math.exp(-13*dt),speed=p.s.spd*p.fx.slowFactor*(p.fx.haste>0?1.32:1);p.vx+=(x*speed-p.vx)*q;p.vy+=(y*speed-p.vy)*q}else{p.vx*=.88;p.vy*=.88}
  p.x+=p.vx*dt;p.y+=p.vy*dt;collidePlayer(p);
  if(k.fire&&p.shot<=0){fire(p);p.shot=Math.max(.12,p.s.rate)}if(k.special&&!p.ps&&p.specialCd<=0){fireSpecial(p);p.specialCd=p.s.specialCd}p.ps=k.special;if(p.s.dashWave&&p.dt<=0&&p.prevDt>0){dashShockwave(p)}p.prevDt=p.dt
}
function obstacles(){return MAPS[game?.map||0].obs}
function collidePlayer(p){p.x=Math.max(58,Math.min(W-58,p.x));p.y=Math.max(58,Math.min(H-58,p.y));for(const o of obstacles()){const nx=Math.max(o.x,Math.min(p.x,o.x+o.w)),ny=Math.max(o.y,Math.min(p.y,o.y+o.h));let dx=p.x-nx,dy=p.y-ny,d=Math.hypot(dx,dy);if(d<p.r){if(d<.1){dx=p.x<W/2?-1:1;dy=0;d=1}p.x+=dx/d*(p.r-d);p.y+=dy/d*(p.r-d)}}}
function multiScale(n){return Math.max(.50,1/Math.pow(n,.46))}
function fire(p){const n=p.s.n,spread=.14*Math.min(5,n-1),scale=multiScale(n);p.stats.shots+=n;for(let i=0;i<n;i++){
  const a=p.a+(n===1?0:(i/(n-1)-.5)*spread);game.bullets.push({x:p.x+Math.cos(a)*34,y:p.y+Math.sin(a)*34,vx:Math.cos(a)*p.s.bs,vy:Math.sin(a)*p.s.bs,r:p.s.size,owner:p.i,dmg:p.s.dmg*scale,bounces:p.s.bounce,homing:p.s.homing,boom:p.s.boom,fire:p.s.fire,frost:p.s.frost,shock:p.s.shock,life:2.25})
}}
function fireSpecial(p){const a=p.a,speed=430;p.stats.shots++;game.bullets.push({x:p.x+Math.cos(a)*42,y:p.y+Math.sin(a)*42,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:19,owner:p.i,dmg:16,bounces:0,homing:0,boom:0,fire:0,frost:0,shock:0,life:2.5,special:true,specialRadius:p.s.specialRadius,specialKnock:p.s.specialKnock,cluster:p.s.cluster});addEffect('muzzle',p.x+Math.cos(a)*32,p.y+Math.sin(a)*32,52,'#ffd8a8',.18,p.i)}
function dashShockwave(p){addEffect('shockwave',p.x,p.y,88,PLAYER_COLORS[p.i],.28,p.i);for(const t of game.players){if(!t.alive||!isEnemy(p.i,t.i))continue;const d=Math.hypot(t.x-p.x,t.y-p.y);if(d<88){const fall=1-d/88,dx=(t.x-p.x)/(d||1),dy=(t.y-p.y)/(d||1);damageRaw(t,3.5*fall,p.i,false,dx*160*fall,dy*160*fall)}}}
function nearestEnemy(owner,x,y){let best=null,dist=Infinity;for(const p of game.players){if(!p.alive||!isEnemy(owner,p.i))continue;const d=Math.hypot(p.x-x,p.y-y);if(d<dist){dist=d;best=p}}return best}
function updateBullets(dt){for(let i=game.bullets.length-1;i>=0;i--){const b=game.bullets[i];b.life-=dt;if(b.life<=0){game.bullets.splice(i,1);continue}
  if(b.homing){const t=nearestEnemy(b.owner,b.x,b.y);if(t){const aim=Math.atan2(t.y-b.y,t.x-b.x),cur=Math.atan2(b.vy,b.vx),df=((aim-cur+Math.PI*3)%(Math.PI*2))-Math.PI,s=Math.hypot(b.vx,b.vy),next=cur+Math.max(-b.homing*dt,Math.min(b.homing*dt,df));b.vx=Math.cos(next)*s;b.vy=Math.sin(next)*s}}
  b.x+=b.vx*dt;b.y+=b.vy*dt;
  if(hitBarrel(b)){if(b.special)specialExplosion(b,b.x,b.y);game.bullets.splice(i,1);continue}
  const crashed=wallBullet(b)||obstacleBullet(b);if(crashed&&b.dead){if(b.special)specialExplosion(b,b.x,b.y);else splash(b,b.x,b.y);game.bullets.splice(i,1);continue}
  let hit=null;for(const p of game.players){if(!p.alive||!isEnemy(b.owner,p.i))continue;if(Math.hypot(b.x-p.x,b.y-p.y)<b.r+p.r){hit=p;break}}
  if(hit){game.bullets.splice(i,1);damageBullet(hit,b,b.dmg,true);if(b.special)specialExplosion(b,b.x,b.y,hit.i);else splash(b,b.x,b.y)}
}}
function bounceBullet(b,axis){if(b.bounces>0){b.bounces--;b[axis]*=-1}else b.dead=true}
function wallBullet(b){let hit=false;if(b.x<48||b.x>W-48){b.x=Math.max(48,Math.min(W-48,b.x));bounceBullet(b,'vx');hit=true}if(!b.dead&&(b.y<48||b.y>H-48)){b.y=Math.max(48,Math.min(H-48,b.y));bounceBullet(b,'vy');hit=true}return hit}
function obstacleBullet(b){for(const o of obstacles()){if(b.x>o.x-b.r&&b.x<o.x+o.w+b.r&&b.y>o.y-b.r&&b.y<o.y+o.h+b.r){const dx=Math.min(Math.abs(b.x-o.x),Math.abs(b.x-o.x-o.w)),dy=Math.min(Math.abs(b.y-o.y),Math.abs(b.y-o.y-o.h));bounceBullet(b,dx<dy?'vx':'vy');return true}}return false}
function hitBarrel(b){for(const barrel of game.barrels){if(!barrel.alive)continue;if(Math.hypot(b.x-barrel.x,b.y-barrel.y)<b.r+barrel.r){barrel.hp-=b.dmg;if(barrel.hp<=0)explodeBarrel(barrel,b.owner);else shake=Math.max(shake,2);return true}}return false}
function explodeBarrel(barrel,source){if(!barrel.alive)return;barrel.alive=false;shake=Math.max(shake,22);const radius=150;addEffect('barrel',barrel.x,barrel.y,radius,'#ff643f',.48,source);
  for(const p of game.players){if(!p.alive)continue;const d=Math.hypot(p.x-barrel.x,p.y-barrel.y);if(d<radius){const fall=1-d/radius,damage=12+27*fall,dx=(p.x-barrel.x)/(d||1),dy=(p.y-barrel.y)/(d||1);damageRaw(p,damage,source,true,dx*330*fall,dy*330*fall)}}
  for(const other of game.barrels){if(other.alive&&Math.hypot(other.x-barrel.x,other.y-barrel.y)<175){other.hp-=26;if(other.hp<=0)explodeBarrel(other,source)}}
}
function splash(b,x,y){if(!b.boom)return;const radius=58+b.boom*15;addEffect('explosion',x,y,radius,'#ff9a52',.32,b.owner);for(const p of game.players){if(!p.alive||!isEnemy(b.owner,p.i))continue;const d=Math.hypot(p.x-x,p.y-y);if(d<radius){const fall=1-d/radius,damage=(4.5+b.boom*2.2)*fall,dx=(p.x-x)/(d||1),dy=(p.y-y)/(d||1);damageRaw(p,damage,b.owner,false,dx*(120+b.boom*35)*fall,dy*(120+b.boom*35)*fall)}}}
function specialExplosion(b,x,y,directSeat=null){const radius=b.specialRadius||124;shake=Math.max(shake,26);addEffect('cannon',x,y,radius,'#ffd19a',.58,b.owner);for(const p of game.players){if(!p.alive)continue;if(!isEnemy(b.owner,p.i)&&p.i!==directSeat)continue;const d=Math.hypot(p.x-x,p.y-y);if(d<radius){const fall=Math.max(0,1-d/radius),damage=(p.i===directSeat?10:0)+26*fall,dx=(p.x-x)/(d||1),dy=(p.y-y)/(d||1);damageRaw(p,damage,b.owner,false,dx*(b.specialKnock||360)*fall,dy*(b.specialKnock||360)*fall)}}if(b.cluster){for(let k=0;k<3;k++){const a=(Math.PI*2/3)*k+0.4,ex=x+Math.cos(a)*70,ey=y+Math.sin(a)*70;addEffect('cluster',ex,ey,72,'#ffac6e',.34,b.owner);for(const p of game.players){if(!p.alive||!isEnemy(b.owner,p.i))continue;const d=Math.hypot(p.x-ex,p.y-ey);if(d<72){const fall=1-d/72,dx=(p.x-ex)/(d||1),dy=(p.y-ey)/(d||1);damageRaw(p,7*fall,b.owner,false,dx*150*fall,dy*150*fall)}}}}}
function damageRaw(target,amount,source,allowFriendly,kx,ky){if(!target.alive||amount<=0)return;if(!allowFriendly&&source!=null&&!isEnemy(source,target.i))return;target.hp-=amount;if(source!=null&&game.players[source]){const a=game.players[source];a.stats.damage+=amount;if(a.s.leech>0&&source!==target.i)a.hp=Math.min(a.max,a.hp+amount*a.s.leech)}target.vx+=kx||0;target.vy+=ky||0;shake=Math.max(shake,5);if(target.hp<=0)eliminate(target,source)}

function spawnPickup(){const map=MAPS[game.map],pt=map.pickupSpawns[Math.floor(Math.random()*map.pickupSpawns.length)],types=Object.keys(PICKUPS),type=types[Math.floor(Math.random()*types.length)];if(game.pickups.length<2)game.pickups.push({id:Math.random().toString(36).slice(2),x:pt[0],y:pt[1],type,life:14})}
function updatePickups(dt){game.pickupTimer-=dt;if(game.pickupTimer<=0){spawnPickup();game.pickupTimer=8+Math.random()*4}for(let i=game.pickups.length-1;i>=0;i--){const it=game.pickups[i];it.life-=dt;if(it.life<=0){game.pickups.splice(i,1);continue}for(const p of game.players){if(!p.alive)continue;if(Math.hypot(p.x-it.x,p.y-it.y)<p.r+18){if(it.type==='heal')p.hp=Math.min(p.max,p.hp+32);if(it.type==='shield')p.shield=Math.min(p.s.shield+2,p.shield+1);if(it.type==='haste')p.fx.haste=6;p.stats.pickups++;game.pickups.splice(i,1);break}}}}
function addEffect(type,x,y,radius,color,duration,owner=null){if(!game.effects)game.effects=[];game.effects.push({id:Math.random().toString(36).slice(2),type,x,y,radius,color,duration,life:duration,owner})}
function updateEffects(dt){if(!game.effects)return;for(let i=game.effects.length-1;i>=0;i--){game.effects[i].life-=dt;if(game.effects[i].life<=0)game.effects.splice(i,1)}}
function updateStorm(dt){const st=game.storm;if(!st)return;st.elapsed+=dt;if(st.elapsed<st.start){st.active=false;st.radius=760;return}st.active=true;const t=Math.min(1,(st.elapsed-st.start)/st.duration);st.radius=760+(st.minRadius-760)*t;const dps=8+18*t;for(const p of game.players){if(!p.alive)continue;const dx=p.x-W/2,dy=p.y-H/2,d=Math.hypot(dx,dy);if(d>st.radius){const over=Math.min(1,(d-st.radius)/140),push=50+120*t;p.vx+=(-dx/(d||1))*push*dt;p.vy+=(-dy/(d||1))*push*dt;damageRaw(p,dps*(.55+.45*over)*dt,null,true,0,0)}}}
