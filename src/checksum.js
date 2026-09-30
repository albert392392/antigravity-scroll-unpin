const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Computes the exact checksum format expected by VS Code / Antigravity product.json:
 * SHA-256 base64 digest with trailing '=' padding stripped.
 *
 * @param {Buffer|string} content
 * @returns {string}
 */
function computeVSCodeChecksum(content) {
  return crypto
    .createHash('sha256')
    .update(content)
    .digest('base64')
    .replace(/=+$/, '');
}

/**
 * Validates all checksums in a product.json against files on disk.
 *
 * @param {string} outDir
 * @param {string} productJsonPath
 * @returns {{ allPassed: boolean, results: Array<{ file: string, status: 'PASS'|'FAIL'|'MISSING', expected?: string, actual?: string }> }}
 */
function verifyChecksums(outDir, productJsonPath) {
  if (!fs.existsSync(productJsonPath)) {
    return { allPassed: false, results: [] };
  }

  const product = JSON.parse(fs.readFileSync(productJsonPath, 'utf8'));
  const checksums = product.checksums || {};
  const results = [];
  let allPassed = true;

  for (const [relPath, expectedHash] of Object.entries(checksums)) {
    const fullPath = path.join(outDir, relPath);
    if (!fs.existsSync(fullPath)) {
      results.push({ file: relPath, status: 'MISSING' });
      allPassed = false;
      continue;
    }

    const content = fs.readFileSync(fullPath);
    const actualHash = computeVSCodeChecksum(content);
    if (actualHash === expectedHash) {
      results.push({ file: relPath, status: 'PASS' });
    } else {
      results.push({ file: relPath, status: 'FAIL', expected: expectedHash, actual: actualHash });
      allPassed = false;
    }
  }

  return { allPassed, results };
}

/**
 * Updates all checksums in product.json based on actual files on disk.
 *
 * @param {string} outDir
 * @param {string} productJsonPath
 * @returns {number} Number of updated checksums
 */
function updateProductChecksums(outDir, productJsonPath) {
  const product = JSON.parse(fs.readFileSync(productJsonPath, 'utf8'));
  let count = 0;

  for (const relPath of Object.keys(product.checksums || {})) {
    const fullPath = path.join(outDir, relPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath);
      const hash = computeVSCodeChecksum(content);
      if (product.checksums[relPath] !== hash) {
        product.checksums[relPath] = hash;
        count++;
      }
    }
  }

  fs.writeFileSync(productJsonPath, JSON.stringify(product, null, '\t'), 'utf8');
  return count;
}

module.exports = {
  computeVSCodeChecksum,
  verifyChecksums,
  updateProductChecksums,
};
