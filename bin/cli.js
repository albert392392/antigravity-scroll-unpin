#!/usr/bin/env node

const {
  runPatch,
  runRestore,
  runStatus,
  runWatch,
  runInstallService,
  runUninstallService,
} = require('../src/index');

const args = process.argv.slice(2);

if (args.includes('--restore') || args.includes('-r')) {
  runRestore();
} else if (args.includes('--status') || args.includes('-s')) {
  runStatus();
} else if (args.includes('--watch') || args.includes('-w')) {
  runWatch();
} else if (args.includes('--install-service')) {
  runInstallService();
} else if (args.includes('--uninstall-service')) {
  runUninstallService();
} else if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Antigravity Scroll Unpin (CLI)
Zero-corruption self-healing patcher for Google Antigravity & Antigravity IDE

Usage:
  npx antigravity-scroll-unpin [options]

Options:
  --apply, -a            Apply permanent unpin patch to both Standalone and IDE (Default)
  --watch, -w            Start continuous self-healing watcher (monitors for updates)
  --install-service      Install silent Windows background service (auto-heals on updates)
  --uninstall-service    Uninstall silent Windows background service
  --restore, -r          Restore original stock files from backups (.bak)
  --status, -s           Inspect environment paths and checksum status
  --help, -h             Show this help message
`);
} else {
  runPatch();
}
