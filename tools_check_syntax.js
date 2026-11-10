// node tools_check_syntax.js : syntax-checks every .js file in the project root (no dependencies).
const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
let bad = 0;
for (const f of fs.readdirSync(__dirname).filter(f => f.endsWith('.js'))) {
  const r = spawnSync(process.execPath, ['--check', path.join(__dirname, f)], { encoding: 'utf8' });
  if (r.status !== 0) { bad++; console.error('FAIL ' + f + '\n' + r.stderr); } else console.log('ok   ' + f);
}
process.exit(bad ? 1 : 0);
