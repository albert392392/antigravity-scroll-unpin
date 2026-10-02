const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const STANDALONE_PRELOAD_INJECTION = `
// --- [antigravity-scroll-unpin] Universal Preload Hook ---
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

    // 2. DOM-level style injection & continuous MutationObserver for SPA / New Chat
    const setupUnpinObserver = () => {
      if (typeof document === 'undefined' || !document.documentElement) return;

      if (!document.getElementById('antigravity-scroll-unpin-style')) {
        const style = document.createElement('style');
        style.id = 'antigravity-scroll-unpin-style';
        style.textContent = unpinCss;
        (document.head || document.documentElement).appendChild(style);
      }

      const applyUnpinToNode = (el) => {
        if (!el || el.nodeType !== 1) return;
        if (el.getAttribute && el.getAttribute('aria-label') === 'User message') {
          el.style.setProperty('position', 'relative', 'important');
          el.style.setProperty('top', 'auto', 'important');
          el.classList.remove('sticky', 'top-0');
        }
        const matches = el.querySelectorAll ? el.querySelectorAll('[aria-label="User message"], div[role="article"][aria-label="User message"]') : [];
        for (let i = 0; i < matches.length; i++) {
          const m = matches[i];
          m.style.setProperty('position', 'relative', 'important');
          m.style.setProperty('top', 'auto', 'important');
          m.classList.remove('sticky', 'top-0');
        }
      };

      // Run on existing elements
      applyUnpinToNode(document.body || document.documentElement);

      // Continuous observer across SPA renders, tabs, new chats
      if (!window.__antigravityUnpinObserver && typeof MutationObserver !== 'undefined') {
        const observer = new MutationObserver((mutations) => {
          for (let i = 0; i < mutations.length; i++) {
            const m = mutations[i];
            if (m.type === 'childList') {
              for (let j = 0; j < m.addedNodes.length; j++) {
                applyUnpinToNode(m.addedNodes[j]);
              }
            } else if (m.type === 'attributes' && m.target) {
              applyUnpinToNode(m.target);
            }
          }
        });
        observer.observe(document.documentElement, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['class', 'aria-label']
        });
        window.__antigravityUnpinObserver = observer;
      }
    };

    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupUnpinObserver);
      } else {
        setupUnpinObserver();
      }
    }
  } catch (e) {
    console.error('[antigravity-scroll-unpin] Preload hook error:', e);
  }
})();
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
    if (!preloadContent.includes('[antigravity-scroll-unpin]')) {
      preloadContent += '\n' + STANDALONE_PRELOAD_INJECTION;
      fs.writeFileSync(preloadPath, preloadContent, 'utf8');
      actions.push('Injected universal MutationObserver & unpin styles into dist/preload.js');
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
};
