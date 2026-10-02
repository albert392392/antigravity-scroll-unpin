<div align="center">

# 🚀 Antigravity Scroll Unpin

**Zero-corruption, self-healing patcher to permanently unpin sticky user prompt headers in Google Antigravity & Antigravity IDE across all updates and new chats.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform: Windows | macOS | Linux](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-brightgreen.svg)](#)
[![Node: >=16](https://img.shields.io/badge/Node-%3E%3D16-informational.svg)](#)
[![Status: Production Ready](https://img.shields.io/badge/Status-Production%20Ready-success.svg)](#)

[English](#features) • [فارسی](#راهنمای-فارسی) • [Technical Architecture](docs/ARCHITECTURE.md) • [Resume Highlights](docs/RESUME_HIGHLIGHT.md)

</div>

---

## ⚡ The Problem

In **Google Antigravity** and **Antigravity IDE**, the user prompt card in the Agent chat is permanently **pinned (sticky)** to the top of the chat panel.

- **Viewport Hog**: Multi-line prompts claim **30% to 50% of vertical screen space**, floating over code diffs, terminal outputs, and execution logs.
- **Upstream Updates Revert Edits**: Every silent or official Antigravity update overwrites patched files, re-locking headers to the top.
- **SPA Re-renders / New Chat**: Creating a "New Chat", opening secondary tabs, or switching cascade threads dynamically re-renders elements with sticky classes.
- **Integrity Alarms**: Manually modifying VS Code / Antigravity files triggers the dreaded security alarm:
  > ⚠️ **Your Antigravity IDE installation appears to be corrupt. Please reinstall.**

---

## ✨ Features (Triple-Layer Architecture)

- 🔓 **Universal Unpinning**: Prompts scroll naturally out of view when scrolling down, freeing 100% of your conversation viewport.
- ⚡ **CSS-only Preload Injection**: `webFrame.insertCSS()` applies the unpin rules without observing or rescanning the chat DOM; CSS automatically covers newly rendered chats.
- 🛡️ **Zero-Corruption Guarantee**: Automatically recalculates and updates cryptographic SHA-256 base64 checksums in `product.json`—**zero corruption warnings**.
- ⚡ **Self-Healing Auto-Update Daemon**: Monitors installation directories with native file-system watchers. When Google updates Antigravity, the daemon automatically re-applies the patch and re-signs checksums in <2 seconds.
- 🔄 **Supports Both Flavors**:
  - **Antigravity Standalone** (`app.asar` Electron extraction & preload hook)
  - **Antigravity IDE** (VS Code Webview CSS, AST rewrite & checksum re-signing)
- 💾 **100% Reversible**: Automatically creates `.bak` backups before modifying any file. Restore original stock files with a single flag (`--restore`).
- 🧹 **V8 Cache Invalidation**: Flushes stale bytecode cache (`Code Cache/js` and `CachedData`) so changes reflect immediately.

---

## 🚀 Quick Start

### 1. Apply Patch (1-Click)

Using Node CLI:
```bash
node bin/cli.js --apply
```

Or using native PowerShell:
```powershell
.\scripts\patch.ps1 -Apply
```

---

### 2. Enable Self-Healing Background Service (Survives Updates)

To run the background watcher silently on Windows so that Google updates never re-lock your headers:

```bash
# Install silent Windows background service (Starts automatically on login)
node bin/cli.js --install-service

# Or via PowerShell
.\scripts\patch.ps1 -InstallService
```

To run interactive monitoring in your console:
```bash
node bin/cli.js --watch
```

To remove the background service at any time:
```bash
node bin/cli.js --uninstall-service
```

---

### 3. Verification & Status Check

Check installation health and confirm all 11 core VS Code files have 100% valid checksums:

```bash
node bin/cli.js --status
```

Expected output:
```
Checksum Status: ✓ 100% Valid (Clean Integrity)
  [PASS] vs/base/parts/sandbox/electron-browser/preload.js
  [PASS] vs/workbench/workbench.desktop.main.js
  [PASS] vs/workbench/workbench.desktop.main.css
  [PASS] vs/workbench/api/node/extensionHostProcess.js
  [PASS] vs/code/electron-browser/workbench/workbench.html
  [PASS] vs/code/electron-browser/workbench/workbench.js
  [PASS] vs/code/electron-browser/workbench/workbench-jetski-agent.html
  [PASS] vs/code/electron-browser/workbench/jetskiAgent.js
  [PASS] jetskiAgent/main.js
  [PASS] jetskiMain.tailwind.css
  [PASS] tw-base.tailwind.css
```

---

### 4. Restore Stock Antigravity

To revert all files to pristine official Google stock state:

```bash
node bin/cli.js --restore
```

---

## 🔍 Visual Comparison

| Before (Stock Antigravity) | After (With Unpin Patcher) |
| :--- | :--- |
| ❌ Huge prompt box stays pinned to the top | ✅ Prompt scrolls away naturally |
| ❌ Terminal output & code diffs hidden behind prompt | ✅ Full viewport available for agent responses |
| ❌ Updates revert changes | ✅ Self-healing daemon re-patches on update in <2s |
| ❌ "New Chat" re-locks sticky headers | ✅ CSS selectors keep new chats unpinned without DOM observers |
| ❌ Manual edits trigger `"Installation Corrupt"` warning | ✅ 100% cryptographically re-signed `product.json` |

---

## 🛠️ Technical Architecture

1. **Preload CSS Injection (`preload.js`)**: Invokes `webFrame.insertCSS()` at startup. Browser CSS selectors apply to existing and newly rendered chat nodes without a persistent DOM observer.
2. **Multi-File CSS & JSX Neutralization**: Injects universal `!important` unpin rules into `workbench-jetski-agent.html`, `workbench.html`, `jetskiMain.tailwind.css`, `jetskiAgent/main.css`, and `tw-base.tailwind.css`.
3. **Cryptographic Re-Signing**: Re-computes SHA-256 base64 digests for all modified core VS Code files and writes them to `product.json`:
   $$\text{Digest} = \text{Base64}(\text{SHA-256}(\text{FileBytes})).\text{replace}(/=+$/, '')$$
4. **Self-Healing Watcher Daemon**: Native `fs.watch` daemon running silently in background. Listens for binary replacements in `resources/` and automatically re-patches within 2 seconds.

Read the full technical specification in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## 🇮🇷 راهنمای فارسی

### مشکل چه بود؟
در نرم‌افزارهای آنتی‌گراویتی (نسخه مستقل و نسخه IDE)، باکس پیام کاربر هنگام اسکرول به پایین به بالای صفحه می‌چسبید (Sticky) و نصف صفحه را اشغال می‌کرد. علاوه بر این:
1. **با هر آپدیت گوگل**، فایل‌ها بازنویسی شده و پچ پاک می‌شد.
2. **با باز کردن صفحه چت جدید (New Chat)** یا تغییر تب، فرآیند رندر React دوباره کلاس‌های sticky را اضافه می‌کرد.
3. دستکاری دستی فایل‌ها باعث اخطار امنیتی «نرم‌افزار خراب است» (Corrupted Installation) می‌شد.

### راه‌حل سه‌لایه این ابزار چیست؟
1. **آن‌پین ۱۰۰٪ و بدون اخطار:** حذف حالت چسبنده از تمامی صفحات و امضای دیجیتال مجدد جدول `product.json` با هش‌های معتبر SHA-256.
2. **تزریق سبک CSS در زمان اجرا:** قانون‌های CSS در `preload.js` با هر رندر جدید خودکار اعمال می‌شوند و دیگر کل DOM چت را رصد یا اسکن نمی‌کنند.
3. **سرویس پس‌زمینه خودترمیم‌شونده (Self-Healing Daemon):** مانیتورینگ پوشه‌های برنامه در پس‌زمینه که به محض دانلود آپدیت جدید توسط گوگل، ظرف ۲ ثانیه پچ را اتوماتیک و بدون دخالت دست مجدداً اعمال می‌کند.

برای نصب سرویس خودترمیم‌شونده در پس‌زمینه ویندوز:
```powershell
.\scripts\patch.ps1 -InstallService
```

---

## 📜 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more information.
