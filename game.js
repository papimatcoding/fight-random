'use strict';
function buildText(p){const entries=Object.entries(p.powers);return entries.length?entries.slice(-3).map(([id,v])=>{const d=powerDef(id);return(d?d.name:id)+(v>1?' ×'+v:'')}).join(' · '):'sin mejoras'}
function scoreData(s){const m=modeOf(s);if(m.id==='teams')return[{label:'EQUIPO AZUL',score:s.teamScore[0],color:TEAM_COLORS[0]},{label:'EQUIPO ROSA',score:s.teamScore[1],color:TEAM_COLORS[1]}];return s.players.map(p=>({label:(p.i===me?'TÚ · ':'')+(p.name||('P'+(p.i+1))),score:p.score,color:PLAYER_COLORS[p.i]}))}
function syncUI(s){if(!s)return;const m=modeOf(s);$('modeName').textContent=m.name;$('roundNum').textContent=s.round;
  const sb=$('scoreboard');sb.innerHTML='';for(const item of scoreData(s)){const el=document.createElement('div');el.className='score-pill';el.style.borderColor=item.color+'66';el.innerHTML='<span style="color:'+item.color+'">'+item.label+'</span><b>'+item.score+'</b>';sb.appendChild(el)}
  const msg=$('centerMessage');if(s.phase==='count'){msg.textContent=Math.ceil(s.count);msg.classList.remove('hidden')}else if(s.phase==='round'){msg.textContent='RONDA TERMINADA';msg.classList.remove('hidden')}else msg.classList.add('hidden');
  readyUI(s);draftUI(s);endUI(s)
}
function fillModuleSelect(el,table,p,slot,locked){
  const sig=p.character+'|'+slot+'|'+Object.keys(table).join(',');
  if(el.dataset.sig!==sig){
    el.dataset.sig=sig;el.innerHTML='';
    for(const d of Object.values(table)){
      if(!moduleAllowed(p.character,d))continue;
      const o=document.createElement('option');o.value=d.id;o.textContent=d.name+' · '+d.cost+'P';el.appendChild(o)
    }
  }
  el.value=p.loadout?.[slot]||'';el.disabled=locked
}
function workshopUI(p,locked){
  if(!p)return;
  fillModuleSelect($('weaponSelect'),WEAPONS,p,'weapon',locked);
  fillModuleSelect($('specialSelect'),SPECIALS,p,'special',locked);
  fillModuleSelect($('systemSelect'),SYSTEMS,p,'system',locked);
  const w=WEAPONS[p.loadout?.weapon],sp=SPECIALS[p.loadout?.special],sy=SYSTEMS[p.loadout?.system],c=CHASSIS[p.character]||CHASSIS.mix,cost=moduleCost(p.loadout),ok=loadoutValid(p);
  $('weaponDetail').textContent=w?(w.desc+' · alcance '+w.range+(w.recoil?' · retroceso '+w.recoil:'')):'';
  $('specialDetail').textContent=sp?(sp.desc+' · CD '+sp.cd.toFixed(1)+' s'):'';
  $('systemDetail').textContent=sy?sy.desc:'';
  $('capacityText').textContent=cost+' / '+c.capacity;
  $('capacityFill').style.width=Math.min(100,cost/c.capacity*100)+'%';
  $('capacityFill').classList.toggle('over',cost>c.capacity);
  $('loadoutWarning').textContent=ok?loadoutSummary(p):(cost>c.capacity?'Te pasas de capacidad. Cambia una pieza.':'Hay una pieza incompatible con este chasis.');
  $('loadoutWarning').classList.toggle('bad',!ok)
}
function readyUI(s){
  const o=$('readyOverlay');if(s.phase!=='ready'){o.classList.add('hidden');return}
  o.classList.remove('hidden');
  const m=modeOf(s),connected=s.connected.filter(Boolean).length,full=connected===m.players,mineReady=me!=null&&!!s.ready[me],readyCount=s.ready.filter(Boolean).length,p=me!=null?s.players[me]:null,valid=!!p&&loadoutValid(p);
  $('readyTitle').textContent=!full?'TALLER ABIERTO':(mineReady?'MÁQUINA CERRADA':'MONTA TU MÁQUINA');
  $('readySubtitle').textContent=!full?'Puedes preparar la build mientras llega el resto.':(mineReady?'Esperando a que el resto confirme.':'El chasis da la habilidad SPACE. El resto lo decides tú.');
  document.querySelectorAll('.character-card').forEach(b=>{b.classList.toggle('selected',!!p&&p.character===b.dataset.character);b.disabled=mineReady||me==null});
  workshopUI(p,mineReady||me==null);
  $('readyBtn').disabled=!full||mineReady||me==null||!valid;
  $('readyBtn').textContent=!full?'ESPERANDO JUGADORES':(mineReady?'LISTO ✓':(!valid?'CONFIGURACIÓN INVÁLIDA':'ENTRAR A LA ARENA'));
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
  const w=96,h=11,x=p.x-w/2,y=p.y-52,ratio=Math.max(0,p.hp/p.max);ctx.fillStyle='#05070bdd';ctx.fillRect(x-2,y-2,w+4,h+4);ctx.fillStyle=ratio>.45?PLAYER_COLORS[p.i]:(ratio>.2?'#ffd166':'#ff596f');ctx.fillRect(x,y,w*ratio,h);ctx.strokeStyle='#ffffff40';ctx.lineWidth=1.5;ctx.strokeRect(x,y,w,h);ctx.font='900 11px system-ui';ctx.textAlign='center';ctx.fillStyle='#f7f9ff';ctx.fillText(Math.max(0,Math.ceil(p.hp))+' / '+p.max,p.x,y-6);
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
function drawCore(s,n){if(s.mode!=='core'||!s.core)return;const core=s.core,cx=worldW(s)/2,cy=worldH(s)/2;ctx.save();if(core.active){const pulse=1+Math.sin(n*.007)*.05;ctx.translate(cx,cy);ctx.scale(pulse,pulse);ctx.shadowColor='#7df9ff';ctx.shadowBlur=24;ctx.strokeStyle='#7df9ff';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,92,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle='#7df9ff22';ctx.beginPath();ctx.arc(0,0,82,0,Math.PI*2);ctx.fill();if(core.capturer!=null&&core.progress>0){ctx.strokeStyle=PLAYER_COLORS[core.capturer];ctx.lineWidth=9;ctx.beginPath();ctx.arc(0,0,101,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,core.progress/core.required));ctx.stroke()}ctx.fillStyle='#dffcff';ctx.font='900 12px system-ui';ctx.textAlign='center';ctx.fillText('NÚCLEO',0,4)}else if(core.respawn<=5){ctx.fillStyle='#83cbd4';ctx.font='900 12px system-ui';ctx.textAlign='center';ctx.fillText('NÚCLEO EN '+Math.ceil(core.respawn)+' s',cx,cy)}ctx.restore()}
function drawFeedback(s){for(const f of s.feedback||[]){const first=!seenFeedback.has(f.id);if(first){seenFeedback.add(f.id);if(f.owner===me&&f.type==='hit')sound(f.value>=24?420:300,.045,f.value>=24?.04:.022);if(f.owner===me&&f.type==='elimination')sound(150,.13,.055,'sawtooth');if(f.owner===me&&f.type==='core')sound(620,.12,.04,'sine');if(f.owner===me&&f.type==='rarity'){sound(f.label?.includes('ILEGAL')?110:520,.34,.045,f.label?.includes('ILEGAL')?'sawtooth':'sine',f.label?.includes('ILEGAL')?55:880)}if(f.owner===me&&f.type==='synergy')sound(330,.22,.035,'triangle',660)}const life=Math.max(0,f.life/f.maxLife),rise=(1-life)*28;if(f.type==='hit'&&f.owner===me){ctx.save();ctx.globalAlpha=life;ctx.translate(f.x,f.y-rise);ctx.strokeStyle=f.value>=24?'#ffd166':'#ffffff';ctx.lineWidth=f.value>=24?4:2.5;const d=f.value>=24?12:8;ctx.beginPath();ctx.moveTo(-d,-d);ctx.lineTo(-3,-3);ctx.moveTo(d,-d);ctx.lineTo(3,-3);ctx.moveTo(-d,d);ctx.lineTo(-3,3);ctx.moveTo(d,d);ctx.lineTo(3,3);ctx.stroke();ctx.font=(f.value>=24?'950 20px':'900 14px')+' system-ui';ctx.textAlign='center';ctx.fillStyle=f.value>=24?'#ffd166':'#f7f9ff';ctx.fillText(Math.round(f.value),0,-16);ctx.restore()}else if(f.type==='elimination'&&(f.owner===me||f.target===me)){ctx.save();ctx.globalAlpha=Math.min(1,life*1.8);ctx.font='950 30px system-ui';ctx.textAlign='center';ctx.fillStyle=f.owner===me?'#ffd166':'#ff596f';ctx.fillText(f.owner===me?'ELIMINACIÓN':'ELIMINADO',worldW(s)/2,worldH(s)*.22);ctx.restore()}else if(f.type==='core'&&f.owner===me){ctx.save();ctx.globalAlpha=life;ctx.font='950 28px system-ui';ctx.textAlign='center';ctx.fillStyle='#7df9ff';ctx.fillText('SOBRECARGA',worldW(s)/2,worldH(s)*.28);ctx.restore()}else if((f.type==='rarity'||f.type==='synergy')&&f.owner===me){ctx.save();ctx.globalAlpha=Math.min(1,life*1.5);ctx.textAlign='center';ctx.font='950 13px system-ui';ctx.fillStyle=f.type==='synergy'?'#7df9ff':(f.label?.includes('ILEGAL')?'#ff4f68':'#ffbf55');ctx.fillText(f.type==='synergy'?'SINERGIA ACTIVADA':'MEJORA ESPECIAL',worldW(s)/2,worldH(s)*.20);ctx.font='950 30px system-ui';ctx.fillText(f.label||'',worldW(s)/2,worldH(s)*.20+38);ctx.restore()}}}
function drawKillfeed(s){const list=(s.killfeed||[]).slice(0,4);if(!list.length)return;ctx.save();ctx.textAlign='right';let y=82;for(const k of list){const killer=k.killer==null?'ENTORNO':(s.players[k.killer]?.name||('P'+(k.killer+1))),victim=s.players[k.victim]?.name||('P'+(k.victim+1)),alpha=Math.min(1,k.life/.5);ctx.globalAlpha=alpha;ctx.font='900 11px system-ui';const text=killer+'  →  '+victim,w=ctx.measureText(text).width+18,x=worldW(s)-58;ctx.fillStyle='#070a11cc';ctx.fillRect(x-w,y-15,w,24);ctx.fillStyle=k.killer==null?'#9ba5b7':PLAYER_COLORS[k.killer];ctx.fillText(killer,x-ctx.measureText('  →  '+victim).width,y);ctx.fillStyle='#758198';ctx.fillText('  →  ',x-ctx.measureText(victim).width,y);ctx.fillStyle=PLAYER_COLORS[k.victim]||'#fff';ctx.fillText(victim,x,y);y+=29}ctx.restore()}
function drawMine(m,n){
  const armed=m.arm<=0,pulse=1+Math.sin(n*.01+m.x)*.05;ctx.save();ctx.translate(m.x,m.y);ctx.scale(pulse,pulse);ctx.shadowColor=armed?'#ffcf5c':'#7d8797';ctx.shadowBlur=armed?10:3;ctx.fillStyle='#171b22';ctx.strokeStyle=armed?'#ffcf5c':'#7d8797';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,0,m.r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle=armed?'#ffcf5c':'#7d8797';ctx.beginPath();ctx.arc(0,0,4,0,Math.PI*2);ctx.fill();ctx.restore()
}
function drawBarrel(b){if(!b.alive)return;ctx.save();ctx.shadowColor='#ff643f';ctx.shadowBlur=12;ctx.fillStyle='#8d2f24';ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#ff9b61';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#1a0d0b';ctx.font='900 18px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('!',b.x,b.y+1);ctx.restore()}
function draw(s,n){ctx.clearRect(0,0,W,H);const map=MAPS[s?.map||0],ww=map.w||W,hh=map.h||H,sx=W/ww,sy=H/hh;ctx.save();ctx.scale(sx,sy);const grad=ctx.createLinearGradient(0,0,ww,hh);grad.addColorStop(0,map.bg);grad.addColorStop(1,'#07090f');ctx.fillStyle=grad;ctx.fillRect(0,0,ww,hh);drawGrid(ww,hh);ctx.strokeStyle='#303a52';ctx.lineWidth=2;ctx.strokeRect(48,48,ww-96,hh-96);for(const o of map.obs){ctx.fillStyle='#121827';ctx.fillRect(o.x,o.y,o.w,o.h);ctx.strokeStyle='#303a52';ctx.strokeRect(o.x,o.y,o.w,o.h)}if(s){drawStorm(s);drawCore(s,n);s.barrels.forEach(drawBarrel);(s.mines||[]).forEach(m=>drawMine(m,n));(s.pickups||[]).forEach(it=>drawPickup(it,n));drawGroundFires(s,n);s.bullets.forEach(b=>{const bc=b.groundFire?'#ff793f':b.special?'#ffd19a':b.fire?'#ff7a52':b.frost?'#75bfff':b.shock?'#ffe26f':PLAYER_COLORS[b.owner];ctx.save();ctx.shadowColor=bc;ctx.shadowBlur=(b.special||b.groundFire)?24:12;if(b.special){const g=ctx.createRadialGradient(b.x-5,b.y-5,2,b.x,b.y,b.r);g.addColorStop(0,'#fff8dc');g.addColorStop(.35,'#ffc15c');g.addColorStop(1,'#7c351c');ctx.fillStyle=g}else ctx.fillStyle=bc;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();if(b.special){ctx.strokeStyle='#fff0c2';ctx.lineWidth=3;ctx.stroke()}ctx.restore()});drawEffects(s);s.players.forEach(p=>{if(p.alive)drawTurret(p,n)});drawFeedback(s);drawKillfeed(s)}ctx.restore()}
function frame(n){const dt=Math.min(.05,(n-lastFrame)/1000);lastFrame=n;if(!host&&conn?.open&&me!=null){sendAccumulator+=dt;if(sendAccumulator>.033){sendAccumulator=0;conn.send({type:'input',k:mine})}}const s=host?game:view;if(shake){ctx.save();ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);shake*=.8;draw(s,n);ctx.restore()}else draw(s,n);syncUI(s);requestAnimationFrame(frame)}

