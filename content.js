// 监听来自background的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "processScreenshot") {
      showScreenshotUI(request.screenshot);
    } else if (request.action === "activateAreaSelection") {
      initAreaSelection();
    } else if (request.action === "processCapturedArea") {
      cropScreenshot(request.fullScreenshot, request.area);
    }
  });
  
  // 初始化区域选择
  function initAreaSelection() {
    // 创建选择框容器
    const selectionContainer = document.createElement('div');
    selectionContainer.id = 'screenshot-selection-container';
    selectionContainer.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; z-index:9999; cursor:crosshair; background:rgba(0,0,0,0.2);';
    
    // 创建选择框
    const selectionBox = document.createElement('div');
    selectionBox.id = 'screenshot-selection-box';
    selectionBox.style.cssText = 'position:absolute; border:2px dashed #fff; background:rgba(0,123,255,0.2); display:none;';
    
    // 创建指导提示
    const guide = document.createElement('div');
    guide.id = 'screenshot-guide';
    guide.textContent = '点击并拖动以选择区域，按ESC取消';
    guide.style.cssText = 'position:fixed; top:10px; left:50%; transform:translateX(-50%); background:black; color:white; padding:8px 12px; border-radius:4px;';
    
    selectionContainer.appendChild(selectionBox);
    selectionContainer.appendChild(guide);
    document.body.appendChild(selectionContainer);
    
    // 跟踪选择状态
    let selecting = false;
    let startX, startY;
    
    // 添加事件监听器
    selectionContainer.addEventListener('mousedown', (e) => {
      selecting = true;
      startX = e.clientX;
      startY = e.clientY;
      
      selectionBox.style.left = startX + 'px';
      selectionBox.style.top = startY + 'px';
      selectionBox.style.width = '0px';
      selectionBox.style.height = '0px';
      selectionBox.style.display = 'block';
    });
    
    selectionContainer.addEventListener('mousemove', (e) => {
      if (!selecting) return;
      
      const currentX = e.clientX;
      const currentY = e.clientY;
      
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);
      
      const left = Math.min(startX, currentX);
      const top = Math.min(startY, currentY);
      
      selectionBox.style.left = left + 'px';
      selectionBox.style.top = top + 'px';
      selectionBox.style.width = width + 'px';
      selectionBox.style.height = height + 'px';
    });
    
    selectionContainer.addEventListener('mouseup', (e) => {
      if (!selecting) return;
      selecting = false;
      
      // 获取选择的坐标
      const rect = {
        left: parseInt(selectionBox.style.left, 10),
        top: parseInt(selectionBox.style.top, 10),
        width: parseInt(selectionBox.style.width, 10),
        height: parseInt(selectionBox.style.height, 10)
      };
      
      // 检查是否选择了足够大的区域
      if (rect.width < 10 || rect.height < 10) {
        // 区域太小，显示提示
        guide.textContent = '所选区域太小，请重新选择';
        guide.style.background = 'red';
        setTimeout(() => {
          guide.textContent = '点击并拖动以选择区域，按ESC取消';
          guide.style.background = 'black';
        }, 1500);
        return;
      }
      
      // 移除选择UI
      document.body.removeChild(selectionContainer);
      
      // 向background请求截图
      chrome.runtime.sendMessage({
        action: "captureArea",
        area: rect
      });
    });
    
    // 按ESC键取消
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        document.body.removeChild(selectionContainer);
        document.removeEventListener('keydown', escHandler);
      }
    });
  }
  
  // 裁剪截图
  function cropScreenshot(fullScreenshotUrl, area) {
    const img = new Image();
    img.onload = function() {
      // 创建canvas进行裁剪
      const canvas = document.createElement('canvas');
      canvas.width = area.width;
      canvas.height = area.height;
      const ctx = canvas.getContext('2d');
      
      // 计算设备像素比例，以处理高DPI显示器
      const dpr = window.devicePixelRatio || 1;
      
      // 裁剪图像
      ctx.drawImage(
        img, 
        area.left * dpr, area.top * dpr, 
        area.width * dpr, area.height * dpr,
        0, 0, area.width, area.height
      );
      
      // 获取裁剪后的图像数据
      const croppedImageUrl = canvas.toDataURL('image/png');
      
      // 显示结果
      showScreenshotUI(croppedImageUrl);
    };
    img.src = fullScreenshotUrl;
  }
  
  // 显示截图UI
  function showScreenshotUI(screenshotUrl) {
    // 创建一个浮动层显示截图和分析按钮
    const overlay = document.createElement('div');
    overlay.id = 'ai-screenshot-overlay';
    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; z-index:9999; backdrop-filter:blur(3px); display:flex; justify-content:center; align-items:center;';
    
    const container = document.createElement('div');
    container.style.cssText = 'background:white; padding:20px; border-radius:10px; box-shadow:0 0 20px rgba(0,0,0,0.3); max-width:800px; width:80%;';
    
    const img = document.createElement('img');
    img.src = screenshotUrl;
    img.style.width = '100%';
    
    // 添加服务提供商选择
    const providerSelect = document.createElement('select');
    providerSelect.id = 'ai-provider-select';
    providerSelect.style.cssText = 'margin:10px 0; padding:8px; width:100%;';
    
    const openaiOption = document.createElement('option');
    openaiOption.value = 'openai';
    openaiOption.textContent = 'OpenAI';
    
    const siliconflowOption = document.createElement('option');
    siliconflowOption.value = 'siliconflow';
    siliconflowOption.textContent = '硅基流动';
    
    providerSelect.appendChild(openaiOption);
    providerSelect.appendChild(siliconflowOption);
    
    // 添加询问内容输入框
    const queryInput = document.createElement('input');
    queryInput.type = 'text';
    queryInput.id = 'ai-query-input';
    queryInput.placeholder = '请输入您要询问的内容';
    queryInput.style.cssText = 'width:100%; padding:8px; margin:10px 0; box-sizing:border-box;';
    
    // 按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'display:flex; margin-top:10px;';
    
    const analyzeButton = document.createElement('button');
    analyzeButton.textContent = '分析图片';
    analyzeButton.style.cssText = 'background:#4285f4; color:white; border:none; padding:8px 15px; border-radius:4px; cursor:pointer; margin-right:10px; flex:1;';
    analyzeButton.onclick = () => {
      const provider = providerSelect.value;
      const query = queryInput.value.trim() || "请分析这张图片并描述其中的内容";
      analyzeImage(screenshotUrl, provider, query, container);
    };
    
    const cancelButton = document.createElement('button');
    cancelButton.textContent = '取消';
    cancelButton.style.cssText = 'background:#f44336; color:white; border:none; padding:8px 15px; border-radius:4px; cursor:pointer; flex:1;';
    cancelButton.onclick = () => document.body.removeChild(overlay);
    
      buttonContainer.appendChild(analyzeButton);
  buttonContainer.appendChild(cancelButton);
  
  container.appendChild(img);
  container.appendChild(providerSelect);
  container.appendChild(queryInput);
  container.appendChild(buttonContainer);
  overlay.appendChild(container);
  document.body.appendChild(overlay);
}

