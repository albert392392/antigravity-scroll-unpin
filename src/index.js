const { detectPaths } = require('./detector');
const { patchIde, restoreIde } = require('./patcher-ide');
const { patchStandalone, restoreStandalone } = require('./patcher-standalone');
const { clearV8Cache } = require('./cache');
const { verifyChecksums } = require('./checksum');
const path = require('path');

function runStatus() {
  const paths = detectPaths();
  console.log('\n======================================================');
  console.log('   Antigravity Scroll Unpin - Environment Status');
  console.log('======================================================\n');

  console.log('1. Standalone Antigravity App:');
  if (paths.standalone) {
    console.log(`   Path:    ${paths.standalone}`);
  } else {
    console.log('   Status:  Not detected');
  }

  console.log('\n2. Antigravity IDE (VS Code Edition):');
  if (paths.ide) {
    console.log(`   Path:    ${paths.ide}`);
    const productJsonPath = path.join(paths.ide, 'resources', 'app', 'product.json');
    const outDir = path.join(paths.ide, 'resources', 'app', 'out');
    const { allPassed, results } = verifyChecksums(outDir, productJsonPath);
    console.log(`   Checksum Status: ${allPassed ? '✓ 100% Valid (Clean Integrity)' : '⚠ Checksum Mismatch'}`);
    results.forEach(r => {
      console.log(`     [${r.status}] ${r.file}`);
    });
  } else {
    console.log('   Status:  Not detected');
  }
  console.log('\n======================================================\n');
}

function runPatch() {
  const paths = detectPaths();
  console.log('\n🚀 Applying Antigravity Scroll Unpin Patch...\n');

  if (paths.standalone) {
    console.log('-> Patching Standalone Antigravity App...');
    const res = patchStandalone(paths.standalone);
    res.actions.forEach(a => console.log(`   ✓ ${a}`));
    res.errors.forEach(e => console.error(`   ✗ ${e}`));
  }

  if (paths.ide) {
    console.log('\n-> Patching Antigravity IDE...');
    const res = patchIde(paths.ide);
    res.actions.forEach(a => console.log(`   ✓ ${a}`));
    res.errors.forEach(e => console.error(`   ✗ ${e}`));
  }

  if (paths.ideAppData) {
    console.log('\n-> Clearing stale V8 Code Cache...');
    const res = clearV8Cache(paths.ideAppData);
    res.cleared.forEach(c => console.log(`   ✓ Removed cache: ${c}`));
  }

  console.log('\n✨ Patch completed! Please restart Antigravity & Antigravity IDE.\n');
}

function runRestore() {
  const paths = detectPaths();
  console.log('\n🔄 Restoring Antigravity to Official Stock State...\n');

  if (paths.standalone) {
    console.log('-> Restoring Standalone Antigravity App...');
    const res = restoreStandalone(paths.standalone);
    res.actions.forEach(a => console.log(`   ✓ ${a}`));
    res.errors.forEach(e => console.error(`   ✗ ${e}`));
  }

  if (paths.ide) {
    console.log('\n-> Restoring Antigravity IDE...');
    const res = restoreIde(paths.ide);
    res.actions.forEach(a => console.log(`   ✓ ${a}`));
    res.errors.forEach(e => console.error(`   ✗ ${e}`));
  }

  if (paths.ideAppData) {
    console.log('\n-> Clearing V8 Code Cache...');
    clearV8Cache(paths.ideAppData);
  }

  console.log('\n✨ All original stock files restored successfully!\n');
}

module.exports = {
  runStatus,
  runPatch,
  runRestore,
};