function pointerPos(e){const r=cv.getBoundingClientRect(),state=host?game:view,ww=state?worldW(state):W,hh=state?worldH(state):H;mine.ax=(e.clientX-r.left)*ww/r.width;mine.ay=(e.clientY-r.top)*hh/r.height}
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;if(['KeyW','KeyA','KeyS','KeyD','Space','KeyE'].includes(e.code))e.preventDefault();if(e.code==='KeyW')mine.u=1;if(e.code==='KeyS')mine.d=1;if(e.code==='KeyA')mine.l=1;if(e.code==='KeyD')mine.r=1;if(e.code==='Space')mine.dash=1;if(e.code==='KeyE')mine.special=1},{passive:false});
addEventListener('keyup',e=>{if(e.code==='KeyW')mine.u=0;if(e.code==='KeyS')mine.d=0;if(e.code==='KeyA')mine.l=0;if(e.code==='KeyD')mine.r=0;if(e.code==='Space')mine.dash=0;if(e.code==='KeyE')mine.special=0});
cv.onpointermove=pointerPos;cv.addEventListener('pointerdown',()=>{try{ensureAudio()?.resume?.()}catch{}},{once:true});cv.onpointerdown=e=>{pointerPos(e);if(e.button===0)mine.fire=1};addEventListener('pointerup',()=>mine.fire=0);addEventListener('blur',()=>{mine.u=mine.d=mine.l=mine.r=mine.fire=mine.dash=mine.special=0});

