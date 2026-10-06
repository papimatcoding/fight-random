'use strict';

const FR_API='https://xtekdrkqgfjnnwawyoim.supabase.co/functions/v1/fight-random-api';
const FR_BUILD='2026.10-live-1';
const FRStore={
  token:'',
  profile:null,
  lobby:{rooms:[],leaderboard:[],recent:[]},
  heartbeat:null,
  roomCode:'',
  recorded:new Set(),
  online:false,
  initPromise:null
};

function frToken(){
  let token=localStorage.getItem('fr-player-token')||'';
  if(!/^[a-f0-9]{64}$/.test(token)){
    const b=new Uint8Array(32);crypto.getRandomValues(b);
    token=[...b].map(x=>x.toString(16).padStart(2,'0')).join('');
    localStorage.setItem('fr-player-token',token);
  }
  FRStore.token=token;
  return token;
}
async function frApi(action,payload={},timeout=6500){
  const ctrl=new AbortController(),to=setTimeout(()=>ctrl.abort(),timeout);
  try{
    const r=await fetch(FR_API,{
      method:'POST',
      headers:{'content-type':'application/json','x-fr-token':frToken()},
      body:JSON.stringify({action,...payload}),
      signal:ctrl.signal
    });
    const data=await r.json().catch(()=>({}));
    if(!r.ok)throw Object.assign(new Error(data.message||data.error||'backend_error'),{code:data.error,status:r.status});
    FRStore.online=true;frBackendIndicator(true);
    return data;
  }finally{clearTimeout(to)}
}
function frBackendIndicator(on){
  FRStore.online=!!on;
  const el=document.getElementById('backendText'),pill=document.getElementById('backendPill');
  if(el)el.textContent=on?'perfil online':'modo local';
  if(pill)pill.classList.toggle('online',!!on);
}
function frPlayerName(){return FRStore.profile?.nickname||localStorage.getItem('fr-nickname')||'Jugador'}
function frCurrentCharacter(){
  const state=window.host?window.game:window.view;
  const seat=window.me;
  return seat!=null&&state?.players?.[seat]?.character||'mix'
}
function frVisibility(){return document.getElementById('roomVisibility')?.value==='private'?'private':'public'}
function frProfileText(p){
  if(!p)return'';
  const wr=p.matches?Math.round(p.wins/p.matches*100):0;
  return p.rating+' rating · '+p.wins+'W / '+Math.max(0,p.matches-p.wins)+'L · '+wr+'%';
}
function frRenderProfile(){
  const p=FRStore.profile;
  const name=document.getElementById('profileName'),meta=document.getElementById('profileMeta'),input=document.getElementById('nicknameInput');
  if(name)name.textContent=p?.nickname||'Jugador';
  if(meta)meta.textContent=p?frProfileText(p):'perfil local';
  if(input&&!input.matches(':focus'))input.value=p?.nickname||localStorage.getItem('fr-nickname')||'';
}
function frModeLabel(id){return({duel:'1V1',ffa3:'1V1V1',teams:'2V2',core:'NÚCLEO'})[id]||id}
function frRenderLobby(){
  frRenderProfile();
  const rooms=document.getElementById('publicRooms');
  if(rooms){
    rooms.innerHTML='';
    const list=FRStore.lobby.rooms||[];
    if(!list.length){rooms.innerHTML='<div class="empty-state">No hay salas públicas. Crea una y que empiece el lío.</div>'}
    for(const r of list){
      const row=document.createElement('button');row.type='button';row.className='room-row';
      row.innerHTML='<span><b>'+frModeLabel(r.mode)+'</b><small>'+escapeHtml(r.host)+' · '+r.hostRating+' rating</small></span><strong>'+r.players+'/'+r.maxPlayers+'</strong>';
      row.onclick=()=>window.joinGame?.(r.code);
      rooms.appendChild(row);
    }
  }
  const lb=document.getElementById('leaderboardRows');
  if(lb){
    lb.innerHTML='';
    (FRStore.lobby.leaderboard||[]).forEach((p,i)=>{
      const row=document.createElement('div');row.className='leader-row';
      row.innerHTML='<span class="rank">#'+(i+1)+'</span><b>'+escapeHtml(p.nickname)+'</b><span>'+p.rating+'</span><small>'+p.wins+'W · '+p.kills+'K</small>';
      lb.appendChild(row);
    });
    if(!FRStore.lobby.leaderboard?.length)lb.innerHTML='<div class="empty-state">Aún no hay ranking.</div>';
  }
  const recent=document.getElementById('recentMatches');
  if(recent){
    recent.innerHTML='';
    for(const m of FRStore.lobby.recent||[]){
      const mode=m.fr_matches?.mode||'duel';
      const row=document.createElement('div');row.className='recent-row '+(m.won?'win':'loss');
      row.innerHTML='<b>'+(m.won?'VICTORIA':'DERROTA')+'</b><span>'+frModeLabel(mode)+' · '+String(m.character||'mix').toUpperCase()+'</span><small>'+m.kills+'K / '+m.deaths+'D · '+Math.round(Number(m.damage||0))+' dmg</small>';
      recent.appendChild(row);
    }
    if(!FRStore.lobby.recent?.length)recent.innerHTML='<div class="empty-state">Juega una partida y aparecerá aquí.</div>';
  }
}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

