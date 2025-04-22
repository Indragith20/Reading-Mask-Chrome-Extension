function inject(fn, document) {
  const script = document.createElement('script')
  script.text = `(${fn.toString()})();`
  document.documentElement.appendChild(script)
}


function getIframeWindow(iframe_object) {
  let doc;

  if (iframe_object.contentWindow) {
    return iframe_object.contentWindow;
  }

  if (iframe_object.window) {
    return iframe_object.window;
  }

  if (!doc && iframe_object.contentDocument) {
    doc = iframe_object.contentDocument;
  }

  if (!doc && iframe_object.document) {
    doc = iframe_object.document;
  }

  if (doc && doc.defaultView) {
    return doc.defaultView;
  }

  if (doc && doc.parentWindow) {
    return doc.parentWindow;
  }

  return undefined;
}


class ReadingMask {
  constructor() {
    this.unit = {
      heightPercentage: 25,
      widthPercentage: 100
    };

    this.alpha = 0.45;
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.canvasState = {
      height,
      width,
      rectangleWidth: (this.unit.widthPercentage * width) / 100,
      rectangleHeight: (this.unit.heightPercentage * height) / 100
    };

    this.lastMouseX = 0;
    this.lastMouseY = 0;

    this.isInitialized = false;

    this.addEventListeners = this.addEventListeners.bind(this);
    this.removeEventListeners = this.removeEventListeners.bind(this);
    this.getCanvas = this.getCanvas.bind(this);
    this.addCanvas = this.addCanvas.bind(this);
    this.removeCanvas = this.removeCanvas.bind(this);
    this.mouseMove = this.mouseMove.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onScroll = this.onScroll.bind(this);
    this.drawRectangle = this.drawRectangle.bind(this);
    this.updateCanvasState = this.updateCanvasState.bind(this);
    this.setMutationObserver = this.setMutationObserver.bind(this);
    this.addListenerToIframe = this.addListenerToIframe.bind(this);
    this.setListenerToIframe = this.setListenerToIframe.bind(this);
    this.removeListenerToIframe = this.removeListenerToIframe.bind(this);
    this.iframeMouseMoveListener = this.iframeMouseMoveListener.bind(this);
    this.getIframes = this.getIframes.bind(this);
  }

  addEventListeners() {
    let canvas = this.getCanvas();;
    this.canvasContext = canvas.getContext('2d');
    document.addEventListener('mousemove', this.mouseMove);
    window.addEventListener('resize', this.onResize);
    window.addEventListener('scroll', this.onScroll);
    this.setListenerToIframe();
    this.setMutationObserver();
  }

  setListenerToIframe() {
    let iframeList = this.getIframes();
    if (iframeList.length > 0) {
      for (let iframe of iframeList) {
        let iframeWindow = getIframeWindow(iframe);
        this.addListenerToIframe(iframeWindow, window);
      }
    }
  }

  removeListenerToIframe() {
    let iframeList = this.getIframes();
    if (iframeList.length > 0) {
      for (let iframe of iframeList) {
        let iframeWindow = getIframeWindow(iframe);
        this.removeEventListenerToIframe(iframeWindow, window);
      }
    }
  }

  getIframes() {
    let iframeList = document.getElementsByTagName('iframe');
    return iframeList;
  }

