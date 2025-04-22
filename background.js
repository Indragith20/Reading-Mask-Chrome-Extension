// Background script to handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-mask") {
    // Query for the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      // First get current config
      chrome.storage.sync.get(['readingMaskConfig'], function(data) {
        let result = {
          maskState: false,
          height: 25,
          width: 100,
          alpha: 0.45
        };

        try {
          result = { ...result, ...JSON.parse(data.readingMaskConfig) };
        } catch (err) {
          console.error('Error parsing config:', err);
        }

        // Toggle the mask state
        result.maskState = result.maskState === 'true' ? 'false' : 'true';
        
        // Save the updated config
        chrome.storage.sync.set({ 
          readingMaskConfig: JSON.stringify(result) 
        }, function() {
          // Send message to content script to update the mask
          chrome.tabs.sendMessage(tabs[0].id, { 
            action: "CHANGE_STATE", 
            payload: { 
              height: result.height, 
              width: result.width, 
              alpha: result.alpha, 
              maskState: result.maskState 
            }
          });
        });
      });
    });
  }
});