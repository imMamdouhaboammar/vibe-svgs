#!/usr/bin/env bash
# Install Anime.js and report what the installed version actually exports.
# Run this before writing any animation code: the API moved at v4 and keeps
# growing, so a remembered snippet is not a reliable guide.
set -e

PIN="${ANIMEJS_VERSION:-4.5.0}"

if ! command -v bun >/dev/null 2>&1; then
  echo "Bun is required to install the pinned animation engine."
  exit 1
fi

echo "installing animejs@${PIN}"
bun add "animejs@${PIN}" --exact --silent

node -e "
import('animejs').then(m => {
  const v = require('./node_modules/animejs/package.json').version;
  console.log('\ninstalled  animejs ' + v);
  console.log('exports    ' + Object.keys(m).sort().join(' '));
  const s = m.spring({ stiffness: 120, damping: 8, mass: 1 });
  console.log('\nsolver check: spring(120/8/1) settles in ' + s.duration + 'ms');
  console.log('ready. next: node scripts/bake.mjs list');
}).catch(e => { console.error('import failed:', e.message); process.exit(1); });
"