for(const b of document.querySelectorAll('.mode-card'))b.addEventListener('click',()=>{selectedMode=b.dataset.mode;document.querySelectorAll('.mode-card').forEach(x=>x.classList.toggle('selected',x===b))});
for(const b of document.querySelectorAll('.character-card'))b.addEventListener('click',()=>{if(me==null)return;const id=b.dataset.character;if(host)setCharacter(0,id);else conn?.send({type:'character',id})});
for(const [id,slot] of [['weaponSelect','weapon'],['specialSelect','special'],['systemSelect','system']])$(id).addEventListener('change',e=>{if(me==null)return;const value=e.target.value;if(host)setLoadout(0,slot,value);else conn?.send({type:'loadout',slot,id:value})});
$('hostBtn').onclick=hostGame;
$('joinForm').onsubmit=e=>{e.preventDefault();joinGame($('roomInput').value)};
$('roomInput').oninput=e=>e.target.value=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);
$('leaveBtn').onclick=()=>{const u=new URL(location.href);u.searchParams.delete('room');history.replaceState({},'',u);clean()};
$('copyBtn').onclick=async()=>{const u=new URL(location.href);u.searchParams.set('room',code);try{await navigator.clipboard.writeText(u.toString());$('copyBtn').textContent='COPIADO';setTimeout(()=>$('copyBtn').textContent='COPIAR ENLACE',1200)}catch{prompt('Copia el enlace:',u.toString())}};
$('readyBtn').onclick=()=>{if(me==null)return;if(host)setReady(0,'ready');else conn?.send({type:'ready'})};
$('rematchBtn').onclick=()=>{if(me==null)return;if(host)setReady(0,'rematch');else conn?.send({type:'rematch'})};
$('fullscreenBtn').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('canvasFrame').requestFullscreen()}catch(e){console.warn(e)}};
document.addEventListener('fullscreenchange',()=>{$('fullscreenBtn').textContent=document.fullscreenElement?'SALIR DE PANTALLA COMPLETA':'PANTALLA COMPLETA'});

const invite=new URL(location.href).searchParams.get('room');if(invite)$('roomInput').value=invite.toUpperCase().slice(0,6);
if(typeof Peer==='undefined')status('No se pudo cargar la conexión online. Recarga.',true);else if(invite)setTimeout(()=>joinGame(invite),0);
requestAnimationFrame(frame);