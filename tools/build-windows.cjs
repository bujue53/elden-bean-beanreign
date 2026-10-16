const fs = require('node:fs/promises');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

async function main() {
  const root = path.resolve(__dirname, '..');
  const pkg = require('../package.json');
  const { packager } = await import('@electron/packager');
  const cache = path.join(root, '.cache');
  await fs.mkdir(cache, { recursive: true });
  const stage = await fs.mkdtemp(path.join(cache, 'windows-source-'));
  for (const item of ['index.html', 'css', 'js', 'lib', 'desktop', 'tests']) {
    await fs.cp(path.join(root, item), path.join(stage, item), { recursive: true });
  }
  for (const item of ['models', 'portraits']) {
    await fs.cp(path.join(root, 'assets', item), path.join(stage, 'assets', item), { recursive: true });
  }
  await fs.writeFile(path.join(stage, 'package.json'), JSON.stringify({
    name: pkg.name, productName: pkg.productName, version: pkg.version,
    description: pkg.description, main: pkg.main, author: 'bujue53',
  }, null, 2));
  const [folder] = await packager({
    dir: stage, out: path.join(root, 'dist'), name: pkg.productName,
    executableName: 'ELDEN BEAN', platform: 'win32', arch: 'x64',
    electronVersion: pkg.devDependencies.electron, appVersion: pkg.version,
    download: { cacheRoot: path.join(cache, 'electron') },
    asar: true, overwrite: true, prune: false,
    icon: path.join(root, 'desktop', 'game.ico'),
    win32metadata: { CompanyName: 'bujue53', ProductName: pkg.productName, FileDescription: 'ELDEN BEAN: BEANREIGN（黑夜豆临）' },
  });
  await fs.copyFile(path.join(root, 'docs', 'WINDOWS-README.txt'), path.join(folder, '游玩说明.txt'));
  await fs.copyFile(path.join(root, 'docs', 'RELEASE-0.0.1.md'), path.join(folder, '更新说明.md'));
  const archive = path.join(root, 'dist', `ELDEN-BEAN-BEANREIGN-${pkg.version}-win-x64.zip`);
  const quote = value => "'" + value.replaceAll("'", "''") + "'";
  const zip = spawnSync('powershell.exe', ['-NoProfile', '-Command',
    `Compress-Archive -LiteralPath ${quote(folder)} -DestinationPath ${quote(archive)} -Force -CompressionLevel Optimal`], { stdio: 'inherit', windowsHide: true });
  if (zip.status !== 0) throw new Error('ZIP 打包失败');
  console.log(JSON.stringify({ folder, archive, bytes: (await fs.stat(archive)).size }, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
