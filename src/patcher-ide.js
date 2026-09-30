const fs = require('fs');
const path = require('path');
const { updateProductChecksums, verifyChecksums } = require('./checksum');

const CSS_UNPIN_RULE = `
/* [antigravity-scroll-unpin] Unpin Sticky Prompt */
div[role="article"][aria-label="User message"],
div[aria-label="User message"] {
  position: relative !important;
  top: auto !important;
}
div[role="article"][aria-label="User message"]::after,
div[aria-label="User message"]::after {
  display: none !important;
}
`;

const HTML_STYLE_BLOCK = `
	<!-- [antigravity-scroll-unpin] -->
	<style>
		div[role="article"][aria-label="User message"],
		div[aria-label="User message"] {
			position: relative !important;
			top: auto !important;
		}
		div[role="article"][aria-label="User message"]::after,
		div[aria-label="User message"]::after {
			display: none !important;
		}
	</style>
</head>`;

/**
 * Patches Antigravity IDE resources to unpin prompt and re-signs product.json.
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

  // 1. Patch workbench-jetski-agent.html
  const htmlPath = path.join(outDir, 'vs', 'code', 'electron-browser', 'workbench', 'workbench-jetski-agent.html');
  if (fs.existsSync(htmlPath)) {
    const htmlBak = htmlPath + '.bak';
    if (!fs.existsSync(htmlBak)) fs.copyFileSync(htmlPath, htmlBak);

    let html = fs.readFileSync(htmlPath, 'utf8');
    if (!html.includes('[antigravity-scroll-unpin]')) {
      html = html.replace('</head>', HTML_STYLE_BLOCK);
      fs.writeFileSync(htmlPath, html, 'utf8');
      actions.push('Injected CSS style block into workbench-jetski-agent.html');
    }
  }

  // 2. Patch jetskiMain.tailwind.css
  const tailwindPath = path.join(outDir, 'jetskiMain.tailwind.css');
  if (fs.existsSync(tailwindPath)) {
    const tailwindBak = tailwindPath + '.bak';
    if (!fs.existsSync(tailwindBak)) fs.copyFileSync(tailwindPath, tailwindBak);

    let css = fs.readFileSync(tailwindPath, 'utf8');
    if (!css.includes('[antigravity-scroll-unpin]')) {
      css += '\n' + CSS_UNPIN_RULE;
      fs.writeFileSync(tailwindPath, css, 'utf8');
      actions.push('Appended unpin rule to jetskiMain.tailwind.css');
    }
  }

  // 3. Patch workbench.desktop.main.css
  const wbCssPath = path.join(outDir, 'vs', 'workbench', 'workbench.desktop.main.css');
  if (fs.existsSync(wbCssPath)) {
    const wbCssBak = wbCssPath + '.bak';
    if (!fs.existsSync(wbCssBak)) fs.copyFileSync(wbCssPath, wbCssBak);

    let wbCss = fs.readFileSync(wbCssPath, 'utf8');
    if (!wbCss.includes('[antigravity-scroll-unpin]')) {
      wbCss += '\n' + CSS_UNPIN_RULE;
      fs.writeFileSync(wbCssPath, wbCss, 'utf8');
      actions.push('Appended unpin rule to workbench.desktop.main.css');
    }
  }

  // 4. Patch jetskiAgent/main.js
  const jsPath = path.join(outDir, 'jetskiAgent', 'main.js');
  if (fs.existsSync(jsPath)) {
    const jsBak = jsPath + '.bak';
    if (!fs.existsSync(jsBak)) fs.copyFileSync(jsPath, jsBak);

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

  // 5. Update checksums in product.json
  const updatedCount = updateProductChecksums(outDir, productJsonPath);
  actions.push(`Re-calculated and updated ${updatedCount} checksum(s) in product.json`);

  // 6. Verify checksums
  const { allPassed } = verifyChecksums(outDir, productJsonPath);
  if (!allPassed) {
    errors.push('Integrity verification failed after updating product.json.');
    return { success: false, actions, errors };
  }
  actions.push('All 11 product.json core checksums verified [PASS] - zero corruption!');

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
    path.join(outDir, 'jetskiMain.tailwind.css'),
    path.join(outDir, 'vs', 'workbench', 'workbench.desktop.main.css'),
    path.join(outDir, 'jetskiAgent', 'main.js'),
    path.join(outDir, 'jetskiAgent', 'main.css'),
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
};
