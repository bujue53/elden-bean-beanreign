// Records the actual canvas animation; debug calls only prepare the staggered boss.
export async function record() {
  const game = window.__game;
  if (!game || game.state !== 'title') throw new Error('请在 /?debug 标题界面开始');
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  const tap = code => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true }));
    window.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true }));
  };
  const until = async fn => {
    const start = performance.now();
    while (!fn()) { if (performance.now() - start > 15000) throw new Error('等待超时'); await delay(10); }
  };
  tap('Enter'); document.querySelector('.select-card[data-index="0"]').click();
  document.querySelector('#lock-hint').click();
  await until(() => game.freeLook || game.pointerLocked);
  await until(() => game.bossEngaged);
  game.holdBoss(30); game.damageBoss(400);
  const boss = game.snapshot;
  game.setPlayerPos(boss.bossX + Math.sin(boss.bossYaw) * 1.8, boss.bossZ + Math.cos(boss.bossYaw) * 1.8);
  game.setYaw(boss.bossYaw + Math.PI);
  const canvas = document.querySelector('#game-canvas');
  const stream = canvas.captureStream(30);
  const options = { mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm' };
  const recorder = new MediaRecorder(stream, options);
  const chunks = [];
  const completed = new Promise(resolve => {
    recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    recorder.onstop = () => {
      for (const track of stream.getTracks()) track.stop();
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(new Blob(chunks, { type: 'video/webm' }));
    };
  });
  recorder.start();
  window.dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true }));
  await until(() => game.snapshot.executing);
  window.dispatchEvent(new MouseEvent('mouseup', { button: 0, bubbles: true }));
  await until(() => !game.snapshot.executing);
  await delay(300);
  recorder.stop();
  tap('Escape');
  return completed;
}
