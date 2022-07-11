

function inject(fn, document) {
  const script = document.createElement('script')
  script.text = `(${fn.toString()})();`
  document.documentElement.appendChild(script)
}


function addListenerToIframe(iframeWindow, window) {
  console.log("Adding Listener to Iframe", iframeWindow.body);
  try {
    iframeWindow.addEventListener('mousemove', (e) => {
      console.log("Mouse ove called");
      let diffX = window.innerWidth - iframeWindow.innerWidth;
      let diffY = window.innerHeight - iframeWindow.innerHeight;
      readingMask.drawRectangle(e.x + diffX, e.y + diffY);
    })
  } catch (err) {
    console.log(err);
  }
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

    this.addEventListeners = this.addEventListeners.bind(this);
    this.getCanvas = this.getCanvas.bind(this);
    this.addCanvas = this.addCanvas.bind(this);
    this.mouseMove = this.mouseMove.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onScroll = this.onScroll.bind(this);
    this.drawRectangle = this.drawRectangle.bind(this);
    this.updateCanvasState = this.updateCanvasState.bind(this);

  }

  addEventListeners() {
    let canvas = this.getCanvas();;
    this.canvasContext = canvas.getContext('2d');
    document.addEventListener('mousemove', this.mouseMove);
    window.addEventListener('resize', this.onResize);
    window.addEventListener('scroll', this.onScroll);
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
    console.log("Changing canvas state", width, height, alpha);
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
  readingMask.initialize();

  chrome.storage.sync.get(['readingMaskConfig'], function (data) {
    let unit = {
      heightPercentage: 25,
      widthPercentage: 100
    };
    let alpha = 0.45;
    let result;

    try {
      result = JSON.parse(data.readingMaskConfig);
    } catch (err) {
      result = {
        height: unit.heightPercentage,
        width: unit.widthPercentage,
        alpha
      }
    }

    readingMask.canvasOffsetChange(result.width, result.height, result.alpha);
  });

})


let iframeList = document.getElementsByTagName('iframe');

if (iframeList.length > 0) {
  for (let iframe of iframeList) {
    let iframeWindow = getIframeWindow(iframe);
    addListenerToIframe(iframeWindow, window);
  }
}




var mutationObserver = new MutationObserver(function (mutations) {
  mutations.forEach(mutation => {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach(node => {
        if (node.nodeName === 'IFRAME') {
          console.log("New Iframe has been added");
          let iframeWindow = getIframeWindow(node);
          addListenerToIframe(iframeWindow, window);
        }
      })
    }
  })
});
mutationObserver.observe(document.body, { childList: true, subtree: true });


chrome.runtime.onMessage.addListener(function (message) {
  console.log("Message Received", message)
  if (message.action === 'INITIALIZE') {
    // let { height, width, alpha } = message.payload;
    // readingMask.canvasOffsetChange(width, height, alpha);
  } else if (message.action === 'CHANGE_STATE') {
    let { height, width, alpha } = message.payload;
    readingMask.canvasOffsetChange(width, height, alpha);
  } else if (message.action === 'CALCULATE_DIFF') {
    const result = affectedEle.calculateDiff();
    console.log(result);
  } else if (message.action === 'RESET_STYLES') {
    affectedEle.resetStyles();
  }
});

