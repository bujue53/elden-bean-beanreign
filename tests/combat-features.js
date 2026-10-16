// In /?debug: await (await import('/tests/combat-features.js')).run()
// Uses debug damage/position/AI holds to build deterministic test scenarios.
export async function run() {
  const game = window.__game;
  if (!game) throw new Error('请等待 /?debug 标题页加载完成');
  const results = [];
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  const key = (code, type = 'keydown') => window.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true }));
  const tap = code => { key(code); key(code, 'keyup'); };
  const mouse = (button, type) => window.dispatchEvent(new MouseEvent(type, { button, bubbles: true }));
  const menu = action => document.querySelector(`[data-action="${action}"]`).click();
  const check = (name, condition) => {
    results.push({ name, passed: Boolean(condition) });
    if (!condition) throw new Error(name);
  };
  const until = async (fn, timeout = 15000) => {
    const start = performance.now();
    while (!fn()) { if (performance.now() - start > timeout) throw new Error('等待超时'); await delay(15); }
  };
  const fight = async index => {
    if (game.state === 'defeat') tap('KeyR');
    if (game.state === 'play') tap('Escape');
    if (game.state === 'pause') menu('title');
    if (game.state === 'victory') tap('Enter');
    if (game.state === 'title') tap('Enter');
    document.querySelector(`.select-card[data-index="${index}"]`).click();
    document.querySelector('#lock-hint').click();
    await until(() => game.freeLook || game.pointerLocked);
    await until(() => game.bossEngaged);
    game.holdBoss(30);
  };
  const front = distance => {
    const b = game.snapshot;
    game.setPlayerPos(b.bossX + Math.sin(b.bossYaw) * distance, b.bossZ + Math.cos(b.bossYaw) * distance);
    game.setYaw(b.bossYaw + Math.PI);
  };
  const startCritical = async () => {
    game.damageBoss(400);
    front(1.8);
    mouse(0, 'mousedown');
    await until(() => game.snapshot.executing);
    mouse(0, 'mouseup');
  };
  try {
    await fight(0);
    check('布德奇冥使用 GLB 人形模型', game.snapshot.bossHumanoid);
    game.bossHitPlayer(200);
    tap('KeyH'); await delay(150);
    check('H 不再喝药', !game.snapshot.healing && game.snapshot.flasks === 4 && game.playerHp === 420);
    tap('KeyR'); await until(() => game.snapshot.flasks === 3);
    check('R 喝药并恢复生命', game.playerHp === 620);
    await until(() => game.snapshot.invuln <= 0);
    game.bossHitPlayer(9999); tap('KeyR');
    check('死亡时 R 只复活，不额外喝药', game.state === 'play' && game.playerHp === 620 && game.snapshot.flasks === 4 && !game.snapshot.healing);

    await fight(3); front(10); tap('KeyE');
    let hp = game.bossHp;
    mouse(0, 'mousedown'); await until(() => game.snapshot.bolts > 0); mouse(0, 'mouseup');
    const lightDamage = game.snapshot.projectileDamage[0];
    check('隐士轻击产生远程弹体', lightDamage > 0 && game.bossHp === hp);
    await until(() => game.bossHp < hp);
    check('隐士轻击只在远程弹命中时扣血', hp - game.bossHp === lightDamage);
    await until(() => !game.snapshot.attacking);
    front(10); hp = game.bossHp;
    mouse(2, 'mousedown'); await until(() => game.snapshot.heavyCharge >= 0.95); mouse(2, 'mouseup');
    await until(() => game.snapshot.bolts > 0);
    const chargedDamage = game.snapshot.projectileDamage[0];
    check('隐士蓄力远程伤害高于轻击', chargedDamage > lightDamage && game.bossHp === hp);
    await until(() => game.bossHp < hp);
    check('隐士蓄力攻击远程命中', hp - game.bossHp === chargedDamage);
    await until(() => !game.snapshot.attacking);
    front(10); hp = game.bossHp;
    key('Space'); await until(() => game.snapshot.y > 0); key('Space', 'keyup');
    mouse(0, 'mousedown'); await until(() => game.snapshot.bolts > 0); mouse(0, 'mouseup');
    check('隐士空中轻击仍为远程', game.bossHp === hp && game.snapshot.projectileDamage[0] > 0);
    await until(() => game.snapshot.grounded);

    await fight(0); game.damageBoss(400); front(5);
    mouse(0, 'mousedown'); await delay(100); mouse(0, 'mouseup');
    check('远离破韧 BOSS 时不能处决', !game.snapshot.executing);
    await until(() => !game.snapshot.attacking);
    front(1.8);
    mouse(0, 'mousedown'); await until(() => game.snapshot.executing); mouse(0, 'mouseup');
    check('破韧正面近身左键启动处决', game.snapshot.bossState === 'execution' && game.snapshot.criticalBladeVisible && !game.snapshot.weaponVisible);
    const frozen = game.snapshot;
    await until(() => game.snapshot.executionHits.length === 1);
    const first = game.snapshot;
    check('插入时第一段伤害', first.executionHits[0].damage === 175 && first.bossHp === 3025);
    check('刀尖实际插入 BOSS 胸部', first.executionPenetration > 0.2);
    game.bossHitPlayer(999); game.damageBoss(50); tap('KeyR');
    check('处决期间保护玩家且拒绝第三方伤害', game.playerHp === 620 && game.bossHp === first.bossHp && !game.snapshot.healing);
    tap('Escape'); const pausedTime = game.snapshot.executionTime;
    await delay(150);
    check('暂停冻结处决时间', game.state === 'pause' && game.snapshot.executionTime === pausedTime);
    menu('resume'); await until(() => game.state === 'play');
    await until(() => game.snapshot.executionTime >= 2.0);
    check('停顿及慢拔刀阶段无额外伤害', game.snapshot.executionHits.length === 1 && game.bossHp === first.bossHp);
    await until(() => game.snapshot.executionHits.length === 2);
    const second = game.snapshot;
    check('拔出时第二段伤害', second.executionHits[1].damage === 300 && second.bossHp === 2725);
    check('慢拔刀后刀尖退出 BOSS 胸部', second.executionPenetration < 0);
    check('处决期间 BOSS 位置朝向与攻击进度固定', second.bossX === frozen.bossX && second.bossZ === frozen.bossZ && second.bossYaw === frozen.bossYaw && second.bossAttackT === frozen.bossAttackT && second.bossState === 'execution');
    await until(() => !game.snapshot.executing);
    check('结束后恢复武器且恰好结算两次', game.snapshot.weaponVisible && !game.snapshot.criticalBladeVisible && game.snapshot.executionHits.length === 2);

    await fight(0); await startCritical(); tap('Escape'); menu('restart');
    await until(() => game.state === 'play');
    check('处决中重开完整清理交互', !game.snapshot.executing && game.snapshot.weaponVisible && !game.snapshot.criticalBladeVisible && game.bossHp === 3600);
    game.holdBoss(30); game.damageBoss(3500); front(1.8);
    mouse(0, 'mousedown'); await until(() => game.snapshot.executing); mouse(0, 'mouseup');
    await until(() => game.snapshot.executionHits.length === 1);
    check('第一段致死仍保留完整处决动画', game.bossHp === 0 && game.snapshot.executing && game.state === 'play');
    await until(() => game.snapshot.executionHits.length === 2);
    check('低血量处决仍有刺入与拔出两次打击', game.snapshot.executionHits.length === 2);
    await until(() => game.state === 'victory');
    check('处决完成后进入胜利流程', !game.snapshot.executing && game.bossHp === 0);
    tap('Enter');
    return { passed: results.length, results };
  } catch (error) {
    if (game.state === 'play') tap('Escape');
    return { error: error.message, snapshot: game.snapshot, results };
  }
}