  setMutationObserver() {
    let main = this;
    this.mutationObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(function (node) {
            if (node.nodeName === 'IFRAME') {
              let iframeWindow = getIframeWindow(node);
              main.addListenerToIframe(iframeWindow, window);
            }
          })
        }
      })
    });
    this.mutationObserver.observe(document.body, { childList: true, subtree: true });
  }

  removeMutationObserver() {
    this.mutationObserver.disconnect();
  }

  removeEventListeners() {
    document.removeEventListener('mousemove', this.mouseMove);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('scroll', this.onScroll);
    this.removeMutationObserver();
    this.removeListenerToIframe();
  }

  iframeMouseMoveListener(e) {
    let diffX = window.innerWidth - e.view.innerWidth;
    let diffY = window.innerHeight - e.view.innerHeight;
    this.drawRectangle(e.x + diffX, e.y + diffY);
  }

  addListenerToIframe(iframeWindow, window) {
    try {
      iframeWindow.addEventListener('mousemove', this.iframeMouseMoveListener)
    } catch (err) {
      console.log(err);
    }
  }


  removeEventListenerToIframe(iframeWindow, window) {
    try {
      iframeWindow.removeEventListener('mousemove', this.iframeMouseMoveListener)
    } catch (err) {
      console.log(err);
    }
  }


  getCanvas() {
    return document.getElementById('readingMaskCanvas');
  }


  addCanvas() {
    let canvas = document.createElement('canvas');
    canvas.setAttribute('width', this.canvasState.width);
    canvas.setAttribute('height', this.canvasState.height);
    canvas.setAttribute('id', 'readingMaskCanvas');
    canvas.style.zIndex = 10000;
    canvas.style.position = 'absolute';
    canvas.style.top = window.scrollY + 'px';
    canvas.style.left = window.scrollX + 'px';
    canvas.style.pointerEvents = 'none';
    document.body.appendChild(canvas);
    this.isInitialized = true;
  }

  removeCanvas() {
    let canvas = document.getElementById('readingMaskCanvas');
    if (canvas) {
      this.isInitialized = false;
      canvas.remove();
      this.removeEventListeners();
    }
  }

  drawRectangle(currentX, currentY) {
    const { rectangleWidth, rectangleHeight, width, height } = this.canvasState;
    let mouseX = currentX;
    let mouseY = currentY;
    this.lastMouseX = mouseX;
    this.lastMouseY = mouseY;
    if (this.canvasContext) {
      this.canvasContext.clearRect(0, 0, width, height);
      // alpha change place
      this.canvasContext.globalAlpha = this.alpha;
      this.canvasContext.globalCompositeOperation = 'xor';
      this.canvasContext.fillStyle = '#000';
      this.canvasContext.fillRect(0, 0, width, height);

      const centerX = rectangleWidth / 2;
      const centerY = rectangleHeight / 2;

      // For restricting borders we assign x and y min as 0 amd max as rectangle width and height
      const calculatedX = mouseX - centerX;
      const calculatedY = mouseY - centerY;

      let x = Math.max(calculatedX, 0);
      let y = Math.max(calculatedY, 0);

      const calculatedWidthX = x + rectangleWidth;
      const calculatedWidthY = y + rectangleHeight;

      const diffX = width - calculatedWidthX;
      const diffY = height - calculatedWidthY;

      if (diffX < 0) {
        x += diffX;
      }

      if (diffY < 0) {
        y += diffY;
      }

      this.canvasContext.clearRect(x, y, rectangleWidth, rectangleHeight);
    }
  }


  mouseMove(e) {
    this.drawRectangle(e.x, e.y);
  }

  onScroll(e) {
    requestAnimationFrame(() => {
      let canvas = this.getCanvas();
      canvas.style.top = window.scrollY + 'px';
      canvas.style.left = window.scrollX + 'px';
      this.drawRectangle(this.lastMouseX, this.lastMouseY);
    })
  }

  updateCanvasState() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    if (!this.lastMouseX || !this.lastMouseY) {
      // Setting Initial mouse position as center for initial draw
      this.lastMouseX = width / 2;
      this.lastMouseY = height / 2;
    }
    this.canvasState = {
      ...this.canvasState,
      height,
      width,
      rectangleWidth: (this.unit.widthPercentage * width) / 100,
      rectangleHeight: (this.unit.heightPercentage * height) / 100
    };
    let canvas = this.getCanvas();
    canvas.setAttribute('width', this.canvasState.width);
    canvas.setAttribute('height', this.canvasState.height);
    canvas.style.top = window.scrollY + 'px';
    canvas.style.left = window.scrollX + 'px';
    this.drawRectangle(this.lastMouseX, this.lastMouseY);
  }

  onResize() {
    this.updateCanvasState();
  }

  initialize() {
    this.addCanvas();
    this.addEventListeners();
  }

  canvasOffsetChange(width, height, alpha) {
    this.alpha = alpha;
    this.unit = {
      ...this.unit,
      heightPercentage: height,
      widthPercentage: width
    };
    this.updateCanvasState();
  }
}


const readingMask = new ReadingMask();

window.addEventListener('load', () => {

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
        height: unit.heightPercentage,
        width: unit.widthPercentage,
        alpha
      }
    }

    if (result.maskState === 'true') {
      readingMask.initialize();
      readingMask.canvasOffsetChange(result.width, result.height, result.alpha);
    } else {
      readingMask.removeCanvas();
    }


  });

})


// let iframeList = document.getElementsByTagName('iframe');







chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  console.log("Message Received", message)
  if (message.action === 'INITIALIZE') {
    // let { height, width, alpha } = message.payload;
    // readingMask.canvasOffsetChange(width, height, alpha);
    sendResponse({ success: true });
  } else if (message.action === 'CHANGE_STATE') {
    let { height, width, alpha, maskState } = message.payload;
    if (maskState === 'true') {
      if (!readingMask.isInitialized) {
        readingMask.initialize();
      }
      readingMask.canvasOffsetChange(width, height, alpha);
    } else {
      readingMask.removeCanvas();
    }
    // Send response to let popup know changes were applied
    sendResponse({ success: true });
  } else if (message.action === 'CALCULATE_DIFF') {
    const result = affectedEle.calculateDiff();
    console.log(result);
    sendResponse({ success: true });
  } else if (message.action === 'RESET_STYLES') {
    affectedEle.resetStyles();
    sendResponse({ success: true });
  }

  // Return true to indicate we'll send a response asynchronously
  return true;
});

