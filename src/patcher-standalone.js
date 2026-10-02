const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const STANDALONE_PRELOAD_INJECTION = `
// --- [antigravity-scroll-unpin] CSS-only Preload Hook ---
(function() {
  try {
    const unpinCss = \`
      div[role="article"][aria-label="User message"],
      div[aria-label="User message"],
      [aria-label="User message"],
      [data-testid*="user-message"],
      [data-testid="conversation-view"] div[role="article"][aria-label="User message"] {
        position: relative !important;
        top: auto !important;
        z-index: 1 !important;
      }
      div[role="article"][aria-label="User message"]::after,
      div[aria-label="User message"]::after,
      [aria-label="User message"]::after,
      [data-testid*="user-message"]::after {
        display: none !important;
        content: none !important;
        height: 0 !important;
      }
    \`;

    // 1. Engine-level CSS injection across all frames
    if (typeof electron_1 !== 'undefined' && electron_1.webFrame && electron_1.webFrame.insertCSS) {
      try { electron_1.webFrame.insertCSS(unpinCss); } catch (_) {}
    } else {
      try {
        const { webFrame } = require('electron');
        if (webFrame && webFrame.insertCSS) webFrame.insertCSS(unpinCss);
      } catch (_) {}
    }
  } catch (e) {
    console.error('[antigravity-scroll-unpin] Preload hook error:', e);
  }
})();
`;

function upsertPreloadHook(content, injection, legacyMarker) {
  const marker = injection.trimStart().split('\n', 1)[0];
  const markerIndex = content.indexOf(marker) !== -1
    ? content.indexOf(marker)
    : content.indexOf(legacyMarker);
  if (markerIndex === -1) return `${content}\n${injection.trim()}`;

  const closing = '\n})();';
  const closingIndex = content.indexOf(closing, markerIndex);
  if (closingIndex === -1) throw new Error('Existing unpin preload hook is incomplete.');

  return content.slice(0, markerIndex) + injection.trim() + content.slice(closingIndex + closing.length);
}

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

  // 1. Create clean backup if not existing
  if (!fs.existsSync(asarBak)) {
    fs.copyFileSync(asarPath, asarBak);
    actions.push(`Created backup: ${asarBak}`);
  }

  // 2. Extract to temp dir
  const tempExtractDir = path.join(os.tmpdir(), `antigravity-asar-${Date.now()}`);
  try {
    try {
      execSync(`npx --yes @electron/asar extract "${asarPath}" "${tempExtractDir}"`, { stdio: 'pipe' });
    } catch {
      execSync(`npx --yes asar extract "${asarPath}" "${tempExtractDir}"`, { stdio: 'pipe' });
    }
    actions.push('Extracted app.asar for patching');

    // 3. Patch preload.js
    const preloadPath = path.join(tempExtractDir, 'dist', 'preload.js');
    if (!fs.existsSync(preloadPath)) {
      throw new Error(`dist/preload.js not found in extracted asar: ${tempExtractDir}`);
    }

    let preloadContent = fs.readFileSync(preloadPath, 'utf8');
    const updatedPreloadContent = upsertPreloadHook(
      preloadContent,
      STANDALONE_PRELOAD_INJECTION,
      '// --- [antigravity-scroll-unpin] Universal Preload Hook ---'
    );
    if (updatedPreloadContent !== preloadContent) {
      fs.writeFileSync(preloadPath, updatedPreloadContent, 'utf8');
      actions.push('Added or updated CSS-only unpin hook in dist/preload.js');
    }

    // 4. Pack back to temporary asar
    const tempPackedAsar = path.join(os.tmpdir(), `app-patched-${Date.now()}.asar`);
    try {
      execSync(`npx --yes @electron/asar pack "${tempExtractDir}" "${tempPackedAsar}"`, { stdio: 'pipe' });
    } catch {
      execSync(`npx --yes asar pack "${tempExtractDir}" "${tempPackedAsar}"`, { stdio: 'pipe' });
    }
    actions.push('Repackaged patched app.asar');

    // 5. Replace active asar safely
    try {
      fs.copyFileSync(tempPackedAsar, asarPath);
      fs.unlinkSync(tempPackedAsar);
    } catch {
      const oldAsar = asarPath + '.old';
      if (fs.existsSync(oldAsar)) {
        try { fs.unlinkSync(oldAsar); } catch (_) {}
      }
      fs.renameSync(asarPath, oldAsar);
      fs.renameSync(tempPackedAsar, asarPath);
    }
    actions.push('Successfully deployed patched app.asar to Antigravity standalone');

    // 6. Cleanup temp extract dir
    try {
      fs.rmSync(tempExtractDir, { recursive: true, force: true });
    } catch (_) {}

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
  STANDALONE_PRELOAD_INJECTION,
  upsertPreloadHook,
};
