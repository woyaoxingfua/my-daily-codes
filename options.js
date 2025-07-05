// 加载保存的设置
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.sync.get(['openaiApiKey', 'siliconflowApiKey'], (items) => {
      if (items.openaiApiKey) {
        document.getElementById('openai-api-key').value = items.openaiApiKey;
      }
      if (items.siliconflowApiKey) {
        document.getElementById('siliconflow-api-key').value = items.siliconflowApiKey;
      }
    });
  });
  
  // 保存设置
  document.getElementById('save-button').addEventListener('click', () => {
    const openaiApiKey = document.getElementById('openai-api-key').value.trim();
    const siliconflowApiKey = document.getElementById('siliconflow-api-key').value.trim();
    
    chrome.storage.sync.set({
      openaiApiKey: openaiApiKey,
      siliconflowApiKey: siliconflowApiKey
    }, () => {
      const status = document.getElementById('status-message');
      status.textContent = '设置已保存！';
      status.style.display = 'block';
      
      setTimeout(() => {
        status.style.display = 'none';
      }, 3000);
    });
  });