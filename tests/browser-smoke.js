// 在本地 /?debug 页的开发者工具中运行：
// await (await import('/tests/browser-smoke.js')).run()
// 会重置当前对局；胜负、血瓶与二阶段检查使用调试接口构造场景。
export async function run() {
  const game = window.__game;
  if (!game) throw new Error('请在 /?debug 页面运行测试');
  const results = [];
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  const check = (name, condition) => {
    results.push({ name, passed: Boolean(condition) });
    if (!condition) throw new Error('FAIL: ' + name);
  };
  const key = (code, type = 'keydown', extra = {}) => window.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true, ...extra }));
  const tap = code => { key(code); key(code, 'keyup'); };
  const mouse = (button, type) => window.dispatchEvent(new MouseEvent(type, { button, bubbles: true }));
  const clickMenu = action => document.querySelector(`[data-action="${action}"]`).click();
  const until = async (condition, timeout = 15000) => {
    const start = performance.now();
    while (!condition()) {
      if (performance.now() - start > timeout) throw new Error('等待游戏状态超时');
      await delay(30);
    }
  };
  const enterFight = async index => {
    if (game.state === 'play') tap('Escape');
    if (game.state === 'pause') clickMenu('title');
    if (game.state === 'victory') tap('Enter');
    if (game.state === 'defeat') { tap('KeyR'); tap('Escape'); clickMenu('title'); }
    tap('Enter');
    document.querySelector(`.select-card[data-index="${index}"]`).click();
    await delay(50);
  };
  const activate = async () => {
    document.querySelector('#lock-hint').click();
    await until(() => game.freeLook || game.pointerLocked);
  };
  const safe = () => { game.holdBoss(60); game.setPlayerPos(0, 20); };

  try {
    for (let i = 0; i < 4; i++) {
      await enterFight(i);
      check('职业 ' + i + ' 人形模型正常初始化', game.state === 'play' && game.playerHp === [620, 820, 500, 560][i] && !game.snapshot.dead && game.snapshot.humanoid);
    }
    await enterFight(0);
    await delay(600);
    check('点击前战斗等待', !game.bossEngaged && game.playerHp === 620);
    await activate();
    await until(() => game.bossEngaged);
    check('点击后激活 BOSS', game.bossEngaged);
    safe();
    const beforeMove = game.playerPos;
    key('KeyW'); await delay(180); key('KeyW', 'keyup');
    check('W 移动', Math.hypot(game.playerPos.x - beforeMove.x, game.playerPos.z - beforeMove.z) > 0.2);
    tap('KeyE');
    check('E 锁定', game.lockedOn);
    tap('KeyE');
    check('E 解除锁定', !game.lockedOn);
    tap('ShiftLeft'); await delay(50);
    check('翻滚与无敌帧', game.snapshot.dodging && game.snapshot.invuln > 0);
    await until(() => !game.snapshot.dodging);
    key('Space'); await until(() => game.snapshot.y > 0); key('Space', 'keyup');
    check('跳跃', game.snapshot.y > 0 && !game.snapshot.grounded);
    await until(() => game.snapshot.grounded);
    safe();
    game.bossHitPlayer(200);
    check('受到伤害', game.playerHp === 420);
    game.bossHitPlayer(200);
    check('受伤无敌帧拦截连伤', game.playerHp === 420);
    tap('KeyR'); await until(() => game.snapshot.flasks === 3);
    check('喝血瓶恢复生命', game.playerHp === 620);
    safe();
    tap('KeyE');
    for (const heavy of [false, true]) {
      const b = game.snapshot;
      game.setPlayerPos(b.bossX, b.bossZ + 1.7);
      game.setYaw(Math.PI);
      const hp = game.bossHp;
      mouse(heavy ? 2 : 0, 'mousedown');
      if (heavy) await until(() => game.snapshot.heavyCharge >= 0.9);
      else await until(() => game.snapshot.attacking);
      mouse(heavy ? 2 : 0, 'mouseup');
      await until(() => game.bossHp < hp);
      check(heavy ? '蓄力重击命中' : '轻击命中', game.bossHp < hp);
      await until(() => !game.snapshot.attacking);
    }
    safe();
    mouse(2, 'mousedown'); await until(() => game.snapshot.heavyCharging);
    tap('Escape'); mouse(2, 'mouseup');
    check('暂停清除蓄力', game.state === 'pause' && !game.snapshot.heavyCharging);
    const pausedHp = game.playerHp;
    const pausedBoss = game.bossHp;
    await delay(250);
    check('暂停冻结战斗', game.playerHp === pausedHp && game.bossHp === pausedBoss);
    clickMenu('resume'); await until(() => game.state === 'play');
    safe();
    window.dispatchEvent(new Event('blur'));
    check('窗口失焦自动暂停', game.state === 'pause');
    clickMenu('resume'); await until(() => game.state === 'play');
    safe();
    await until(() => game.snapshot.invuln <= 0);
    const retainedHp = game.bossHp;
    game.spawnWave(0, 20); game.spawnMeteor(0, 20);
    game.bossHitPlayer(9999);
    check('死亡界面', game.state === 'defeat' && game.playerHp === 0);
    tap('KeyR');
    check('R 复活保留 BOSS 血量', game.state === 'play' && game.playerHp === 620 && game.bossHp === retainedHp);
    check('复活清空危险与动作', !game.snapshot.dead && !game.snapshot.attacking && !game.snapshot.heavyCharging && game.snapshot.waves === 0 && game.snapshot.meteors === 0 && game.snapshot.flasks === 4);
    safe();
    game.damageBoss(2400);
    check('BOSS 二阶段阈值', game.bossPhase2);
    tap('Escape'); clickMenu('restart'); await until(() => game.state === 'play');
    check('重新挑战恢复完整对局', game.bossHp === 3600 && !game.bossPhase2 && game.playerHp === 620);
    safe();
    game.damageBoss(99999);
    await until(() => game.state === 'victory');
    check('胜利界面', !document.querySelector('#screen-victory').classList.contains('hidden'));
    tap('Enter'); check('胜利返回标题', game.state === 'title');
    await enterFight(1);
    check('胜利后重新开局', game.playerHp === 820 && game.snapshot.flasks === 4 && !game.snapshot.dead && !game.snapshot.attacking);
    await activate();
    safe(); tap('Escape'); clickMenu('title');
    await enterFight(3); await activate();
    game.holdBoss(30);
    const magicBoss = game.snapshot;
    game.setPlayerPos(magicBoss.bossX, magicBoss.bossZ + 5);
    game.setYaw(Math.PI); tap('KeyE');
    const magicHp = game.bossHp;
    mouse(2, 'mousedown'); await until(() => game.snapshot.heavyCharging); mouse(2, 'mouseup');
    await until(() => game.bossHp < magicHp);
    check('隐士右键弹幕命中', game.bossHp < magicHp);
    tap('Escape'); clickMenu('title');
    return { passed: results.length, results };
  } catch (error) {
    if (game.state === 'play') tap('Escape');
    return { error: error.message, snapshot: game.snapshot, results };
  }
}
