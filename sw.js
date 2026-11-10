/* Cowball service worker (v50): offline play.
   - code/pages: network first, cache fallback (updates arrive immediately when online)
   - audio/images/Three.js: cache first
   - the page asks us to "warm" the cache with every file listed below after the first start. */
const VERSION = 'cowball-v51-0';
const CODE = ['./', 'index.html', 'manifest.webmanifest', 'cowball-icon.png', 'three.min.js',
  'cowball.css', 'cowball-v45.css', 'cowball-v46.css', 'cowball-v47-ui.css', 'cowball-v49-ceremony.css',
  'three-loader.js', 'cowball-physics.js', 'cowball-ai.js', 'cowball-rosters.js', 'cowball-core.js', 'ui-effects.js',
  'cowball-v44-navigation.js', 'cowball-v45-lab.js', 'cowball-v46-perf.js', 'cowball-v47-ui.js', 'cowball-v49-ceremony.js', 'cowball-v50-a11y.js', 'cowball-v2.js', 'assets/sim.worker.js'];
const MEDIA = ['ball-pebble.png', 'grass-field.png', 'kit-weave.png', 'stadium-concrete.png', 'stadium-seats.png',
  'ball-bounce', 'ball-impact', 'ball-pass', 'card-flick', 'ceremony-closing', 'ceremony-opening', 'coin-toss', 'confetti-cannon',
  'cow-moo', 'crowd-applause', 'crowd-boo', 'crowd-chant', 'crowd-cheer', 'crowd-gasp', 'crowd-roar-big', 'cup-march',
  'cymbal-crash', 'drumroll', 'fireworks-burst', 'fireworks-launch', 'glove-save', 'goal-fanfare', 'grand-finale',
  'moo-groove', 'net-hit', 'pa-chime', 'pasture', 'post-hit', 'pyro-flame', 'referee-whistle', 'rush', 'stadium-ambience',
  'stadium-horn', 'sunset', 'tackle', 'trophy-lift', 'trophy-reveal', 'tunnel-steps', 'ui-click', 'whistle-triple']
  .map(n => n.indexOf('.') < 0 ? n + '.mp3' : n);

const addAll = async (urls) => {
  const cache = await caches.open(VERSION);
  await Promise.all(urls.map(u => cache.add(u).catch(() => {})));   // a missing optional file (e.g. three.min.js) must not break install
};
self.addEventListener('install', e => { e.waitUntil(addAll(CODE).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('cowball-') && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data && e.data.type === 'warm') e.waitUntil(addAll(MEDIA)); });

// Audio elements request byte ranges; answer them from a cached full response.
async function rangeFromCache(req, res) {
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range') || '');
  if (!m) return res;
  const buf = await res.arrayBuffer(), size = buf.byteLength;
  let start = m[1] === '' ? Math.max(0, size - parseInt(m[2], 10)) : parseInt(m[1], 10);
  let end = m[1] === '' || m[2] === '' ? size - 1 : Math.min(parseInt(m[2], 10), size - 1);
  if (start > end || start >= size) return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + size } });
  return new Response(buf.slice(start, end + 1), { status: 206, statusText: 'Partial Content', headers: {
    'Content-Type': res.headers.get('Content-Type') || 'audio/mpeg', 'Content-Length': String(end - start + 1),
    'Content-Range': 'bytes ' + start + '-' + end + '/' + size } });
}
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  const sameOrigin = url.origin === self.location.origin;
  const isThreeCdn = !sameOrigin && /three(\.min\.js|@)/.test(url.href);
  if (!sameOrigin && !isThreeCdn) return;
  if (sameOrigin && /^\/(api|ws|socket)/.test(url.pathname.replace(/^\/[^/]+\/(?=(api|ws|socket))/, '/'))) return;
  const isMedia = /\.(mp3|png|jpe?g|webp|woff2?)$/i.test(url.pathname) || isThreeCdn;
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const cached = await cache.match(req.url, { ignoreSearch: true });
    if (isMedia && cached) return req.headers.has('range') ? rangeFromCache(req, cached) : cached;
    try {
      const fresh = await fetch(req.headers.has('range') && cached ? new Request(req.url) : req);
      if (fresh && (fresh.ok || fresh.type === 'opaque') && fresh.status !== 206) cache.put(req.url, fresh.clone()).catch(() => {});
      return fresh;
    } catch (err) {
      if (cached) return req.headers.has('range') ? rangeFromCache(req, cached) : cached;
      if (req.mode === 'navigate') { const idx = await cache.match('index.html'); if (idx) return idx; }
      throw err;
    }
  })());
});
