#!/usr/bin/env node

const { runPatch, runRestore, runStatus } = require('../src/index');

const args = process.argv.slice(2);

if (args.includes('--restore') || args.includes('-r')) {
  runRestore();
} else if (args.includes('--status') || args.includes('-s')) {
  runStatus();
} else if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Antigravity Scroll Unpin (CLI)
Usage:
  npx antigravity-scroll-unpin [options]

Options:
  --apply, -a     Apply unpin patch to both Standalone and IDE (Default)
  --restore, -r   Restore original files from backups (.bak)
  --status, -s    Inspect environment paths and checksum status
  --help, -h      Show this help message
`);
} else {
  runPatch();
}
