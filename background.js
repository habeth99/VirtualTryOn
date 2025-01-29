let injected = false;
let currentTabId = null;

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'windowClosed') {
    injected = false;
    currentTabId = null;
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  // Check if we're already injected in this tab
  if (currentTabId === tab.id) {
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

  // If we're injected in a different tab, clean up first
  if (currentTabId) {
    await chrome.scripting.executeScript({
      target: { tabId: currentTabId },
      function: () => {
        const sidebar = document.getElementById('fashion-tryon-sidebar');
        const dragHandle = document.getElementById('fashion-tryon-drag-handle');
        if (sidebar) sidebar.remove();
        if (dragHandle) dragHandle.remove();
      }
    });
  }

  // Now inject in the new tab
  currentTabId = tab.id;
  injected = true;

  // Inject our UI into the page
  await chrome.scripting.insertCSS({
    target: { tabId: tab.id },
    css: `
      #fashion-tryon-sidebar {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 400px;
        height: 650px;
        border: none;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 2147483647;
        background: #2C3333;  /* Charcoal color */
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
      // Create and append the iframe
      const sidebar = document.createElement('iframe');
      sidebar.id = 'fashion-tryon-sidebar';
      sidebar.src = chrome.runtime.getURL('popup.html');
      document.body.appendChild(sidebar);

      // Create drag handle
      const dragHandle = document.createElement('div');
      dragHandle.id = 'fashion-tryon-drag-handle';
      document.body.appendChild(dragHandle);

      // Initialize dragging
      let isDragging = false;
      let currentX;
      let currentY;
      let initialX;
      let initialY;
      let xOffset = 20;
      let yOffset = 20;

      // Update drag handle position
      const updateDragHandle = () => {
        dragHandle.style.left = `${xOffset}px`;
        dragHandle.style.top = `${yOffset}px`;
        dragHandle.style.width = '340px'; // Reduced width to not cover the close button
        dragHandle.style.height = '40px';  // Height for drag area
        dragHandle.style.marginRight = '60px';
        
        // Update sidebar position
        sidebar.style.left = `${xOffset}px`;
        sidebar.style.top = `${yOffset}px`;
      };

      const dragStart = (e) => {
        // Check if click is on close button area
        const clickX = e.clientX - xOffset;
        if (clickX > 340) { // If click is in the close button area
          return;
        }
        
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

      // Add event listeners
      dragHandle.addEventListener('mousedown', dragStart);
      document.addEventListener('mousemove', drag);
      document.addEventListener('mouseup', dragEnd);

      // Initial position
      updateDragHandle();
    }
  });
});

chrome.windows.onRemoved.addListener((removedWindowId) => {
  if (removedWindowId === windowId) {
    windowId = null;
  }
}); 