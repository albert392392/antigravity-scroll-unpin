<div align="center">

# 🚀 Antigravity Scroll Unpin

**Zero-corruption patcher to unpin sticky user prompt headers in Google Antigravity & Antigravity IDE.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform: Windows | macOS | Linux](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-brightgreen.svg)](#)
[![Node: >=16](https://img.shields.io/badge/Node-%3E%3D16-informational.svg)](#)
[![Status: Production Ready](https://img.shields.io/badge/Status-Production%20Ready-success.svg)](#)

[English](#features) • [فارسی](#راهنمای-فارسی) • [Technical Architecture](docs/ARCHITECTURE.md) • [Resume Highlights](docs/RESUME_HIGHLIGHT.md)

</div>

---

## ⚡ The Problem

In **Google Antigravity** and **Antigravity IDE**, the user prompt card in the Agent chat is permanently **pinned (sticky)** to the top of the chat panel.

For multi-line prompts or smaller laptop screens, this sticky card claims **30% to 50% of vertical screen space**, floating over code diffs, terminal outputs, and execution logs. Furthermore, manually modifying VS Code / Antigravity files triggers the dreaded security alarm:

> ⚠️ **Your Antigravity IDE installation appears to be corrupt. Please reinstall.**

---

## ✨ Features

- 🔓 **Unpins Sticky Prompt Headers**: Prompts scroll naturally out of view when scrolling down, freeing 100% of your conversation viewport.
- 🛡️ **Zero-Corruption Guarantee**: Automatically recalculates and updates cryptographic SHA-256 base64 checksums in `product.json`—**zero corruption warnings**.
- 🔄 **Supports Both Flavors**:
  - **Antigravity Standalone** (`app.asar` Electron extraction & preload injection)
  - **Antigravity IDE** (VS Code Webview CSS, AST rewrite & checksum re-signing)
- 💾 **100% Reversible**: Automatically creates `.bak` backups before modifying any file. Restore original stock files with a single flag (`--restore`).
- ⚡ **Auto-detects Paths**: Smart discovery for Windows, macOS, and Linux install locations.
- 🧹 **V8 Cache Invalidation**: Flushes stale bytecode cache (`Code Cache/js` and `CachedData`) so changes reflect immediately.

---

## 🚀 Quick Start

### Option 1: Native Windows PowerShell (1-Click)

Clone and run the PowerShell script:

```powershell
git clone https://github.com/albert392392/antigravity-scroll-unpin.git
cd antigravity-scroll-unpin
.\scripts\patch.ps1 -Apply
```

To restore original stock files at any time:
```powershell
.\scripts\patch.ps1 -Restore
```

To check installation status & checksums:
```powershell
.\scripts\patch.ps1 -Status
```

---

### Option 2: Cross-Platform Node.js CLI

```bash
# Apply patch
node bin/cli.js --apply

# Or restore original files
node bin/cli.js --restore

# Or inspect status
node bin/cli.js --status
```

---

## 🔍 Visual Comparison

| Before (Stock Antigravity) | After (With Unpin Patcher) |
| :--- | :--- |
| ❌ Huge prompt box stays pinned to the top | ✅ Prompt scrolls away naturally |
| ❌ Terminal output & code diffs hidden behind prompt | ✅ Full viewport available for agent responses |
| ❌ Manual edits trigger `"Installation Corrupt"` warning | ✅ 100% cryptographically re-signed `product.json` |

---

## 🛠️ How It Works (Deep Dive)

1. **Standalone App (`app.asar`)**: Unpacks Electron archive, injects scoped `webFrame.insertCSS` & DOM styles into `dist/preload.js`, and re-packs the bundle.
2. **Antigravity IDE**: Injects high-priority styles into `workbench-jetski-agent.html`, `jetskiMain.tailwind.css`, and patches the React JSX class string in `jetskiAgent/main.js`.
3. **Cryptographic Re-Signing**: Re-computes SHA-256 base64 digests for all 11 core VS Code files and writes them to `product.json`:
   $$\text{Digest} = \text{Base64}(\text{SHA-256}(\text{FileBytes})).\text{replace}(/=+$/, '')$$
4. **V8 Cache Purge**: Clears Chromium V8 bytecode cache directories to prevent stale in-memory execution.

Read the full technical specification in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## 🇮🇷 راهنمای فارسی

### مشکل چه بود؟
در نرم‌افزار آنتی‌گراویتی (نسخه مستقل و نسخه IDE)، باکس پیام کاربر هنگام اسکرول به پایین به سقف صفحه می‌چسبید (Sticky) و بخش زیادی از صفحه را می‌پوشاند. همچنین دستکاری دستی فایل‌ها باعث ظاهر شدن اخطار «نرم‌افزار خراب است» (Corrupt Installation) می‌شد.

### این ابزار چه کار می‌کند؟
این اسکریپت با ۱ کلیک:
1. حالت Sticky را از هر دو نسخه **Antigravity** و **Antigravity IDE** حذف می‌کند تا پیام‌ها با اسکرول طبیعی بالا بروند.
2. جدول هش رمزنگاری شده (`product.json`) را دوباره محاسبه و امضا می‌کند تا **هیچ اخطاری نمایش داده نشود**.
3. نسخه پشتیبان (`.bak`) از همه فایل‌ها تهیه می‌کند و در صورت تمایل با فلش `--restore` همه چیز به حالت اولیه بازمی‌گردد.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!  
Feel free to check the [issues page](https://github.com/albert392392/antigravity-scroll-unpin/issues).

---

## 📜 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more information.
