
const toggleBtn = document.getElementById("toggle");
const optionsBtn = document.getElementById("options");
const manualBtn = document.getElementById("manualClean");
const countEl = document.getElementById("count");
const statusBox = document.getElementById("statusBox");

// 更新 UI 状态
function updateUI(enabled) {
    toggleBtn.innerText = enabled ? "🔴 关闭清理" : "🟢 开启清理";
    toggleBtn.className = enabled ? "" : "off";
    statusBox.className = "status " + (enabled ? "on" : "off");
    if (!enabled) {
        countEl.innerText = "已关闭";
    }
}

// 获取当前页面清理计数
function refreshCount() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "getCount" }, (res) => {
                if (chrome.runtime.lastError) {
                    countEl.innerText = "N/A";
                    return;
                }
                if (res && res.count !== undefined) {
                    countEl.innerText = res.count;
                }
            });
        }
    });
}

// 初始化
chrome.storage.sync.get(["config"], (res) => {
    let c = res.config || { enabled: true, keywords: ["开卡"], whitelist: [] };
    updateUI(c.enabled);
    if (c.enabled) refreshCount();

    toggleBtn.onclick = () => {
        c.enabled = !c.enabled;
        chrome.storage.sync.set({ config: c });
        updateUI(c.enabled);
        if (c.enabled) {
            // 重新加载当前页面以应用清理
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) chrome.tabs.reload(tabs[0].id);
            });
        }
    };
});

// 手动清理按钮
manualBtn.onclick = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "manualClean" }, (res) => {
                if (chrome.runtime.lastError) {
                    countEl.innerText = "N/A";
                    return;
                }
                if (res && res.count !== undefined) {
                    countEl.innerText = res.count;
                }
            });
        }
    });
};

// 规则设置按钮
optionsBtn.onclick = () => {
    chrome.runtime.openOptionsPage();
};
