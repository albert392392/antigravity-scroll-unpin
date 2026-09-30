const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Returns potential installation paths based on current OS.
 */
function detectPaths() {
  const isWin = process.platform === 'win32';
  const isMac = process.platform === 'darwin';
  const isLinux = process.platform === 'linux';

  const home = os.homedir();
  const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
  const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');

  const candidates = {
    standalone: [],
    ide: [],
    ideAppData: [],
  };

  if (isWin) {
    candidates.standalone.push(
      path.join(localAppData, 'Programs', 'Antigravity'),
      'C:\\Program Files\\Antigravity',
      path.join(home, 'scoop', 'apps', 'antigravity', 'current')
    );
    candidates.ide.push(
      path.join(localAppData, 'Programs', 'Antigravity IDE'),
      'C:\\Program Files\\Antigravity IDE',
      path.join(home, 'scoop', 'apps', 'antigravity-ide', 'current')
    );
    candidates.ideAppData.push(
      path.join(appData, 'Antigravity IDE'),
      path.join(appData, 'Antigravity')
    );
  } else if (isMac) {
    candidates.standalone.push(
      '/Applications/Antigravity.app/Contents/Resources',
      path.join(home, 'Applications/Antigravity.app/Contents/Resources')
    );
    candidates.ide.push(
      '/Applications/Antigravity IDE.app/Contents/Resources/app',
      path.join(home, 'Applications/Antigravity IDE.app/Contents/Resources/app')
    );
    candidates.ideAppData.push(
      path.join(home, 'Library/Application Support/Antigravity IDE'),
      path.join(home, 'Library/Application Support/Antigravity')
    );
  } else if (isLinux) {
    candidates.standalone.push(
      '/usr/share/antigravity',
      '/opt/antigravity',
      path.join(home, '.local/share/antigravity')
    );
    candidates.ide.push(
      '/usr/share/antigravity-ide/resources/app',
      '/opt/antigravity-ide/resources/app',
      path.join(home, '.local/share/antigravity-ide')
    );
    candidates.ideAppData.push(
      path.join(home, '.config/Antigravity IDE'),
      path.join(home, '.config/Antigravity')
    );
  }

  // Resolve active paths
  const detectedStandalone = candidates.standalone.find(p => fs.existsSync(p));
  const detectedIde = candidates.ide.find(p => fs.existsSync(p));
  const detectedIdeAppData = candidates.ideAppData.find(p => fs.existsSync(p));

  return {
    standalone: detectedStandalone || null,
    ide: detectedIde || null,
    ideAppData: detectedIdeAppData || null,
  };
}

module.exports = {
  detectPaths,
};
