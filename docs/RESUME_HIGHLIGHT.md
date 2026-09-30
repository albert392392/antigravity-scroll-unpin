# Resume & Portfolio Highlights

Use these bullet points in your CV, Portfolio, LinkedIn, or interview walkthroughs to showcase this project.

---

## 🎯 High-Impact Bullet Points for Software Engineers

- **Electron & Chromium Internals Reverse Engineering**: Reverse-engineered proprietary Electron application bundles (`app.asar`) and VS Code-forked architecture to isolate hardcoded CSS sticky positioning in an embedded AI agent chat interface.
- **Cryptographic Integrity & Anti-Tamper Bypass**: Deconstructed VS Code's internal SHA-256 base64 checksum validation in `product.json`, implementing an automated re-signing engine that eliminates corruption warnings (`"installation appears to be corrupt"`) post-patch.
- **Multi-Layer DOM & AST Modification**: Developed a multi-layered patching strategy combining WebFrame CSS injection, DOM style embedding in startup HTML, and string-aligned AST modifications in minified React bundles.
- **V8 Engine Cache Invalidation**: Diagnosed and resolved V8 bytecode caching issues (`Code Cache/js` and `CachedData`), automating cache invalidation for immediate UI hot-reloading.
- **Zero-Dependency Automated CLI**: Built a cross-platform CLI tool (Node.js & native PowerShell) featuring auto-detection of install paths, non-destructive atomic backups (`.bak`), and single-command rollback (`--restore`).

---

## 💡 Interview Story (STAR Method)

- **Situation**: Google Antigravity and Antigravity IDE enforce sticky user chat prompts that cover up to 50% of the viewport on long prompts, with no configuration option to disable it. Manual CSS edits trigger VS Code's strict "Corrupted Installation" security warning.
- **Task**: Create an automated, non-destructive utility that permanently unpins sticky prompts across both standalone and IDE versions without triggering VS Code's integrity alarms.
- **Action**: Reverse-engineered the build pipeline, identified `product.json` checksum hashing specifics (SHA-256 base64 without padding), extracted Electron's `app.asar`, patched `preload.js` and React bundles, and automated V8 cache flushes.
- **Result**: Successfully created an open-source 1-click CLI tool that cleans the UI, preserves 100% cryptographic checksum validity, and provides seamless backup/restore capabilities.