// 分析图片
function analyzeImage(imageUrl, provider, query, container) {
  // 创建结果容器
  const resultContainer = document.createElement('div');
  resultContainer.id = 'ai-result-container';
  resultContainer.style.cssText = 'margin-top:20px; padding:15px; background:#f8f9fa; border-radius:5px; max-height:300px; overflow-y:auto;';
  resultContainer.innerHTML = '<div style="text-align:center;">分析中，请稍候...</div>';
  
  container.appendChild(resultContainer);
  
  // 提取图片base64数据
  const imageData = imageUrl.split(',')[1];
  
  // 从storage获取API密钥
  chrome.storage.sync.get(['openaiApiKey', 'siliconflowApiKey'], (keys) => {
    if (provider === 'openai') {
      const apiKey = keys.openaiApiKey;
      if (!apiKey) {
        resultContainer.innerHTML = '<div style="color:red;">请先在扩展设置中配置OpenAI API密钥</div>';
        return;
      }
      callOpenAI(apiKey, imageData, query, resultContainer);
    } else if (provider === 'siliconflow') {
      const apiKey = keys.siliconflowApiKey;
      if (!apiKey) {
        resultContainer.innerHTML = '<div style="color:red;">请先在扩展设置中配置硅基流动API密钥</div>';
        return;
      }
      callSiliconFlow(apiKey, imageData, query, resultContainer);
    }
  });
}

// 调用OpenAI API
function callOpenAI(apiKey, imageData, query, resultContainer) {
  fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: query },
            { type: "image_url", image_url: { url: `data:image/png;base64,${imageData}` } }
          ]
        }
      ],
      max_tokens: 500
    })
  })
  .then(response => {
    if (!response.ok) throw new Error(`API请求失败: ${response.status}`);
    return response.json();
  })
  .then(data => {
    if (data.error) throw new Error(data.error.message);
    const content = data.choices[0].message.content;
    displayResult(content, resultContainer);
  })
  .catch(error => {
    resultContainer.innerHTML = `<div style="color:red;">分析失败: ${error.message}</div>`;
  });
}

// 调用硅基流动API
function callSiliconFlow(apiKey, imageData, query, resultContainer) {
  fetch('https://api.siliconflow.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "Qwen/Qwen2-VL-72B-Instruct",
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:image/png;base64,${imageData}` } },
            { type: "text", text: query }
          ]
        }
      ],
      stream: false
    })
  })
  .then(response => {
    if (!response.ok) throw new Error(`API请求失败: ${response.status}`);
    return response.json();
  })
  .then(data => {
    if (data.error) throw new Error(data.error.message);
    const content = data.choices[0].message.content;
    displayResult(content, resultContainer);
  })
  .catch(error => {
    resultContainer.innerHTML = `<div style="color:red;">分析失败: ${error.message}</div>`;
  });
}

// 显示结果
function displayResult(content, container) {
  if (typeof marked !== 'undefined') {
    // 使用markdown渲染
    container.innerHTML = `<div>${marked.parse(content)}</div>`;
  } else {
    // 不使用markdown渲染
    container.innerHTML = `<div style="white-space:pre-wrap;">${content}</div>`;
  }
  
  // 添加复制按钮
  const copyButton = document.createElement('button');
  copyButton.textContent = '复制结果';
  copyButton.style.cssText = 'margin-top:10px; background:#4285f4; color:white; border:none; padding:8px 15px; border-radius:4px; cursor:pointer;';
  copyButton.onclick = () => {
    navigator.clipboard.writeText(content)
      .then(() => {
        copyButton.textContent = '已复制！';
        setTimeout(() => copyButton.textContent = '复制结果', 2000);
      });
  };
  
  container.appendChild(copyButton);
}