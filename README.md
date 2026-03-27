# 🧹 Cleaner Pro+

> A Chrome extension that automatically removes buttons, links, and interactive UI elements containing specified keywords from any webpage.

## ✨ Features

- **Keyword-Based Removal** — Define keywords (e.g. "Apply Now", "Sign Up"), and any button/link containing them will be automatically removed from the page.
- **Smart Button Detection** — Uses `TreeWalker` to locate keyword text, then **bubbles up** to find the outermost button shell (including background, border, shadow), ensuring the entire clickable element is removed — not just the text.
- **10+ UI Framework Support** — Works with buttons from all major component libraries:

  | Framework | Detected Classes |
  |-----------|-----------------|
  | Element UI / Element Plus | `el-button`, `el-link`, `el-tag`, `el-dropdown-menu__item` |
  | Ant Design / Ant Design Vue | `ant-btn`, `ant-tag`, `ant-switch` |
  | Bootstrap | `btn` |
  | Vuetify | `v-btn`, `v-chip` |
  | Material UI (React) | `MuiButton`, `MuiChip`, `MuiIconButton` |
  | Naive UI | `n-button`, `n-tag` |
  | Arco Design | `arco-btn` |
  | TDesign | `t-button`, `t-tag` |
  | iView / View UI | `ivu-btn`, `ivu-tag` |

- **Whitelist** — Exclude specific domains from being cleaned.
- **Real-Time Config** — Changes to keywords or whitelist take effect immediately without page refresh.
- **MutationObserver with Debounce** — Monitors dynamic content (SPA, lazy-loaded elements) with a 200ms debounce to prevent infinite loops.
- **Manual Clean** — One-click button to re-scan and clean the current page.
- **Removal Counter** — Displays how many elements have been removed on the current page.
- **Console Logging** — Detailed logs in DevTools console showing exactly what was removed.

## 📦 Installation

1. Download or clone this repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the `cleaner-pro-plus` folder.
5. The extension icon will appear in your toolbar.

### Generate Icons

Icons are pre-built in the `icons/` folder (16×16, 48×48, 128×128 PNG).

## 🚀 Usage

### Basic
1. Click the extension icon in the toolbar.
2. The popup shows the current removal count and an on/off toggle.
3. Click **⚙️ Rule Settings** to configure keywords and whitelist.

### Configuration
- **Keywords** — Comma-separated list of keywords. Any button/link whose text contains these words will be removed.
  ```
  Apply Now, Sign Up, Subscribe, Open Account
  ```
- **Whitelist** — One domain per line. Pages matching these domains will not be cleaned.
  ```
  github.com
  localhost
  ```

### Console Output
Open DevTools (F12) → Console to see removal logs:
```
[Cleaner Pro+] Removed: <button class="el-button el-button--primary"> "Search"
[Cleaner Pro+] Removed: <a class="el-link el-link--primary"> "View Details"
```

## 🏗️ Architecture

```
cleaner-pro-plus/
├── manifest.json        # Extension manifest (MV3)
├── content.js           # Core cleaning logic (injected into every page)
├── popup.html/js        # Extension popup UI
├── options.html/js      # Settings page
├── icons/               # Extension icons (16/48/128 PNG)
```

### How It Works

```
1. TreeWalker scans all text nodes in the page
       ↓
2. Finds text nodes containing any keyword
       ↓
3. For each match, calls findButtonAncestor()
   to bubble up and find the outermost button shell
       ↓
4. Collects all targets into a Set (deduplicated)
       ↓
5. Pauses MutationObserver → batch removes all targets → resumes Observer
```

**Key Design Decisions:**
- **TreeWalker over querySelectorAll** — Directly finds text containing keywords, rather than checking every element's `innerText` (which could match large containers).
- **Bubble-Up Strategy** — Prevents the "empty button shell" problem where only the inner `<span>` text is removed but the `<button>` background remains.
- **Debounced MutationObserver** — Merges rapid DOM changes (common in SPAs) into a single clean pass, preventing infinite removal loops.

## 📄 License

MIT License. Free to use and modify.

