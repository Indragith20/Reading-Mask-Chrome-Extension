chrome.storage.sync.get(['readingMaskConfig'], function (data) {
  let unit = {
    heightPercentage: 25,
    widthPercentage: 100
  };
  let alpha = 0.45;
  let result = {
    maskState: false
  };

  try {
    result = { ...result, ...JSON.parse(data.readingMaskConfig) };
  } catch (err) {
    result = {
      ...result,
      height: unit.heightPercentage,
      width: unit.widthPercentage,
      alpha
    }
  }

  let maskBox = document.getElementById('maskState')
  maskBox.setAttribute('value', result.maskState);
  if (result.maskState === 'true') {
    maskBox.setAttribute('checked', result.maskState === 'true');
  } else {
    maskBox.removeAttribute('checked');
  }


  document.getElementById('customHeight').setAttribute('value', result.height);
  document.getElementById('customWidth').setAttribute('value', result.width);
  document.getElementById('opacity').setAttribute('value', (result.alpha) * 100);

});

document.getElementById('maskState').addEventListener('click', () => {
  let maskBox = document.getElementById('maskState')
  let currentValue = maskBox.value;
  if (currentValue === 'true') {
    maskBox.setAttribute('value', "false")
    maskBox.removeAttribute('checked');
  } else {
    maskBox.setAttribute('value', 'true');
    maskBox.setAttribute('checked', true);
  }
})


document.getElementById('updateState').addEventListener('click', function (e) {

  function updateValue(value) {
    if (!value) {
      return 0;
    }
    value = Number(value);
    if (value < 0) {
      value = 0;
    } else if (value > 100) {
      value = 100;
    }
    return value;
  }

  let height = updateValue(document.getElementById('customHeight').value);
  let width = updateValue(document.getElementById('customWidth').value);
  let alpha = updateValue(document.getElementById('opacity').value) / 100;
  let maskState = document.getElementById('maskState').value;

  let config = {
    height,
    width,
    alpha,
    maskState
  }
  chrome.storage.sync.set({ readingMaskConfig: JSON.stringify(config) }, function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "CHANGE_STATE", payload: { height, width, alpha, maskState } }, function (response) {
        // Check if we got a response from the content script
        if (chrome.runtime.lastError || !response) {
          // Content script didn't respond, need page reload
          if (confirm("Settings saved. Some changes require a page reload to take effect. Reload now?")) {
            chrome.tabs.reload(tabs[0].id);
          }
        } else {
          // Show a small notification that changes were applied
          let statusElement = document.createElement('div');
          statusElement.textContent = "Changes applied successfully!";
          statusElement.style.position = "fixed";
          statusElement.style.bottom = "10px";
          statusElement.style.left = "50%";
          statusElement.style.transform = "translateX(-50%)";
          statusElement.style.backgroundColor = "var(--accent-color)";
          statusElement.style.color = "white";
          statusElement.style.padding = "8px 16px";
          statusElement.style.borderRadius = "4px";
          statusElement.style.zIndex = "1000";
          document.body.appendChild(statusElement);

          // Close popup after a short delay
          setTimeout(() => {
            window.close();
          }, 1500);
        }
      });
    });
  });

})


