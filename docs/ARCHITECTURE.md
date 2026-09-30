# Architecture & Technical Deep Dive

## Overview

**Antigravity Scroll Unpin** solves a frustrating UX limitation in Google's **Antigravity** and **Antigravity IDE**: the agent chat input prompt is permanently stuck (`position: sticky; top: 0;`) to the top of the chat panel. For multi-line prompts or smaller viewports, this sticky card claims 30% to 50% of vertical screen space, obscuring code diffs, terminal outputs, and intermediate reasoning.

This document outlines the reverse-engineered internal architecture and explains how this tool achieves zero-corruption patching.

---

## 1. Environment Dual-Topology

Google ships Antigravity in two distinct application wrappers:

```
┌────────────────────────────────────────────────────────┐
│                   Antigravity Ecosystem                │
├───────────────────────────┬────────────────────────────┤
│  1. Antigravity Standalone│  2. Antigravity IDE        │
│     (Dedicated Desktop)   │     (VS Code Custom Fork)  │
├───────────────────────────┼────────────────────────────┤
│ • Electron App            │ • VS Code Architecture     │
│ • Packaged in `app.asar`  │ • Modular unpacked `out/`  │
│ • Embedded Language Server│ • Webview Agent Panel      │
│ • Custom Scheme protocol  │ • Checksum Integrity Guard │
└───────────────────────────┴────────────────────────────┘
```

---

## 2. Technical Challenge: The Checksum Integrity Trap

Modifying VS Code or Antigravity IDE internal files (`out/`) usually results in this persistent warning:

> ⚠️ **Your Antigravity IDE installation appears to be corrupt. Please reinstall.**

### Root Cause
VS Code verifies core bundle integrity on launch by checking file SHA-256 hashes against a pre-baked whitelist in `product.json`:

```json
{
  "checksums": {
    "vs/workbench/workbench.desktop.main.js": "9L00fZS+RjTSre7Is+9l5NZdfdDXIoGw4Zgv6ccf5qc",
    "vs/code/electron-browser/workbench/workbench-jetski-agent.html": "...",
    "jetskiAgent/main.js": "...",
    "jetskiMain.tailwind.css": "..."
  }
}
```

### The Exact Hashing Algorithm
VS Code implements a specific digest normalization:
$$\text{Digest} = \text{Base64}(\text{SHA-256}(\text{RawFileBytes})).\text{replace}(/=+$/, '')$$

1. Compute raw SHA-256 buffer of the target file.
2. Encode in Base64.
3. Strip trailing padding `=` characters.

Our patcher calculates this exact hash for every modified file and updates `product.json` in place, ensuring all 11 core files pass integrity validation with `[OK]`.

---

## 3. Patching Mechanics

### A. Antigravity Standalone (`app.asar`)
1. **Unpacking**: The tool unpacks `resources/app.asar` to a secure temp directory.
2. **Preload Injection**: Inserts high-specificity CSS rules into `dist/preload.js` using Electron's `webFrame.insertCSS()` and DOM `<style>` injection.
3. **Repackaging**: Packs the archive back into `app.asar` without breaking native dependencies.

### B. Antigravity IDE
1. **HTML Layer**: Injects a scoped `<style>` block into `workbench-jetski-agent.html` so Chromium applies unpinning before React hydration.
2. **Tailwind Layer**: Appends unpin rules to `jetskiMain.tailwind.css` and `workbench.desktop.main.css`.
3. **React AST / JSX Layer**: Rewrites `className:"sticky top-0 z-10 ..."` to `className:"relative top-auto z-10 ..."` in `jetskiAgent/main.js`.
4. **V8 Bytecode Cache Purge**: Flushes `AppData/Roaming/Antigravity IDE/Code Cache/js` and `CachedData` so V8 recompiles fresh assets immediately.
