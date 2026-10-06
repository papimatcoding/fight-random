import { createClient } from "npm:@supabase/supabase-js@2.117.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-fr-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const secretBag = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}");
const serviceKey = secretBag.default ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const db = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const MODES: Record<string, number> = { duel: 2, ffa3: 3, teams: 4, core: 2 };
const CHARACTERS = new Set(["mix", "trucks", "lizzy"]);
const ROOM_TTL_MS = 35_000;

class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message = code) {
    super(message); this.status = status; this.code = code;
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}
function fail(error: unknown) {
  if (error instanceof ApiError) return json({ error: error.code, message: error.message }, error.status);
  console.error(error);
  return json({ error: "internal_error" }, 500);
}
function tokenFrom(req: Request) {
  const token = (req.headers.get("x-fr-token") ?? "").trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(token)) throw new ApiError(401, "invalid_token");
  return token;
}
async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
}
function sanitizeNickname(value: unknown) {
  const raw = String(value ?? "").normalize("NFKC").trim();
  const cleaned = raw.replace(/[^\p{L}\p{N}_ .-]/gu, "").replace(/\s+/g, " ").slice(0, 18).trim();
  return cleaned.length >= 2 ? cleaned : "";
}
function safeProfile(p: any) {
  return {
    id: p.id, nickname: p.nickname, matches: p.matches, wins: p.wins,
    kills: p.kills, deaths: p.deaths, damage: Number(p.damage ?? 0),
    rating: p.rating, current_streak: p.current_streak, best_streak: p.best_streak,
  };
}
async function uniqueNickname(base: string) {
  const stem = sanitizeNickname(base) || ("Player" + Math.floor(1000 + Math.random() * 9000));
  for (let i = 0; i < 20; i++) {
    const suffix = i === 0 ? "" : String(Math.floor(10 + Math.random() * 90));
    const candidate = (stem.slice(0, 18 - suffix.length) + suffix).trim();
    const { data, error } = await db.from("fr_players").select("id").ilike("nickname", candidate).limit(1);
    if (error) throw error;
    if (!data?.length) return candidate;
  }
  return "Player" + crypto.randomUUID().slice(0, 8);
}
async function findPlayer(token: string, create = false, requestedName = "") {
  const hash = await sha256(token);
  let { data, error } = await db.from("fr_players").select("*").eq("token_hash", hash).maybeSingle();
  if (error) throw error;
  if (!data && create) {
    const nickname = await uniqueNickname(requestedName);
    const created = await db.from("fr_players")
      .insert({ token_hash: hash, nickname })
      .select("*").single();
    if (created.error) throw created.error;
    data = created.data;
  }
  if (!data) throw new ApiError(401, "unknown_player");
  await db.from("fr_players").update({ last_seen_at: new Date().toISOString() }).eq("id", data.id);
  return data;
}
async function roomByCode(codeRaw: unknown) {
  const code = String(codeRaw ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  if (code.length !== 6) throw new ApiError(400, "invalid_room");
  const { data, error } = await db.from("fr_rooms").select("*").eq("code", code).maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(404, "room_not_found");
  return data;
}
async function activeMembers(roomId: string) {
  const cutoff = new Date(Date.now() - ROOM_TTL_MS).toISOString();
  const { data, error } = await db.from("fr_room_members")
    .select("player_id,seat,character,heartbeat_at,left_at")
    .eq("room_id", roomId)
    .is("left_at", null)
    .gt("heartbeat_at", cutoff);
  if (error) throw error;
  return data ?? [];
}
async function refreshRoomCount(room: any) {
  const members = await activeMembers(room.id);
  await db.from("fr_rooms").update({
    player_count: members.length,
    updated_at: new Date().toISOString(),
  }).eq("id", room.id);
  return members;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "");
    const token = tokenFrom(req);

    if (action === "session") {
      const player = await findPlayer(token, true, sanitizeNickname(body.nickname));
      return json({ ok: true, profile: safeProfile(player) });
    }

    const player = await findPlayer(token, false);

    if (action === "set_profile") {
      const nickname = sanitizeNickname(body.nickname);
      if (!nickname) throw new ApiError(400, "invalid_nickname");
      const { data: taken, error: takenError } = await db.from("fr_players")
        .select("id").ilike("nickname", nickname).neq("id", player.id).limit(1);
      if (takenError) throw takenError;
      if (taken?.length) throw new ApiError(409, "nickname_taken", "Ese nombre ya está en uso.");
      const { data, error } = await db.from("fr_players")
        .update({ nickname, updated_at: new Date().toISOString() })
        .eq("id", player.id).select("*").single();
      if (error) throw error;
      return json({ ok: true, profile: safeProfile(data) });
    }

    if (action === "lobby") {
      const cutoff = new Date(Date.now() - ROOM_TTL_MS).toISOString();
      await db.from("fr_rooms").update({ status: "closed", updated_at: new Date().toISOString() })
        .neq("status", "closed").lt("last_heartbeat_at", cutoff);

      const { data: rooms, error: roomError } = await db.from("fr_rooms")
        .select("id,code,host_player_id,mode,max_players,player_count,created_at,last_heartbeat_at")
        .eq("visibility", "public").eq("status", "waiting")
        .gt("last_heartbeat_at", cutoff).order("created_at", { ascending: false }).limit(24);
      if (roomError) throw roomError;

      const hostIds = [...new Set((rooms ?? []).map((r: any) => r.host_player_id))];
      let hosts: Record<string, any> = {};
      if (hostIds.length) {
        const { data: hostRows, error } = await db.from("fr_players")
          .select("id,nickname,rating").in("id", hostIds);
        if (error) throw error;
        hosts = Object.fromEntries((hostRows ?? []).map((p: any) => [p.id, p]));
      }

      const { data: leaderboard, error: leaderError } = await db.from("fr_players")
        .select("nickname,matches,wins,kills,deaths,rating,best_streak")
        .order("rating", { ascending: false }).order("wins", { ascending: false }).limit(10);
      if (leaderError) throw leaderError;

      const { data: recent, error: recentError } = await db.from("fr_match_players")
        .select("won,character,score,kills,deaths,damage,accuracy,pickups,match_id,fr_matches!inner(mode,finished_at)")
        .eq("player_id", player.id).order("match_id", { ascending: false }).limit(5);
      if (recentError) throw recentError;

      return json({
        ok: true,
        profile: safeProfile(player),
        rooms: (rooms ?? []).map((r: any) => ({
          code: r.code, mode: r.mode, players: r.player_count, maxPlayers: r.max_players,
          host: hosts[r.host_player_id]?.nickname ?? "Jugador",
          hostRating: hosts[r.host_player_id]?.rating ?? 1000,
        })),
        leaderboard: leaderboard ?? [],
        recent: recent ?? [],
      });
    }

    if (action === "create_room") {
      const mode = String(body.mode ?? "duel");
      if (!(mode in MODES)) throw new ApiError(400, "invalid_mode");
      const code = String(body.code ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
      if (code.length !== 6) throw new ApiError(400, "invalid_room");
      const visibility = body.visibility === "private" ? "private" : "public";

      await db.from("fr_rooms").update({ status: "closed", updated_at: new Date().toISOString() })
        .eq("host_player_id", player.id).neq("status", "closed");

      const { data: room, error } = await db.from("fr_rooms").insert({
        code, host_player_id: player.id, mode, visibility,
        status: "waiting", max_players: MODES[mode], player_count: 1,
        build_version: String(body.buildVersion ?? "web").slice(0, 32),
      }).select("*").single();
      if (error) {
        if (error.code === "23505") throw new ApiError(409, "room_code_conflict");
        throw error;
      }
      const member = await db.from("fr_room_members").insert({
        room_id: room.id, player_id: player.id, seat: 0,
        character: CHARACTERS.has(body.character) ? body.character : "mix",
      });
      if (member.error) throw member.error;
      return json({ ok: true, room: { code, mode, seat: 0, visibility } });
    }

    if (action === "join_room") {
      const room = await roomByCode(body.code);
      if (room.status !== "waiting") throw new ApiError(409, "room_not_waiting");
      if (Date.now() - new Date(room.last_heartbeat_at).getTime() > ROOM_TTL_MS)
        throw new ApiError(410, "room_stale");

      const staleCutoff = new Date(Date.now() - ROOM_TTL_MS).toISOString();
      await db.from("fr_room_members").update({ left_at: new Date().toISOString() })
        .eq("room_id", room.id).is("left_at", null).lt("heartbeat_at", staleCutoff);

      const existing = await db.from("fr_room_members")
        .select("*").eq("room_id", room.id).eq("player_id", player.id).maybeSingle();
      if (existing.error) throw existing.error;

      let seat: number;
      if (existing.data && existing.data.left_at === null) {
        seat = existing.data.seat;
        await db.from("fr_room_members").update({ heartbeat_at: new Date().toISOString() })
          .eq("room_id", room.id).eq("player_id", player.id);
      } else {
        const members = await activeMembers(room.id);
        const used = new Set(members.map((m: any) => m.seat));
        const requestedSeat = Number(body.seat);
        if (Number.isInteger(requestedSeat) && requestedSeat >= 0 && requestedSeat < room.max_players && !used.has(requestedSeat)) {
          seat = requestedSeat;
        } else {
          seat = [...Array(room.max_players).keys()].find(i => !used.has(i)) ?? -1;
        }
        if (seat < 0) throw new ApiError(409, "room_full");
        const payload = {
          room_id: room.id, player_id: player.id, seat,
          character: CHARACTERS.has(body.character) ? body.character : "mix",
          joined_at: new Date().toISOString(), heartbeat_at: new Date().toISOString(), left_at: null,
        };
        const joined = await db.from("fr_room_members")
          .upsert(payload, { onConflict: "room_id,player_id" });
        if (joined.error) throw joined.error;
      }
      const members = await refreshRoomCount(room);
      return json({ ok: true, room: { code: room.code, mode: room.mode, seat, players: members.length, maxPlayers: room.max_players } });
    }

    if (action === "heartbeat") {
      const room = await roomByCode(body.code);
      const character = CHARACTERS.has(body.character) ? body.character : "mix";
      const now = new Date().toISOString();
      const { data: membership, error: memberError } = await db.from("fr_room_members")
        .select("seat").eq("room_id", room.id).eq("player_id", player.id).is("left_at", null).maybeSingle();
      if (memberError) throw memberError;
      if (!membership) throw new ApiError(403, "not_in_room");

      await db.from("fr_room_members").update({ heartbeat_at: now, character })
        .eq("room_id", room.id).eq("player_id", player.id);

      if (room.host_player_id === player.id) {
        const status = body.status === "playing" ? "playing" : "waiting";
        await db.from("fr_rooms").update({ last_heartbeat_at: now, status, updated_at: now })
          .eq("id", room.id);
      }
      const members = await refreshRoomCount(room);
      return json({ ok: true, players: members.length });
    }

    if (action === "leave_room") {
      const room = await roomByCode(body.code);
      const now = new Date().toISOString();
      await db.from("fr_room_members").update({ left_at: now, heartbeat_at: now })
        .eq("room_id", room.id).eq("player_id", player.id);
      if (room.host_player_id === player.id) {
        await db.from("fr_rooms").update({ status: "closed", player_count: 0, updated_at: now }).eq("id", room.id);
      } else {
        await refreshRoomCount(room);
      }
      return json({ ok: true });
    }

    if (action === "record_match") {
      const room = await roomByCode(body.code);
      if (room.host_player_id !== player.id) throw new ApiError(403, "host_only");
      const clientMatchId = String(body.clientMatchId ?? "");
      if (!/^[0-9a-f-]{36}$/i.test(clientMatchId)) throw new ApiError(400, "invalid_match_id");
      const mode = String(body.mode ?? room.mode);
      if (!(mode in MODES)) throw new ApiError(400, "invalid_mode");
      const players = Array.isArray(body.players) ? body.players.slice(0, 4) : [];
      const { data, error } = await db.rpc("fr_record_match", {
        p_host_player_id: player.id,
        p_room_code: room.code,
        p_client_match_id: clientMatchId,
        p_mode: mode,
        p_rounds: Number(body.rounds ?? 0),
        p_duration_seconds: Number(body.durationSeconds ?? 0),
        p_winner_seat: body.winnerSeat == null ? null : Number(body.winnerSeat),
        p_winner_team: body.winnerTeam == null ? null : Number(body.winnerTeam),
        p_players: players,
        p_build_version: String(body.buildVersion ?? "web").slice(0, 32),
      });
      if (error) throw error;
      return json({ ok: true, matchId: data });
    }

    throw new ApiError(404, "unknown_action");
  } catch (error) {
    return fail(error);
  }
});