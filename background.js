// 监听快捷键命令
chrome.commands.onCommand.addListener((command) => {
    if (command === "take-screenshot") {
      captureVisibleTab();
    } else if (command === "select-area-screenshot") {
      activateAreaSelection();
    }
  });
  
  // 截取可见页面
  function captureVisibleTab() {
    chrome.tabs.captureVisibleTab(null, {format: 'png'}, (dataUrl) => {
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "processScreenshot", 
          screenshot: dataUrl
        });
      });
    });
  }
  
  // 激活区域选择模式
  function activateAreaSelection() {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "activateAreaSelection"
      });
    });
  }
  
  // 监听来自content script的消息
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "captureArea") {
      chrome.tabs.captureVisibleTab(null, {format: 'png'}, (dataUrl) => {
        chrome.tabs.sendMessage(sender.tab.id, {
          action: "processCapturedArea",
          fullScreenshot: dataUrl,
          area: request.area
        });
      });
    }
  });