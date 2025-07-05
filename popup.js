document.getElementById('full-screenshot').addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.captureVisibleTab(null, {format: 'png'}, (dataUrl) => {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "processScreenshot", 
          screenshot: dataUrl
        });
        window.close();
      });
    });
  });
  
  document.getElementById('area-screenshot').addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "activateAreaSelection"
      });
      window.close();
    });
  });
  
  document.getElementById('open-settings').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });