let injected = false;
let currentTabId = null;

// Listen for tab updates (including refreshes and navigation)
chrome.tabs.onUpdated.addListener((tabId) => {
  if (tabId === currentTabId) {
    injected = false;
    currentTabId = null;
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  console.log('Extension clicked, current state:', { injected, currentTabId });

  if (injected) {
    // Remove existing elements
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        const sidebar = document.getElementById('fashion-tryon-sidebar');
        const dragHandle = document.getElementById('fashion-tryon-drag-handle');
        if (sidebar) sidebar.remove();
        if (dragHandle) dragHandle.remove();
      }
    });
    injected = false;
    currentTabId = null;
    return;
  }

  // Inject new elements
  await chrome.scripting.insertCSS({
    target: { tabId: tab.id },
    css: `
      #fashion-tryon-sidebar {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 400px;
        height: 750px;
        border: none;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 2147483647;
        background: #2C3333;
        overflow: hidden;
      }
      
      #fashion-tryon-drag-handle {
        position: fixed;
        cursor: move;
        user-select: none;
        background: transparent;
        z-index: 2147483648;
      }
    `
  });

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: () => {
      const sidebar = document.createElement('iframe');
      sidebar.id = 'fashion-tryon-sidebar';
      sidebar.src = chrome.runtime.getURL('popup.html');
      document.body.appendChild(sidebar);

      const dragHandle = document.createElement('div');
      dragHandle.id = 'fashion-tryon-drag-handle';
      document.body.appendChild(dragHandle);

      // Add message listener for close button
      window.addEventListener('message', (event) => {
        if (event.data === 'closeExtension') {
          const sidebar = document.getElementById('fashion-tryon-sidebar');
          const dragHandle = document.getElementById('fashion-tryon-drag-handle');
          if (sidebar) sidebar.remove();
          if (dragHandle) dragHandle.remove();
          // Send message back to background script
          chrome.runtime.sendMessage({ action: 'extensionClosed' });
        }
      });

      // Your existing drag handle code...
      let isDragging = false;
      let currentX;
      let currentY;
      let initialX;
      let initialY;
      let xOffset = 20;
      let yOffset = 20;

      const updateDragHandle = () => {
        dragHandle.style.left = `${xOffset}px`;
        dragHandle.style.top = `${yOffset}px`;
        dragHandle.style.width = '340px';
        dragHandle.style.height = '40px';
        
        sidebar.style.left = `${xOffset}px`;
        sidebar.style.top = `${yOffset}px`;
      };

      const dragStart = (e) => {
        const clickX = e.clientX - xOffset;
        if (clickX > 340) return;
        
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
        if (e.target === dragHandle) {
          isDragging = true;
        }
      };

      const dragEnd = () => {
        isDragging = false;
      };

      const drag = (e) => {
        if (isDragging) {
          e.preventDefault();
          currentX = e.clientX - initialX;
          currentY = e.clientY - initialY;
          xOffset = currentX;
          yOffset = currentY;
          updateDragHandle();
        }
      };

      dragHandle.addEventListener('mousedown', dragStart);
      document.addEventListener('mousemove', drag);
      document.addEventListener('mouseup', dragEnd);

      updateDragHandle();
    }
  });
  
  injected = true;
  currentTabId = tab.id;
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'extensionClosed') {
    injected = false;
    currentTabId = null;
  }
});

chrome.windows.onRemoved.addListener((removedWindowId) => {
  if (removedWindowId === windowId) {
    windowId = null;
  }
}); 