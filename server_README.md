# Cowball Online Service (prototype)

Optional backend for the GitHub Pages frontend. Includes a health endpoint, local-demo profile storage, a public leaderboard endpoint, basic friend-list storage, tournament registration, an approximate-rating matchmaking queue and a WebSocket signaling relay primitive.

## Run locally

```bash
cd server
npm install
npm start
```

The service listens on `http://localhost:8080`. Open `http://localhost:8080/health` to check it.

## Deploying

Deploy this folder as a Node.js service on a host that supports persistent storage and WebSockets. Add the public service URL in Cowball → ⚡ Cowball v45 → Онлайн-сервис. For a public HTTPS website, the API URL should be `https://...`; WebSocket is inferred as `wss://.../ws`.

## Important security limits

This is a starter implementation, not a production service. It intentionally does **not** treat client-submitted match scores as authoritative. Before public release, add account identity/authentication, rate limits, input-abuse controls, origin policy, persistent database/backups, moderation, TLS, anti-cheat, matchmaking cleanup and server-validated match results. The queue currently pairs users but Cowball's existing P2P code-exchange match flow is not automatically replaced by this queue yet. The signaling relay is a building block, not a complete integrated ranked match path.
