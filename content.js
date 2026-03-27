
(function () {
    // ========== 配置 ==========
    let config = {
        enabled: true,
        keywords: ["开卡"],
        whitelist: []
    };
    let observer = null;
    let cleanTimer = null;
    let removedCount = 0;

    // ========== 初始化：读取配置并启动 ==========
    chrome.storage.sync.get(["config"], (res) => {
        if (res.config) config = res.config;
        if (config.enabled && !isWhitelisted()) {
            init();
        }
    });

    // ========== 实时监听配置变化 ==========
    chrome.storage.onChanged.addListener((changes) => {
        if (changes.config) {
            config = changes.config.newValue || config;
            // 停掉旧的 observer
            if (observer) {
                observer.disconnect();
                observer = null;
            }
            if (config.enabled && !isWhitelisted()) {
                init();
            }
        }
    });

    // ========== 白名单检查 ==========
    function isWhitelisted() {
        return config.whitelist.some(site => site && location.href.includes(site));
    }

    // ========== 判断元素是否为"按钮级"元素 ==========
    // 这类元素是完整的按钮壳子（含背景/边框/样式），删除时要连壳一起删
    function isButtonLevel(el) {
        const tag = el.tagName.toLowerCase();
        if (tag === "button" || tag === "a" || tag === "input") return true;

        const role = el.getAttribute("role");
        if (role === "button" || role === "link" || role === "tab" || role === "menuitem") return true;

        const cls = el.className || "";
        if (typeof cls === "string") {
            const btnPatterns = [
                // Element UI / Element Plus
                "el-button", "el-link", "el-tag", "el-dropdown-menu__item",
                "el-checkbox", "el-radio", "el-switch",
                // Ant Design / Ant Design Vue
                "ant-btn", "ant-tag", "ant-switch",
                // Bootstrap
                "btn",
                // Vuetify
                "v-btn", "v-chip",
                // Material UI (React)
                "mdc-button", "MuiButton", "MuiChip", "MuiIconButton",
                // Naive UI
                "n-button", "n-tag",
                // Arco Design
                "arco-btn",
                // TDesign
                "t-button", "t-tag",
                // iView / View UI
                "ivu-btn", "ivu-tag"
            ];
            if (btnPatterns.some(p => cls.includes(p))) return true;
        }
        return false;
    }

    // ========== 向上冒泡，找最近的按钮级祖先（连壳删） ==========
    //  <button class="el-button">        ← 蓝色背景壳子，要删这个
    //    <span>搜 索</span>              ← 文字在这里被匹配到
    //  </button>
    function findButtonAncestor(el) {
        let node = el.parentElement;
        let found = null;
        for (let i = 0; i < 8 && node; i++) {
            if (isButtonLevel(node)) {
                // ★ 安全检查：如果这个按钮级元素包含多个可点击子元素，
                //   说明它是一个"按钮容器"（如 button-group），不应该删它
                if (found && hasMultipleClickableChildren(node)) {
                    break; // 停止冒泡，用之前找到的更精确的 found
                }
                found = node;
                // ★ 检查：如果当前 found 自身的文本跟关键词无关，也停止
                //   防止 <a><div>无关内容<button>开卡</button></div></a> 误删整个 <a>
                const foundText = (found.innerText || "").trim();
                if (foundText.length > 100) {
                    break; // 文本太长，说明是大容器，停在这里
                }
            } else {
                // 非按钮级元素，但如果已找到一个按钮壳就不再往上
                // 除非下一层也是按钮（嵌套情况如 <a><button>）
                if (found) break;
            }
            node = node.parentElement;
        }
        return found;
    }

    // ========== 检查元素是否包含多个可点击子元素 ==========
    // 用于防止删除按钮组/工具栏等容器
    function hasMultipleClickableChildren(el) {
        let count = 0;
        const children = el.children;
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (isButtonLevel(child) || child.tagName === "BUTTON" || child.tagName === "A") {
                count++;
                if (count >= 2) return true;
            }
        }
        // 也检查更深一层（如 button-group 里套了 div 再套 button）
        if (count < 2) {
            const deepBtns = el.querySelectorAll("button, a, [role='button'], .el-button, .ant-btn, .btn, .v-btn, .n-button");
            if (deepBtns.length >= 2) return true;
        }
        return false;
    }

    // ========== 辅助：判断普通元素是否可点击 ==========
    function isClickable(el) {
        if (isButtonLevel(el)) return true;
        if (el.onclick || el.hasAttribute("onclick")) return true;
        if (el.hasAttribute("tabindex")) return true;
        try {
            if (getComputedStyle(el).cursor === "pointer") return true;
        } catch (e) { /* 忽略 */ }
        return false;
    }

    // ========== 文本是否包含任一关键词 ==========
    function textHasKeyword(text) {
        if (!text) return false;
        return config.keywords.some(k => k && text.includes(k));
    }

    // ========== 核心清理函数 ==========
    function clean() {
        if (!document.body) return;

        const toRemove = new Set();

        // ── 第一步：用 TreeWalker 遍历所有文本节点，精准定位关键字 ──
        const walker = document.createTreeWalker(
            document.body, NodeFilter.SHOW_TEXT, null
        );
        const matchedTextNodes = [];
        let textNode;
        while ((textNode = walker.nextNode())) {
            if (textHasKeyword(textNode.textContent.trim())) {
                matchedTextNodes.push(textNode);
            }
        }

        // ── 第二步：对每个匹配文本，向上冒泡找按钮壳 ──
        matchedTextNodes.forEach(tNode => {
            let targetEl = tNode.parentElement;
            if (!targetEl || !targetEl.isConnected) return;

            // 核心：向上找按钮壳子
            const btnAncestor = findButtonAncestor(targetEl);
            if (btnAncestor) {
                // ★ 安全验证：确认找到的壳子的可见文本确实包含关键词
                const shellText = (btnAncestor.innerText || "").trim();
                if (textHasKeyword(shellText)) {
                    targetEl = btnAncestor;       // 找到壳子，删整个壳
                } else {
                    // 壳子文本不含关键词（可能冒泡过头了），只删文本的直接父元素
                    if (!isClickable(targetEl)) return;
                }
            } else if (isButtonLevel(targetEl)) {
                // 自身就是按钮级，删自身
            } else {
                // 没有按钮壳，检查自身是否可点击
                if (!isClickable(targetEl)) return;
                // 防误删大容器
                if ((targetEl.innerText || "").trim().length > 50) return;
            }

            // ★ 最终安全检查：目标元素包含多个按钮时不删
            if (hasMultipleClickableChildren(targetEl)) {
                return; // 这是一个容器，里面有多个按钮，跳过
            }

            // 去重：如果 targetEl 已被更大的待删元素包含，跳过
            let dominated = false;
            for (const existing of toRemove) {
                if (existing.contains(targetEl)) { dominated = true; break; }
                if (targetEl.contains(existing)) { toRemove.delete(existing); }
            }
            if (!dominated) toRemove.add(targetEl);
        });

        // ── 第三步：批量删除 ──
        if (toRemove.size > 0) {
            if (observer) observer.disconnect();

            toRemove.forEach(el => {
                if (el.isConnected) {
                    const txt = (el.innerText || "").trim().slice(0, 40);
                    const tag = el.tagName.toLowerCase();
                    const cls = (el.className || "").toString().slice(0, 60);
                    console.log(`[Cleaner Pro+] 已移除: <${tag} class="${cls}"> "${txt}"`);
                    el.remove();
                    removedCount++;
                }
            });

            if (observer) {
                observer.observe(document.body, { childList: true, subtree: true });
            }
            chrome.storage.local.set({ removedCount });
        }
    }

    // ========== 防抖清理 ==========
    function scheduleClean() {
        if (cleanTimer) clearTimeout(cleanTimer);
        cleanTimer = setTimeout(() => {
            clean();
        }, 200); // 200ms 防抖，合并多次 DOM 变化
    }

    // ========== 初始化 ==========
    function init() {
        removedCount = 0;

        // 首次清理
        clean();

        // 监听 DOM 变化（使用防抖，避免无限循环）
        observer = new MutationObserver((mutations) => {
            // 只在有新增节点时才触发清理
            const hasNewNodes = mutations.some(m => m.addedNodes.length > 0);
            if (hasNewNodes) {
                scheduleClean();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // ========== 监听来自 popup 的消息 ==========
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
        if (msg.action === "getCount") {
            sendResponse({ count: removedCount });
        } else if (msg.action === "manualClean") {
            clean();
            sendResponse({ count: removedCount });
        }
    });
})();
