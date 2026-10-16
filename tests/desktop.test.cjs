const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { resolveAsset } = require('../desktop/protocol.cjs');
const root = path.resolve(__dirname, '..');

test('desktop protocol exposes bundled game assets, with tests only in test mode', () => {
  assert.equal(resolveAsset(root, 'bean://game/'), path.join(root, 'index.html'));
  assert.equal(resolveAsset(root, 'bean://game/assets/models/heolstor.glb'), path.join(root, 'assets/models/heolstor.glb'));
  assert.equal(resolveAsset(root, 'bean://game/tests/combat-features.js'), null);
  assert.equal(resolveAsset(root, 'bean://game/tests/combat-features.js', true), path.join(root, 'tests/combat-features.js'));
});

test('desktop protocol rejects other origins, private files and encoded traversal', () => {
  for (const url of ['https://game/index.html', 'bean://elsewhere/index.html', 'bean://game/package.json', 'bean://game/desktop/main.cjs', 'bean://game/.git/config', 'bean://game/assets/blender/heolstor.blend', 'bean://game/js/%2e%2e%5cpackage.json', 'bean://game/js/%00', 'bean://game/js/%ZZ']) {
    assert.equal(resolveAsset(root, url), null, url);
  }
});
