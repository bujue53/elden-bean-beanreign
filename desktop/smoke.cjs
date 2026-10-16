const { app } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

exports.run = async (window, errors) => {
  const outputArg = process.argv.find(arg => arg.startsWith('--smoke-output='));
  if (!outputArg) throw new Error('Missing --smoke-output');
  const output = path.resolve(outputArg.slice('--smoke-output='.length));
  await fs.mkdir(output, { recursive: true });
  const result = { version: app.getVersion(), packaged: app.isPackaged, runtime: process.versions.electron };
  const evaluate = code => window.webContents.executeJavaScript(code, true);
  const ready = async () => {
    const start = Date.now();
    while (!await evaluate('Boolean(window.__game)')) {
      if (Date.now() - start > 30000) throw new Error('Game initialization timed out');
      await delay(100);
    }
  };
  try {
    await ready();
    result.window = { title: window.getTitle(), size: window.getContentSize() };
    result.renderer = await evaluate(`({nodeExposed:typeof require !== 'undefined' || typeof process !== 'undefined',webgl:Boolean(document.querySelector('canvas').getContext('webgl2')),state:window.__game.state})`);
    assert.equal(result.renderer.nodeExposed, false);
    assert.equal(result.renderer.webgl, true);
    assert.equal(result.renderer.state, 'title');
    assert.deepEqual(errors, [], 'Game assets should load without errors');
    window.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'F11' });
    await delay(300);
    assert.equal(window.isFullScreen(), true);
    window.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'F11' });
    window.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'F11' });
    await delay(300);
    window.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'F11' });
    assert.equal(window.isFullScreen(), false);
    result.fullscreen = true;
    result.features = await evaluate(`import('/tests/combat-features.js').then(m=>m.run())`);
    assert.equal(result.features.passed, 24, JSON.stringify(result.features));
    await window.loadURL('bean://game/index.html?debug');
    await ready();
    result.smoke = await evaluate(`import('/tests/browser-smoke.js').then(m=>m.run())`);
    assert.equal(result.smoke.passed, 28, JSON.stringify(result.smoke));
    await window.loadURL('bean://game/index.html?debug');
    await ready();
    await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown',{code:'Enter',bubbles:true}));document.querySelector('.select-card[data-index="0"]').click();document.querySelector('#lock-hint').click();`);
    await delay(1600);
    await fs.writeFile(path.join(output, 'game.png'), (await window.webContents.capturePage()).toPNG());
    await window.loadURL('bean://game/index.html');
    await delay(800);
    assert.equal(await evaluate(`typeof window.__game`), 'undefined');
    result.normalModeHasNoDebug = true;
    result.errors = errors;
    assert.deepEqual(errors, []);
    result.passed = true;
    await fs.writeFile(path.join(output, 'result.json'), JSON.stringify(result, null, 2));
    app.exit(0);
  } catch (error) {
    result.passed = false;
    result.error = error.stack;
    result.errors = errors;
    await fs.writeFile(path.join(output, 'result.json'), JSON.stringify(result, null, 2));
    await fs.writeFile(path.join(output, 'failure.png'), (await window.webContents.capturePage()).toPNG());
    app.exit(1);
  }
};
