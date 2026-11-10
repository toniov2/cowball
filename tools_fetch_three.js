// Downloads Three.js r128 next to index.html and prints its SRI hash. Needs Node 18+ and internet.
const https = require('https'), fs = require('fs'), crypto = require('crypto'), path = require('path');
const url = 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js';
https.get(url, res => {
  if (res.statusCode !== 200) { console.error('HTTP ' + res.statusCode); process.exit(1); }
  const chunks = []; res.on('data', c => chunks.push(c)); res.on('end', () => {
    const buf = Buffer.concat(chunks);
    fs.writeFileSync(path.join(__dirname, 'three.min.js'), buf);
    console.log('three.min.js saved: ' + buf.length + ' bytes');
    console.log('integrity="sha384-' + crypto.createHash('sha384').update(buf).digest('base64') + '"');
  });
}).on('error', e => { console.error(e.message); process.exit(1); });
