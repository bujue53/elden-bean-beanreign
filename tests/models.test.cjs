const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

for (const id of ['executioner', 'guardian', 'rogue', 'hermit']) {
  test(`${id}: valid self-contained GLB with required animation pivots`, () => {
    const bytes = fs.readFileSync(path.join(__dirname, '..', 'assets', 'models', id + '.glb'));
    assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
    assert.equal(bytes.readUInt32LE(4), 2);
    assert.equal(bytes.readUInt32LE(8), bytes.length);
    assert.equal(bytes.toString('ascii', 16, 20), 'JSON');
    const json = JSON.parse(bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12)));
    const parts = new Set(json.nodes.map(node => node.extras?.part).filter(Boolean));
    for (const part of ['body', 'head', 'armL', 'armR', 'legL', 'legR', 'weaponHolder']) {
      assert.ok(parts.has(part), `${id} missing ${part}`);
    }
    if (id === 'guardian') assert.ok(parts.has('shieldHolder'));
    assert.ok(json.meshes.length >= 10);
    assert.ok(json.images.length > 0, 'Embedded material maps required');
    assert.ok(json.images.every(image => image.bufferView !== undefined && !image.uri));
    assert.ok(json.buffers.every(buffer => !buffer.uri), 'Must not require remote buffers');
    assert.ok(json.meshes.every(mesh => mesh.primitives.every(p => p.attributes.POSITION !== undefined)));
    assert.ok(bytes.length < 2_000_000, 'Each model should fit the web game budget');
    const portrait = fs.readFileSync(path.join(__dirname, '..', 'assets', 'portraits', id + '.png'));
    assert.equal(portrait.readUInt32BE(0), 0x89504e47);
  });
}
