const path = require('node:path');

// Only game assets are exposed to the renderer; source/build files stay private.
function resolveAsset(root, requestUrl, testing = false) {
  const url = new URL(requestUrl);
  if (url.protocol !== 'bean:' || url.host !== 'game') return null;
  let name;
  try { name = decodeURIComponent(url.pathname); } catch { return null; }
  if (name === '/') name = '/index.html';
  if (name.includes('\\') || name.includes('\0')) return null;
  const segments = name.slice(1).split('/');
  if (segments.some(part => !part || part.startsWith('.'))) return null;
  const allowed = name === '/index.html'
    || ['css', 'js', 'lib'].includes(segments[0])
    || (segments[0] === 'assets' && ['models', 'portraits'].includes(segments[1]))
    || (testing && segments[0] === 'tests');
  if (!allowed) return null;
  const file = path.resolve(root, ...segments);
  const relative = path.relative(root, file);
  return relative.startsWith('..') || path.isAbsolute(relative) ? null : file;
}

module.exports = { resolveAsset };
