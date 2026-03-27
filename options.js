
const keywordsInput = document.getElementById("keywords");
const whitelistInput = document.getElementById("whitelist");
const saveBtn = document.getElementById("save");
const msgEl = document.getElementById("msg");

// 读取并显示现有配置
chrome.storage.sync.get(["config"], (res) => {
    let c = res.config || { enabled: true, keywords: ["开卡"], whitelist: [] };
    keywordsInput.value = c.keywords.join(", ");
    whitelistInput.value = c.whitelist.join("\n");
});

// 保存配置
saveBtn.onclick = () => {
    const keywords = keywordsInput.value
        .split(",")
        .map(i => i.trim())
        .filter(i => i.length > 0); // 过滤空值

    const whitelist = whitelistInput.value
        .split("\n")
        .map(i => i.trim())
        .filter(i => i.length > 0); // 过滤空行

    if (keywords.length === 0) {
        alert("请至少输入一个关键词！");
        return;
    }

    // 保留现有的 enabled 状态
    chrome.storage.sync.get(["config"], (res) => {
        const oldConfig = res.config || {};
        const config = {
            enabled: oldConfig.enabled !== undefined ? oldConfig.enabled : true,
            keywords,
            whitelist
        };
        chrome.storage.sync.set({ config }, () => {
            msgEl.style.display = "block";
            setTimeout(() => { msgEl.style.display = "none"; }, 3000);
        });
    });
};

