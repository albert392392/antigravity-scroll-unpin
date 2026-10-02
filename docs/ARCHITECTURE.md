# Architecture & Technical Deep Dive

## Overview

**Antigravity Scroll Unpin** solves a frustrating UX limitation in Google's **Antigravity** and **Antigravity IDE**: the agent chat input prompt is permanently stuck (`position: sticky; top: 0;`) to the top of the chat panel. For multi-line prompts or smaller viewports, this sticky card claims 30% to 50% of vertical screen space, obscuring code diffs, terminal outputs, and intermediate reasoning.

This document outlines the reverse-engineered internal architecture, analyzes the linear and non-linear failure vectors, and explains how this tool achieves permanent, zero-corruption self-healing unpinning.

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

## 2. Failure Vectors: Linear & Non-Linear Analysis

### Linear Vectors (Upstream Updates & Static Overwrites)
1. **Upstream Updates**: When Google Antigravity or Antigravity IDE updates via Squirrel or VS Code installer, all internal files (`app.asar`, `out/jetskiAgent/main.js`, `product.json`) are overwritten with fresh stock copies. Any static patch is wiped.
2. **Missing Stylesheet Scopes**: In earlier revisions, `jetskiAgent/main.css` (106 KB) was omitted from patching, leaving default sticky rules active in certain sub-views.

### Non-Linear Vectors (Dynamic DOM & SPA Re-renders)
1. **New Chat & Cascade Swapping**: The chat interface is an interactive Single Page Application (SPA) powered by Preact and Tailwind. When a user clicks "New Chat" or switches conversation threads, the virtual DOM unmounts and remounts elements with fresh JSX class strings (`sticky top-0 z-10 mb-4 bg-background after:...`). Static CSS alone can be bypassed or overridden if scoping is lost.
2. **Pseudo-element Shadow (`::after`)**: Tailwind injects a 28px bottom shadow (`after:h-7 after:bg-gradient-to-b after:from-background after:to-transparent after:pointer-events-none`). When unpinned, this gradient must be explicitly removed (`display: none !important;`).
3. **V8 Bytecode Cache**: Stale pre-compiled bytecode in `AppData/Roaming/.../Code Cache` causes Electron to ignore newly written JS files until the cache is invalidated.

---

## 3. The Triple-Layer Defensive Solution

```
┌─────────────────────────────────────────────────────────────────┐
│                     Triple-Layer Defense                        │
├─────────────────────────────────────────────────────────────────┤
│ Layer 1: Universal CSS Multi-Selectors & JSX Byte Neutralization │
│   • Div, article, aria-label, testid selectors with !important  │
│   • Suppression of ::after gradient shadow                      │
│   • Injected into all 5 HTML/CSS files + JSX string             │
├─────────────────────────────────────────────────────────────────┤
│ Layer 2: CSS-only Preload Injection                             │
│   • Injected into sandbox preload.js (runs before any window)   │
│   • Native webFrame.insertCSS() at Chromium engine level        │
│   • CSS selectors also match newly rendered chats               │
│   • No persistent observer or repeated subtree scans            │
├─────────────────────────────────────────────────────────────────┤
│ Layer 3: Self-Healing Auto-Update Daemon                        │
│   • Native fs.watch on resources/ across both apps              │
│   • 2000ms debounce waits for updater completion                │
│   • Automatically re-patches and re-signs in <2 seconds         │
│   • Silent Windows background service (0 CPU / 0 console popup) │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Cryptographic Re-Signing (Zero Corruption)

VS Code verifies core bundle integrity on launch by checking file SHA-256 hashes against a pre-baked whitelist in `product.json`:

$$\text{Digest} = \text{Base64}(\text{SHA-256}(\text{RawFileBytes})).\text{replace}(/=+$/, '')$$

1. Compute raw SHA-256 buffer of the target file.
2. Encode in Base64.
3. Strip trailing padding `=` characters.

Our patcher calculates this exact hash for every modified file and updates `product.json` in place, ensuring all 11 core files pass integrity validation with `[PASS]`.

---

## 5. Verification Gate

Run integrity check natively:

```bash
node bin/cli.js --status
```

Confirm all 11 files report `[PASS]`:
- `vs/base/parts/sandbox/electron-browser/preload.js`
- `vs/workbench/workbench.desktop.main.js`
- `vs/workbench/workbench.desktop.main.css`
- `vs/workbench/api/node/extensionHostProcess.js`
- `vs/code/electron-browser/workbench/workbench.html`
- `vs/code/electron-browser/workbench/workbench.js`
- `vs/code/electron-browser/workbench/workbench-jetski-agent.html`
- `vs/code/electron-browser/workbench/jetskiAgent.js`
- `jetskiAgent/main.js`
- `jetskiMain.tailwind.css`
- `tw-base.tailwind.css`
