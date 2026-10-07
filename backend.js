'use strict';

const FR_API='https://xtekdrkqgfjnnwawyoim.supabase.co/functions/v1/fight-random-api';
const FR_BUILD='2026.10-polish-2';
const FRStore={
  token:'',
  profile:null,
  lobby:{rooms:[],leaderboard:[],recent:[],social:{friends:[],incoming:[],outgoing:[],invites:[]}},
  pendingInviteFriend:'',
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
function frSyncNicknameToRoom(name){
  const safe=String(name||'Jugador').slice(0,18);
  try{
    const state=typeof host!=='undefined'&&host?game:view;
    const seat=typeof me!=='undefined'?me:null;
    if(seat!=null&&state?.players?.[seat])state.players[seat].name=safe;
    if(typeof host!=='undefined'&&host&&typeof broadcast==='function')broadcast(true);
    else if(typeof conn!=='undefined'&&conn?.open)conn.send({type:'profile',name:safe});
  }catch(e){console.warn('Nickname room sync failed:',e)}
}
function frCurrentCharacter(){
  const state=typeof host!=='undefined'&&host?game:view;
  const seat=typeof me!=='undefined'?me:null;
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
  if(name)name.textContent=p?.nickname||'Jugador';const party=document.getElementById('partySelfName');if(party)party.textContent=p?.nickname||'Jugador';
  if(meta)meta.textContent=p?frProfileText(p):'perfil local';
  if(input&&!input.matches(':focus'))input.value=p?.nickname||localStorage.getItem('fr-nickname')||'';
}
function frModeLabel(id){return({duel:'1V1',ffa3:'1V1V1',teams:'2V2',core:'NÚCLEO'})[id]||id}
function frSetSocial(social){
  FRStore.lobby.social=social||{friends:[],incoming:[],outgoing:[],invites:[]};
  frRenderSocial()
}
function frRenderSocial(){
  const social=FRStore.lobby.social||{},friends=social.friends||[],incoming=social.incoming||[],outgoing=social.outgoing||[],invites=social.invites||[];
  const badge=document.getElementById('friendsBadge'),total=incoming.length+invites.length;
  if(badge){badge.textContent=String(total);badge.classList.toggle('hidden',!total)}
  const fc=document.getElementById('friendCount'),rc=document.getElementById('requestCount'),ic=document.getElementById('inviteCount');
  if(fc)fc.textContent=String(friends.length);if(rc)rc.textContent=String(incoming.length+outgoing.length);if(ic)ic.textContent=String(invites.length);

  const inviteBox=document.getElementById('friendInvites');
  if(inviteBox){
    inviteBox.innerHTML='';
    for(const x of invites){
      const row=document.createElement('div');row.className='friend-row invite-row';
      row.innerHTML='<span class="friend-status online"></span><span class="friend-copy"><b>'+escapeHtml(x.from)+'</b><small>te invita a '+escapeHtml(frModeLabel(x.mode))+'</small></span><span class="friend-actions"><button class="secondary compact" data-accept>ENTRAR</button><button class="ghost compact" data-decline>×</button></span>';
      row.querySelector('[data-accept]').onclick=()=>frFriendInviteRespond(x.id,true);
      row.querySelector('[data-decline]').onclick=()=>frFriendInviteRespond(x.id,false);
      inviteBox.appendChild(row)
    }
    if(!invites.length)inviteBox.innerHTML='<div class="empty-state">Sin invitaciones.</div>'
  }

  const reqBox=document.getElementById('friendRequests');
  if(reqBox){
    reqBox.innerHTML='';
    for(const x of incoming){
      const row=document.createElement('div');row.className='friend-row';
      row.innerHTML='<span class="friend-status '+(x.online?'online':'')+'"></span><span class="friend-copy"><b>'+escapeHtml(x.nickname)+'</b><small>'+x.rating+' rating · quiere añadirte</small></span><span class="friend-actions"><button class="secondary compact" data-ok>ACEPTAR</button><button class="ghost compact" data-no>NO</button></span>';
      row.querySelector('[data-ok]').onclick=()=>frFriendRespond(x.friendshipId,true);
      row.querySelector('[data-no]').onclick=()=>frFriendRespond(x.friendshipId,false);
      reqBox.appendChild(row)
    }
    for(const x of outgoing){
      const row=document.createElement('div');row.className='friend-row pending';
      row.innerHTML='<span class="friend-status"></span><span class="friend-copy"><b>'+escapeHtml(x.nickname)+'</b><small>solicitud enviada</small></span><span class="friend-actions"><span class="pending-label">PENDIENTE</span></span>';
      reqBox.appendChild(row)
    }
    if(!incoming.length&&!outgoing.length)reqBox.innerHTML='<div class="empty-state">Sin solicitudes.</div>'
  }

  const friendBox=document.getElementById('friendsList'),picker=document.getElementById('friendPickerList');
  const renderFriend=(x,forPicker=false)=>{
    const row=document.createElement('div');row.className='friend-row';
    row.innerHTML='<span class="friend-status '+(x.online?'online':'')+'"></span><span class="friend-copy"><b>'+escapeHtml(x.nickname)+'</b><small>'+x.rating+' rating · '+(x.online?'online':'offline')+'</small></span><span class="friend-actions"><button class="secondary compact" data-play>'+(forPicker?'INVITAR':'AMISTOSA')+'</button>'+(forPicker?'':'<button class="ghost compact" data-remove>×</button>')+'</span>';
    row.querySelector('[data-play]').onclick=()=>forPicker?frInviteFriend(x.id):frStartFriendlyWithFriend(x.id);
    const remove=row.querySelector('[data-remove]');if(remove)remove.onclick=()=>frFriendRemove(x.friendshipId);
    return row
  };
  if(friendBox){
    friendBox.innerHTML='';for(const x of friends)friendBox.appendChild(renderFriend(x,false));
    if(!friends.length)friendBox.innerHTML='<div class="empty-state">Añade a alguien por su apodo.</div>'
  }
  if(picker){
    picker.innerHTML='';for(const x of friends)picker.appendChild(renderFriend(x,true));
    if(!friends.length)picker.innerHTML='<div class="empty-state">No tienes amigos todavía.</div>'
  }
}
function frRenderLobby(){
  frRenderProfile();frRenderSocial();
  const rooms=document.getElementById('publicRooms');
  if(rooms){
    rooms.innerHTML='';
    const list=FRStore.lobby.rooms||[];
    if(!list.length){rooms.innerHTML='<div class="empty-state">No hay salas públicas. Crea una y que empiece el lío.</div>'}
    for(const r of list){
      const row=document.createElement('button');row.type='button';row.className='room-row';
      row.innerHTML='<span><b>'+frModeLabel(r.mode)+'</b><small>'+escapeHtml(r.host)+' · '+r.hostRating+' rating</small></span><strong>'+r.players+'/'+r.maxPlayers+'</strong>';
      row.onclick=()=>{if(typeof garageCanQueue==='function'&&!garageCanQueue()){if(typeof status==='function')status('Completa una máquina válida antes de entrar.',true);return}if(typeof setQueueIntent==='function')setQueueIntent('quick');joinGame?.(r.code)};
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
      const hadToken=/^[a-f0-9]{64}$/.test(localStorage.getItem('fr-player-token')||'');
      const data=await frApi('session',{nickname:hadToken?'':stored});
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
    FRStore.lobby={rooms:data.rooms||[],leaderboard:data.leaderboard||[],recent:data.recent||[],social:data.social||{friends:[],incoming:[],outgoing:[],invites:[]}};
    frRenderLobby();return FRStore.lobby;
  }catch(e){console.warn('Lobby refresh failed:',e);frBackendIndicator(false);return FRStore.lobby}
}
async function frSetNickname(name){
  const cleaned=String(name||'').trim().slice(0,18);
  if(cleaned.length<2)throw new Error('Nombre demasiado corto');
  const data=await frApi('set_profile',{nickname:cleaned});
  if(!data?.profile?.nickname)throw new Error('El servidor no confirmó el nombre.');
  FRStore.profile=data.profile;
  localStorage.setItem('fr-nickname',data.profile.nickname);
  frSyncNicknameToRoom(data.profile.nickname);
  frRenderProfile();
  const input=document.getElementById('nicknameInput');if(input)input.value=data.profile.nickname;
  try{
    const verified=await frApi('lobby');
    if(verified?.profile?.nickname){
      FRStore.profile=verified.profile;
      localStorage.setItem('fr-nickname',verified.profile.nickname);
      frRenderProfile();
    }
  }catch(e){console.warn('Nickname verification refresh failed:',e)}
  return FRStore.profile;
}
async function frCreateRoom(code,mode,character='mix'){
  await frInit();
  try{
    const data=await frApi('create_room',{code,mode,visibility:frVisibility(),character,buildVersion:FR_BUILD});
    FRStore.roomCode=code;frStartHeartbeat(code);
    if(FRStore.pendingInviteFriend){const friendId=FRStore.pendingInviteFriend;FRStore.pendingInviteFriend='';try{await frInviteFriend(friendId,code)}catch(e){console.warn('Friend invite failed:',e)}}
    return data;
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
    const state=typeof host!=='undefined'&&host?game:view;
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
  const btn=document.getElementById('quickPlayBtn');
  if(typeof garageCanQueue==='function'&&!garageCanQueue()){if(typeof status==='function')status('Completa una máquina válida.',true);return}
  if(btn)btn.disabled=true;
  const visibility=document.getElementById('roomVisibility');if(visibility)visibility.value='public';
  if(typeof setQueueIntent==='function')setQueueIntent('quick');
  try{
    await frInit();const lobby=await frRefreshLobby();
    const candidates=(lobby.rooms||[]).filter(r=>r.mode===selectedMode&&r.players<r.maxPlayers);
    const room=candidates.length?candidates[Math.floor(Math.random()*candidates.length)]:null;
    if(room)joinGame?.(room.code);else hostGame?.();
  }finally{if(btn)setTimeout(()=>{btn.disabled=typeof garageCanQueue==='function'?!garageCanQueue():false},700)}
}
async function frFriendRequest(nickname){
  const data=await frApi('friend_request',{nickname});frSetSocial(data.social);return data
}
async function frFriendRespond(friendshipId,accept){
  const data=await frApi('friend_respond',{friendshipId,accept:!!accept});frSetSocial(data.social);return data
}
async function frFriendRemove(friendshipId){
  const data=await frApi('friend_remove',{friendshipId});frSetSocial(data.social);return data
}
async function frInviteFriend(friendId,roomCode=FRStore.roomCode){
  if(!roomCode)throw new Error('Primero crea una partida amistosa.');
  await frApi('friend_invite',{friendId,code:roomCode});
  const msg=document.getElementById('friendMessage');if(msg)msg.textContent='Invitación enviada.';
  return true
}
function frStartFriendlyWithFriend(friendId){
  if(typeof garageCanQueue==='function'&&!garageCanQueue()){if(typeof status==='function')status('Completa una máquina válida primero.',true);return}
  FRStore.pendingInviteFriend=friendId;
  const visibility=document.getElementById('roomVisibility');if(visibility)visibility.value='private';
  if(typeof setQueueIntent==='function')setQueueIntent('friendly');
  hostGame?.()
}
async function frFriendInviteRespond(inviteId,accept){
  const data=await frApi('friend_invite_respond',{inviteId,accept:!!accept});
  if(!accept){frSetSocial(data.social);return}
  if(typeof setQueueIntent==='function')setQueueIntent('friendly');
  if(data.code)joinGame?.(data.code)
}
window.frInviteFriend=frInviteFriend;
async function frRecordMatch(g){
  if(!(typeof host!=='undefined'&&host)||!g?.clientMatchId||FRStore.recorded.has(g.clientMatchId)||!FRStore.roomCode)return;
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
  document.getElementById('friendAddForm')?.addEventListener('submit',async e=>{
    e.preventDefault();const input=document.getElementById('friendNameInput'),msg=document.getElementById('friendMessage');
    try{await frFriendRequest(input?.value||'');if(input)input.value='';if(msg)msg.textContent='Solicitud enviada.'}
    catch(err){if(msg)msg.textContent=err.message||'No se pudo enviar.'}
  });
  document.getElementById('saveNicknameBtn')?.addEventListener('click',async()=>{
    const input=document.getElementById('nicknameInput'),msg=document.getElementById('profileMessage'),btn=document.getElementById('saveNicknameBtn');
    if(btn){btn.disabled=true;btn.textContent='GUARDANDO…'}if(msg)msg.textContent='';
    try{
      const p=await frSetNickname(input?.value||'');
      if(msg)msg.textContent='Guardado como '+p.nickname+'.';
      document.getElementById('profileEdit')?.classList.add('hidden');
    }catch(e){if(msg)msg.textContent=e.message||'No se pudo guardar.'}
    finally{if(btn){btn.disabled=false;btn.textContent='GUARDAR'}}
  });
  document.getElementById('nicknameInput')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();document.getElementById('saveNicknameBtn')?.click()}});
  document.getElementById('quickPlayBtn')?.addEventListener('click',frQuickPlay);
  frInit();
  setInterval(()=>{if(!document.hidden&&!document.getElementById('lobby')?.classList.contains('hidden'))frRefreshLobby()},10000);
});
