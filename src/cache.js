const fs = require('fs');
const path = require('path');

/**
 * Safely removes V8 code cache directories to force loading fresh JS/HTML.
 *
 * @param {string} appDataDir
 * @returns {{ cleared: string[], errors: string[] }}
 */
function clearV8Cache(appDataDir) {
  const result = { cleared: [], errors: [] };
  if (!appDataDir || !fs.existsSync(appDataDir)) {
    return result;
  }

  const targets = [
    path.join(appDataDir, 'Code Cache'),
    path.join(appDataDir, 'CachedData'),
    path.join(appDataDir, 'GPUCache'),
  ];

  for (const target of targets) {
    if (fs.existsSync(target)) {
      try {
        fs.rmSync(target, { recursive: true, force: true });
        result.cleared.push(target);
      } catch (err) {
        result.errors.push(`${target}: ${err.message}`);
      }
    }
  }

  return result;
}

module.exports = {
  clearV8Cache,
};
