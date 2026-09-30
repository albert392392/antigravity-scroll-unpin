const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const PRELOAD_INJECTION = `
// --- [antigravity-scroll-unpin] ---
try {
  const customCss = \`
    div[role="article"][aria-label="User message"],
    div[aria-label="User message"] {
      position: relative !important;
      top: auto !important;
    }
    div[role="article"][aria-label="User message"]::after,
    div[aria-label="User message"]::after {
      display: none !important;
    }
  \`;
  if (typeof electron_1 !== 'undefined' && electron_1.webFrame && electron_1.webFrame.insertCSS) {
    electron_1.webFrame.insertCSS(customCss);
  }
  const injectStyle = () => {
    if (typeof document !== 'undefined' && !document.getElementById('antigravity-scroll-unpin-style')) {
      const style = document.createElement('style');
      style.id = 'antigravity-scroll-unpin-style';
      style.textContent = customCss;
      (document.head || document.documentElement).appendChild(style);
    }
  };
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', injectStyle);
    } else {
      injectStyle();
    }
  }
} catch (e) {
  console.error('[antigravity-scroll-unpin] Error:', e);
}
`;

/**
 * Patches the standalone Antigravity Electron application's app.asar.
 *
 * @param {string} standalonePath Base path of Antigravity installation
 * @returns {{ success: boolean, actions: string[], errors: string[] }}
 */
function patchStandalone(standalonePath) {
  const actions = [];
  const errors = [];

  const resourcesDir = path.join(standalonePath, 'resources');
  const asarPath = path.join(resourcesDir, 'app.asar');
  const asarBak = path.join(resourcesDir, 'app.asar.bak');

  if (!fs.existsSync(asarPath)) {
    return { success: false, actions, errors: [`app.asar not found at ${asarPath}`] };
  }

  // 1. Backup
  if (!fs.existsSync(asarBak)) {
    fs.copyFileSync(asarPath, asarBak);
    actions.push(`Created backup: ${asarBak}`);
  }

  // 2. Extract to temp dir
  const tempExtractDir = path.join(os.tmpdir(), `antigravity-asar-${Date.now()}`);
  try {
    execSync(`npx --yes asar extract "${asarPath}" "${tempExtractDir}"`, { stdio: 'pipe' });
    actions.push('Extracted app.asar for patching');

    // 3. Patch preload.js
    const preloadPath = path.join(tempExtractDir, 'dist', 'preload.js');
    if (!fs.existsSync(preloadPath)) {
      throw new Error(`dist/preload.js not found in ${tempExtractDir}`);
    }

    let preloadContent = fs.readFileSync(preloadPath, 'utf8');
    if (!preloadContent.includes('antigravity-scroll-unpin-style')) {
      preloadContent += '\n' + PRELOAD_INJECTION;
      fs.writeFileSync(preloadPath, preloadContent, 'utf8');
      actions.push('Injected unpin logic into dist/preload.js');
    }

    // 4. Pack back
    const tempPackedAsar = path.join(os.tmpdir(), `app-patched-${Date.now()}.asar`);
    execSync(`npx --yes asar pack "${tempExtractDir}" "${tempPackedAsar}"`, { stdio: 'pipe' });
    actions.push('Repackaged patched app.asar');

    // 5. Replace active asar
    try {
      fs.copyFileSync(tempPackedAsar, asarPath);
      fs.unlinkSync(tempPackedAsar);
    } catch {
      const oldAsar = asarPath + '.old';
      if (fs.existsSync(oldAsar)) fs.unlinkSync(oldAsar);
      fs.renameSync(asarPath, oldAsar);
      fs.renameSync(tempPackedAsar, asarPath);
    }
    actions.push('Successfully deployed patched app.asar to Antigravity standalone');

    // 6. Cleanup temp extract dir
    try {
      fs.rmSync(tempExtractDir, { recursive: true, force: true });
    } catch {}

    return { success: true, actions, errors };
  } catch (err) {
    errors.push(`Failed to patch standalone asar: ${err.message}`);
    return { success: false, actions, errors };
  }
}

/**
 * Restores original app.asar from app.asar.bak.
 *
 * @param {string} standalonePath
 * @returns {{ success: boolean, actions: string[], errors: string[] }}
 */
function restoreStandalone(standalonePath) {
  const actions = [];
  const errors = [];

  const resourcesDir = path.join(standalonePath, 'resources');
  const asarPath = path.join(resourcesDir, 'app.asar');
  const asarBak = path.join(resourcesDir, 'app.asar.bak');

  if (!fs.existsSync(asarBak)) {
    return { success: false, actions, errors: ['No app.asar.bak found to restore.'] };
  }

  try {
    fs.copyFileSync(asarBak, asarPath);
    actions.push('Restored original app.asar from backup');
    return { success: true, actions, errors };
  } catch (err) {
    errors.push(`Restore failed: ${err.message}`);
    return { success: false, actions, errors };
  }
}

module.exports = {
  patchStandalone,
  restoreStandalone,
};
