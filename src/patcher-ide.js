const fs = require('fs');
const path = require('path');
const { updateProductChecksums, verifyChecksums } = require('./checksum');

const CSS_UNPIN_RULE = `
/* [antigravity-scroll-unpin] Universal Override */
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
`;

const HTML_STYLE_BLOCK = `
	<!-- [antigravity-scroll-unpin] -->
	<style>
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
	</style>
</head>`;

const PRELOAD_OBSERVER_INJECTION = `
// --- [antigravity-scroll-unpin] Master Preload Observer ---
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
    if (typeof s !== 'undefined' && s.insertCSS) {
      try { s.insertCSS(unpinCss); } catch (_) {}
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
 * Patches Antigravity IDE resources to permanently unpin prompt and re-signs product.json.
 *
 * @param {string} idePath Base installation path for Antigravity IDE
 * @returns {{ success: boolean, actions: string[], errors: string[] }}
 */
function patchIde(idePath) {
  const actions = [];
  const errors = [];

  const appDir = fs.existsSync(path.join(idePath, 'resources', 'app'))
    ? path.join(idePath, 'resources', 'app')
    : idePath;

  const outDir = path.join(appDir, 'out');
  const productJsonPath = path.join(appDir, 'product.json');

  if (!fs.existsSync(outDir) || !fs.existsSync(productJsonPath)) {
    return { success: false, actions, errors: ['Invalid Antigravity IDE directory structure.'] };
  }

  // Helper to ensure .bak exists
  const ensureBackup = (targetFile) => {
    const bak = targetFile + '.bak';
    if (!fs.existsSync(bak) && fs.existsSync(targetFile)) {
      fs.copyFileSync(targetFile, bak);
    }
  };

  // 1. Patch HTML files: workbench-jetski-agent.html and workbench.html
  const htmlFiles = [
    path.join(outDir, 'vs', 'code', 'electron-browser', 'workbench', 'workbench-jetski-agent.html'),
    path.join(outDir, 'vs', 'code', 'electron-browser', 'workbench', 'workbench.html')
  ];

  for (const htmlPath of htmlFiles) {
    if (fs.existsSync(htmlPath)) {
      ensureBackup(htmlPath);
      let html = fs.readFileSync(htmlPath, 'utf8');
      if (!html.includes('[antigravity-scroll-unpin]')) {
        html = html.replace('</head>', HTML_STYLE_BLOCK);
        fs.writeFileSync(htmlPath, html, 'utf8');
        actions.push(`Injected CSS style block into ${path.basename(htmlPath)}`);
      }
    }
  }

  // 2. Patch CSS stylesheets: jetskiMain.tailwind.css, main.css, tw-base.tailwind.css, workbench.desktop.main.css
  const cssFiles = [
    path.join(outDir, 'jetskiMain.tailwind.css'),
    path.join(outDir, 'jetskiAgent', 'main.css'),
    path.join(outDir, 'tw-base.tailwind.css'),
    path.join(outDir, 'vs', 'workbench', 'workbench.desktop.main.css')
  ];

  for (const cssPath of cssFiles) {
    if (fs.existsSync(cssPath)) {
      ensureBackup(cssPath);
      let css = fs.readFileSync(cssPath, 'utf8');
      if (!css.includes('[antigravity-scroll-unpin]')) {
        css += '\n' + CSS_UNPIN_RULE;
        fs.writeFileSync(cssPath, css, 'utf8');
        actions.push(`Appended unpin rule to ${path.relative(outDir, cssPath)}`);
      }
    }
  }

  // 3. Patch jetskiAgent/main.js JSX string
  const jsPath = path.join(outDir, 'jetskiAgent', 'main.js');
  if (fs.existsSync(jsPath)) {
    ensureBackup(jsPath);
    let js = fs.readFileSync(jsPath, 'utf8');
    const targetStr = 'className:"sticky top-0 z-10 mb-4 bg-background after:content-[\'\'] after:absolute after:left-0 after:right-0 after:top-full after:h-7 after:bg-gradient-to-b after:from-background after:to-transparent after:pointer-events-none"';
    const replBase = 'className:"relative top-auto z-10 mb-4 bg-background"';
    const replStr = replBase.slice(0, -1) + ' '.repeat(targetStr.length - replBase.length) + '"';

    if (js.includes(targetStr)) {
      js = js.replace(targetStr, replStr);
      fs.writeFileSync(jsPath, js, 'utf8');
      actions.push('Patched React component JSX in jetskiAgent/main.js');
    }
  }

  // 4. Patch master preload.js for universal MutationObserver & WebFrame injection
  const preloadPath = path.join(outDir, 'vs', 'base', 'parts', 'sandbox', 'electron-browser', 'preload.js');
  if (fs.existsSync(preloadPath)) {
    ensureBackup(preloadPath);
    let preloadContent = fs.readFileSync(preloadPath, 'utf8');
    if (!preloadContent.includes('[antigravity-scroll-unpin]')) {
      preloadContent += '\n' + PRELOAD_OBSERVER_INJECTION;
      fs.writeFileSync(preloadPath, preloadContent, 'utf8');
      actions.push('Injected universal MutationObserver into sandbox preload.js');
    }
  }

  // 5. Update checksums in product.json
  const updatedCount = updateProductChecksums(outDir, productJsonPath);
  actions.push(`Re-calculated and updated ${updatedCount} checksum(s) in product.json`);

  // 6. Verify checksums
  const { allPassed } = verifyChecksums(outDir, productJsonPath);
  if (!allPassed) {
    errors.push('Integrity verification failed after updating product.json.');
    return { success: false, actions, errors };
  }
  actions.push('All core product.json checksums verified [PASS] - zero corruption!');

  return { success: true, actions, errors };
}

/**
 * Restores original files from .bak backups and re-signs product.json.
 *
 * @param {string} idePath
 * @returns {{ success: boolean, actions: string[], errors: string[] }}
 */
function restoreIde(idePath) {
  const actions = [];
  const errors = [];

  const appDir = fs.existsSync(path.join(idePath, 'resources', 'app'))
    ? path.join(idePath, 'resources', 'app')
    : idePath;

  const outDir = path.join(appDir, 'out');
  const productJsonPath = path.join(appDir, 'product.json');

  const filesToRestore = [
    path.join(outDir, 'vs', 'code', 'electron-browser', 'workbench', 'workbench-jetski-agent.html'),
    path.join(outDir, 'vs', 'code', 'electron-browser', 'workbench', 'workbench.html'),
    path.join(outDir, 'jetskiMain.tailwind.css'),
    path.join(outDir, 'jetskiAgent', 'main.css'),
    path.join(outDir, 'tw-base.tailwind.css'),
    path.join(outDir, 'vs', 'workbench', 'workbench.desktop.main.css'),
    path.join(outDir, 'jetskiAgent', 'main.js'),
    path.join(outDir, 'vs', 'base', 'parts', 'sandbox', 'electron-browser', 'preload.js'),
  ];

  for (const file of filesToRestore) {
    const bak = file + '.bak';
    if (fs.existsSync(bak)) {
      fs.copyFileSync(bak, file);
      actions.push(`Restored ${path.basename(file)} from backup`);
    }
  }

  updateProductChecksums(outDir, productJsonPath);
  actions.push('Re-signed product.json for restored files');

  return { success: true, actions, errors };
}

module.exports = {
  patchIde,
  restoreIde,
  CSS_UNPIN_RULE,
  PRELOAD_OBSERVER_INJECTION,
};
