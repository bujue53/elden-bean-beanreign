// 在 /?debug 页执行 await (await import('/tests/playthrough.js')).run()。
// 只读取调试快照，所有操作通过游戏按键/鼠标事件完成，不修改血量或坐标。
export async function run() {
  const game = window.__game;
  if (!game || game.state !== 'title') throw new Error('请在 /?debug 标题界面运行');
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  const key = (code, type = 'keydown') => window.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true }));
  const tap = code => { key(code); key(code, 'keyup'); };
  const mouse = (type, button = 0) => window.dispatchEvent(new MouseEvent(type, { button, bubbles: true }));
  const start = performance.now();
  let deaths = 0, attacks = 0, heals = 0, phase2 = false;
  let forward = false, backward = false;
  tap('Enter');
  document.querySelector('.select-card[data-index="0"]').click();
  document.querySelector('#lock-hint').click();
  await delay(900);
  tap('KeyE');
  try {
    while (performance.now() - start < 600000) {
      const s = game.snapshot;
      phase2 ||= s.bossPhase2;
      if (game.state === 'victory') return { won: true, deaths, attacks, heals, phase2, durationSeconds: Math.round((performance.now() - start) / 1000) };
      if (game.state === 'pause') throw new Error('测试被暂停，请保持页面前台');
      if (game.state === 'defeat') {
        deaths++;
        tap('KeyR');
        forward = backward = false;
        await delay(150);
        continue;
      }
      const p = game.playerPos;
      const dist = Math.hypot(p.x - s.bossX, p.z - s.bossZ);
      const wantForward = dist > 2.1 && s.bossHp > 0;
      const wantBackward = dist < 1.2 && s.bossHp > 0;
      if (forward !== wantForward) { key('KeyW', wantForward ? 'keydown' : 'keyup'); forward = wantForward; }
      if (backward !== wantBackward) { key('KeyS', wantBackward ? 'keydown' : 'keyup'); backward = wantBackward; }
      if (!s.attacking && !s.heavyCharging && !s.healing && s.hp < 300 && s.flasks > 0) { tap('KeyH'); heals++; }
      else if (!s.attacking && !s.healing && s.stamina >= 12 && s.bossHp > 0) {
        mouse('mousedown'); await delay(100); mouse('mouseup'); attacks++;
      }
      await delay(80);
    }
    return { won: false, reason: '10 minute timeout', deaths, attacks, heals, phase2, snapshot: game.snapshot };
  } finally {
    key('KeyW', 'keyup'); key('KeyS', 'keyup'); mouse('mouseup');
    if (game.state === 'play') tap('Escape');
  }
}