async function frInit(){
  if(FRStore.initPromise)return FRStore.initPromise;
  FRStore.initPromise=(async()=>{
    try{
      const stored=localStorage.getItem('fr-nickname')||'';
      const data=await frApi('session',{nickname:stored});
      FRStore.profile=data.profile;localStorage.setItem('fr-nickname',data.profile.nickname);
      frRenderProfile();
      await frRefreshLobby();
    }catch(e){
      console.warn('Backend unavailable:',e);
      frBackendIndicator(false);frRenderProfile();
    }
  })();
  return FRStore.initPromise;
}
async function frRefreshLobby(){
  try{
    const data=await frApi('lobby');
    FRStore.profile=data.profile||FRStore.profile;
    FRStore.lobby={rooms:data.rooms||[],leaderboard:data.leaderboard||[],recent:data.recent||[]};
    frRenderLobby();return FRStore.lobby;
  }catch(e){console.warn('Lobby refresh failed:',e);frBackendIndicator(false);return FRStore.lobby}
}
async function frSetNickname(name){
  const cleaned=String(name||'').trim().slice(0,18);
  if(cleaned.length<2)throw new Error('Nombre demasiado corto');
  const data=await frApi('set_profile',{nickname:cleaned});
  FRStore.profile=data.profile;localStorage.setItem('fr-nickname',data.profile.nickname);frRenderProfile();return data.profile;
}
async function frCreateRoom(code,mode,character='mix'){
  await frInit();
  try{
    const data=await frApi('create_room',{code,mode,visibility:frVisibility(),character,buildVersion:FR_BUILD});
    FRStore.roomCode=code;frStartHeartbeat(code);return data;
  }catch(e){console.warn('Room publish failed:',e);frBackendIndicator(false);return null}
}
async function frJoinRoom(code,seat,character='mix'){
  await frInit();
  try{
    const data=await frApi('join_room',{code,seat,character});
    FRStore.roomCode=code;frStartHeartbeat(code);return data;
  }catch(e){console.warn('Room join backend failed:',e);return null}
}
function frStartHeartbeat(code){
  clearInterval(FRStore.heartbeat);FRStore.roomCode=code;
  const beat=async()=>{
    if(!FRStore.roomCode)return;
    const state=window.host?window.game:window.view;
    const phase=state?.phase;
    const status=phase&&phase!=='ready'&&phase!=='end'?'playing':'waiting';
    try{await frApi('heartbeat',{code:FRStore.roomCode,status,character:frCurrentCharacter()},4500)}catch(e){console.warn('heartbeat',e)}
  };
  beat();FRStore.heartbeat=setInterval(beat,9000);
}
async function frLeaveRoom(){
  const old=FRStore.roomCode;if(!old)return;
  FRStore.roomCode='';clearInterval(FRStore.heartbeat);FRStore.heartbeat=null;
  try{await frApi('leave_room',{code:old},3500)}catch{}
  setTimeout(frRefreshLobby,350);
}
async function frQuickPlay(){
  const btn=document.getElementById('quickPlayBtn');if(btn)btn.disabled=true;
  try{
    await frInit();const lobby=await frRefreshLobby();
    const room=(lobby.rooms||[]).find(r=>r.mode===window.selectedMode&&r.players<r.maxPlayers);
    if(room)window.joinGame?.(room.code);else window.hostGame?.();
  }finally{if(btn)setTimeout(()=>btn.disabled=false,700)}
}
async function frRecordMatch(g){
  if(!window.host||!g?.clientMatchId||FRStore.recorded.has(g.clientMatchId)||!FRStore.roomCode)return;
  FRStore.recorded.add(g.clientMatchId);
  const winnerSeat=g.matchWinner?.type==='player'?g.matchWinner.seat:null;
  const winnerTeam=g.matchWinner?.type==='team'?g.matchWinner.team:null;
  const players=g.players.map(p=>({
    seat:p.i,team:p.team,character:p.character,score:p.score,
    kills:p.stats.kills,deaths:p.stats.deaths,damage:Math.round(p.stats.damage),
    accuracy:p.stats.shots?Math.round(p.stats.hits/p.stats.shots*10000)/100:0,
    pickups:p.stats.pickups
  }));
  try{
    await frApi('record_match',{
      code:FRStore.roomCode,clientMatchId:g.clientMatchId,mode:g.mode,rounds:g.round,
      durationSeconds:Math.max(0,Math.round((Date.now()-(g.startedAt||Date.now()))/1000)),
      winnerSeat,winnerTeam,players,buildVersion:FR_BUILD
    },8000);
    await frRefreshLobby();
  }catch(e){console.warn('Match record failed:',e);FRStore.recorded.delete(g.clientMatchId)}
}

document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('saveNicknameBtn')?.addEventListener('click',async()=>{
    const input=document.getElementById('nicknameInput'),msg=document.getElementById('profileMessage');
    try{await frSetNickname(input?.value||'');if(msg)msg.textContent='Guardado.'}
    catch(e){if(msg)msg.textContent=e.message||'No se pudo guardar.'}
  });
  document.getElementById('nicknameInput')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();document.getElementById('saveNicknameBtn')?.click()}});
  document.getElementById('quickPlayBtn')?.addEventListener('click',frQuickPlay);
  frInit();
  setInterval(()=>{if(!document.hidden&&!document.getElementById('lobby')?.classList.contains('hidden'))frRefreshLobby()},10000);
});
