

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
      chrome.tabs.sendMessage(tabs[0].id, { action: "CHANGE_STATE", payload: { height, width, alpha, maskState } });
      window.close();
    });
  });

})


