'use strict';
/*
 * Cowball Online Service — prototype starter.
 * This is not production-secure: no account authentication, anti-cheat or abuse protection.
 * Do not expose it publicly until authentication, rate limiting, TLS, persistence backups,
 * moderation and match-result validation have been added.
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { WebSocketServer, WebSocket } = require('ws');
const PORT = Math.max(1, Math.min(65535, Number(process.env.PORT) || 8080));
const HOST = process.env.HOST || '0.0.0.0';
const DATA_FILE = process.env.COWBALL_DATA_FILE || path.join(__dirname, 'data.json');
const MAX_BODY = 64 * 1024;
const MAX_PROFILES = 10000;
const MAX_TOURNAMENTS = 1000;
const queues = new Map();
const rooms = new Map();
const profileSockets = new Map();
let persistTimer = null;
let db = { profiles: {}, friends: {}, tournaments: [] };

function clamp(n, lo, hi) { n = Number(n); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : lo; }
function cleanText(v, max = 32) { return String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max); }
function validId(v) { const id = String(v || ''); return /^[a-zA-Z0-9._:-]{3,100}$/.test(id) ? id : ''; }
function json(res, status, value) {
  const body = JSON.stringify(value);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body), 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
  res.end(body);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '', size = 0;
    req.on('data', chunk => { size += chunk.length; if (size > MAX_BODY) { reject(new Error('Payload too large')); req.destroy(); return; } raw += chunk; });
    req.on('end', () => { if (!raw) return resolve({}); try { const val = JSON.parse(raw); if (!val || typeof val !== 'object' || Array.isArray(val)) return reject(new Error('JSON object required')); resolve(val); } catch (_) { reject(new Error('Invalid JSON')); } });
    req.on('error', reject);
  });
}
function cleanProfile(raw, id) {
  const prev = db.profiles[id] || {};
  const rating = Math.round(clamp(raw.rating ?? prev.rating ?? 1000, 0, 4000));
  const out = {
    id, name: cleanText(raw.name ?? raw.nickname ?? prev.name ?? 'Игрок', 24) || 'Игрок', rating,
    games: Math.floor(clamp(raw.games ?? prev.games, 0, 1e7)),
    wins: Math.floor(clamp(raw.wins ?? prev.wins, 0, 1e7)),
    losses: Math.floor(clamp(raw.losses ?? prev.losses, 0, 1e7)),
    draws: Math.floor(clamp(raw.draws ?? prev.draws, 0, 1e7)),
    goals: Math.floor(clamp(raw.goals ?? prev.goals, 0, 1e8)),
    xp: Math.floor(clamp(raw.xp ?? prev.xp, 0, 1e9)),
    updatedAt: Date.now()
  };
  return out;
}
function persistSoon() {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    const tmp = DATA_FILE + '.tmp';
    fs.promises.mkdir(path.dirname(DATA_FILE), { recursive: true })
      .then(() => fs.promises.writeFile(tmp, JSON.stringify(db, null, 2), 'utf8'))
      .then(() => fs.promises.rename(tmp, DATA_FILE))
      .catch(err => console.error('[Cowball] persistence failed:', err.message));
  }, 300);
}
function leaderboard(limit = 50) {
  return Object.values(db.profiles).sort((a, b) => (b.rating - a.rating) || (b.wins - a.wins) || (b.xp - a.xp)).slice(0, limit).map(p => ({ id: p.id, name: p.name, rating: p.rating, games: p.games, wins: p.wins, losses: p.losses, draws: p.draws, goals: p.goals, xp: p.xp }));
}
function broadcastLeaderboard() {
  const packet = JSON.stringify({ type: 'leaderboard', items: leaderboard(50) });
  for (const peer of wss.clients) if (peer.readyState === WebSocket.OPEN) peer.send(packet);
}
const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }); return res.end(); }
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (req.method === 'GET' && url.pathname === '/health') return json(res, 200, { ok: true, service: 'Cowball Online Service', version: '0.45.0', profiles: Object.keys(db.profiles).length, matchmakingQueue: queues.size, time: new Date().toISOString() });
    if (req.method === 'GET' && url.pathname === '/api/leaderboard') return json(res, 200, { items: leaderboard(Math.max(1, Math.min(100, Number(url.searchParams.get('limit')) || 50))) });
    let match = url.pathname.match(/^\/api\/profile\/([^/]+)$/);
    if (match) {
      const id = validId(decodeURIComponent(match[1])); if (!id) return json(res, 400, { error: 'Invalid profile id' });
      if (req.method === 'GET') return json(res, 200, { profile: db.profiles[id] || null });
      if (req.method === 'PUT') {
        const body = await readBody(req);
        if (!db.profiles[id] && Object.keys(db.profiles).length >= MAX_PROFILES) return json(res, 507, { error: 'Profile storage limit reached' });
        db.profiles[id] = cleanProfile(body, id); persistSoon(); broadcastLeaderboard();
        return json(res, 200, { ok: true, profile: db.profiles[id] });
      }
    }
    match = url.pathname.match(/^\/api\/friends\/([^/]+)$/);
    if (match) {
      const id = validId(decodeURIComponent(match[1])); if (!id) return json(res, 400, { error: 'Invalid profile id' });
      if (req.method === 'GET') return json(res, 200, { friends: db.friends[id] || [] });
      if (req.method === 'PUT') {
        const body = await readBody(req); const list = Array.isArray(body.friends) ? body.friends.slice(0, 200) : [];
        db.friends[id] = list.map(f => ({ id: validId(f && f.id), name: cleanText(f && f.name, 24) })).filter(f => f.id);
        persistSoon(); return json(res, 200, { ok: true, friends: db.friends[id] });
      }
    }
    if (url.pathname === '/api/tournaments' && req.method === 'GET') return json(res, 200, { items: db.tournaments.slice(0, 50).map(publicTournament) });
    if (url.pathname === '/api/tournaments' && req.method === 'POST') {
      const body = await readBody(req); if (db.tournaments.length >= MAX_TOURNAMENTS) db.tournaments = db.tournaments.slice(-MAX_TOURNAMENTS + 1);
      const count = [4, 8, 16].includes(Number(body.players)) ? Number(body.players) : 8;
      const item = { id: crypto.randomUUID(), name: cleanText(body.name || 'Cowball Cup', 60) || 'Cowball Cup', players: count, entrants: [], status: 'registration', createdAt: Date.now(), creator: validId(body.creator) };
      db.tournaments.unshift(item); persistSoon(); return json(res, 201, { tournament: publicTournament(item) });
    }
    match = url.pathname.match(/^\/api\/tournaments\/([^/]+)\/(join|score)$/);
    if (match && req.method === 'POST') {
      const body = await readBody(req); const t = db.tournaments.find(x => x.id === match[1]); if (!t) return json(res, 404, { error: 'Tournament not found' });
      const id = validId(body.id); if (!id) return json(res, 400, { error: 'Valid player id required' });
      if (match[2] === 'join') { if (t.status !== 'registration') return json(res, 409, { error: 'Registration is closed' }); if (!t.entrants.includes(id) && t.entrants.length < t.players) t.entrants.push(id); if (t.entrants.length >= t.players) t.status = 'ready'; persistSoon(); return json(res, 200, { tournament: publicTournament(t) }); }
      // Scores are deliberately not trusted as official results in this starter backend.
      return json(res, 202, { accepted: false, message: 'Official scores require authenticated match validation.' });
    }
    return json(res, 404, { error: 'Not found' });
  } catch (err) { return json(res, err.message === 'Invalid JSON' ? 400 : err.message === 'Payload too large' ? 413 : 500, { error: err.message || 'Server error' }); }
});
function publicTournament(t) { return { id:t.id, name:t.name, players:t.players, entrants:t.entrants.length, entrantIds:t.entrants.slice(), status:t.status, createdAt:t.createdAt }; }
const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_BODY });
server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname !== '/ws') { socket.write('HTTP/1.1 404 Not Found\r\n\r\n'); socket.destroy(); return; }
  wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws, req));
});
function send(ws, value) { if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(value)); }
function leaveQueue(ws) { for (const [id, item] of queues) if (item.ws === ws) queues.delete(id); }
function pairQueue() {
  const waiting = [...queues.values()].sort((a,b) => a.since - b.since);
  for (let i = 0; i < waiting.length; i++) {
    const a = waiting[i]; if (!queues.has(a.id)) continue;
    const waitSeconds = (Date.now() - a.since) / 1000; const range = Math.min(1600, 180 + waitSeconds * 25);
    const b = waiting.slice(i + 1).find(x => queues.has(x.id) && x.id !== a.id && Math.abs(x.rating - a.rating) <= range);
    if (!b) continue;
    queues.delete(a.id); queues.delete(b.id);
    const roomId = crypto.randomUUID(); rooms.set(roomId, new Set([a.id,b.id]));
    a.ws._cowballPeer = b.ws; b.ws._cowballPeer = a.ws; a.ws._cowballRoom = b.ws._cowballRoom = roomId;
    send(a.ws, { type:'match:found', roomId, opponent:{ id:b.id, name:b.name, rating:b.rating }, signaling:'/ws' });
    send(b.ws, { type:'match:found', roomId, opponent:{ id:a.id, name:a.name, rating:a.rating }, signaling:'/ws' });
  }
}
const pairTimer = setInterval(pairQueue, 800);
wss.on('connection', ws => {
  ws.isAlive = true; ws.on('pong', () => { ws.isAlive = true; });
  send(ws,{ type:'connected', version:'0.45.0' });
  ws.on('message', raw => {
    if (raw.length > MAX_BODY) return ws.close(1009, 'Message too large');
    let m; try { m=JSON.parse(raw.toString()); } catch (_) { return send(ws,{type:'error',message:'Invalid JSON'}); }
    if (!m || typeof m !== 'object') return;
    if (m.type === 'queue:join') {
      const id=validId(m.id); if(!id)return send(ws,{type:'error',message:'Invalid profile id'});
      const name=cleanText(m.name||'Игрок',24)||'Игрок'; const rating=Math.round(clamp(m.rating,0,4000));
      leaveQueue(ws); ws._cowballId=id; queues.set(id,{id,name,rating,ws,since:Date.now()}); send(ws,{type:'queue:waiting',position:queues.size}); pairQueue();
    } else if (m.type === 'queue:cancel') { leaveQueue(ws); send(ws,{type:'queue:cancelled'}); }
    else if (m.type === 'leaderboard:get') send(ws,{type:'leaderboard',items:leaderboard(50)});
    else if (m.type === 'profile:online') { const id=validId(m.id); if(id){profileSockets.set(id,ws); ws._cowballId=id; send(ws,{type:'profile:online-ok',id});} }
    else if (m.type === 'signal:relay') {
      const room=String(m.roomId||'').slice(0,80); const members=rooms.get(room);
      if(!members||!ws._cowballId||!members.has(ws._cowballId))return send(ws,{type:'error',message:'Not a member of signaling room'});
      const peer=ws._cowballPeer;
      if(peer&&peer.readyState===WebSocket.OPEN)send(peer,{type:'signal:relay',roomId:room,from:ws._cowballId,data:m.data});
    } else if (m.type === 'room:leave') { const room=String(m.roomId||''); const members=rooms.get(room);if(members){members.delete(ws._cowballId);if(!members.size)rooms.delete(room);} }
    else if (m.type === 'ping') send(ws,{type:'pong',ts:m.ts||Date.now()});
    else send(ws,{type:'error',message:'Unsupported message type'});
  });
  ws.on('close', () => { leaveQueue(ws); if(ws._cowballId&&profileSockets.get(ws._cowballId)===ws)profileSockets.delete(ws._cowballId); const room=ws._cowballRoom;if(room){const members=rooms.get(room);if(members){members.delete(ws._cowballId);if(!members.size)rooms.delete(room);}if(ws._cowballPeer)send(ws._cowballPeer,{type:'peer:disconnected'});} });
  ws.on('error', () => leaveQueue(ws));
});
const heartbeat=setInterval(()=>{for(const ws of wss.clients){if(ws.isAlive===false){ws.terminate();continue;}ws.isAlive=false;ws.ping();}},30000);
async function loadDb(){try{const parsed=JSON.parse(await fs.promises.readFile(DATA_FILE,'utf8'));if(parsed&&typeof parsed==='object'){db.profiles=parsed.profiles&&typeof parsed.profiles==='object'?parsed.profiles:{};db.friends=parsed.friends&&typeof parsed.friends==='object'?parsed.friends:{};db.tournaments=Array.isArray(parsed.tournaments)?parsed.tournaments.slice(0,MAX_TOURNAMENTS):[];}}catch(err){if(err.code!=='ENOENT')console.warn('[Cowball] Starting with empty data store:',err.message);}}
loadDb().then(()=>server.listen(PORT,HOST,()=>console.log(`[Cowball] API listening on http://${HOST}:${PORT}`)));
function shutdown(){clearInterval(pairTimer);clearInterval(heartbeat);for(const ws of wss.clients)ws.close();server.close(()=>process.exit(0));}
process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
