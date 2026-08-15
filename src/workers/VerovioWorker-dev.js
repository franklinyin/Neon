/**
 * Compatibility worker for current Verovio WASM prebundle API.
 * Waits until cwrap('vrvToolkit_constructor') works, then constructs toolkit.
 */
importScripts('../assets/js/verovio-toolkit-wasm.js');

let toolkit;
const backlog = [];

function handleNeonEvent(evt) {
  const data = evt.data;
  const result = { id: data.id };

  switch (data.action) {
    case 'renderData':
      result.svg = toolkit.renderData(data.mei, {});
      break;
    case 'getElementAttr':
      result.attributes = toolkit.getElementAttr(data.elementId);
      break;
    case 'edit':
      result.result = toolkit.edit(data.editorAction);
      break;
    case 'getMEI':
      result.mei = toolkit.getMEI({
        pageNo: 0,
        scoreBased: true,
      });
      break;
    case 'editInfo':
      result.info = toolkit.editInfo();
      break;
    case 'renderToSVG':
      result.svg = toolkit.renderToSVG(1);
      break;
    default:
      break;
  }
  postMessage(result);
}

function toolkitReady() {
  try {
    if (!verovio || !verovio.module || typeof verovio.module.cwrap !== 'function') {
      return false;
    }
    verovio.module.cwrap('vrvToolkit_constructor', 'number', []);
    return true;
  } catch (e) {
    return false;
  }
}

function startToolkit() {
  toolkit = new verovio.toolkit();
  toolkit.setOptions({
    inputFrom: 'mei',
    footer: 'none',
    header: 'none',
    pageMarginLeft: 0,
    pageMarginTop: 0,
    font: 'Bravura',
    useFacsimile: false,
    svgAdditionalAttribute: ['syllable@precedes', 'syllable@follows'],
    svgCss:
      'g.nc, g.custos, g.clef, g.accid, g.divLine {stroke: currentColor; stroke-width: 30px;}',
  });
  console.log('Verovio toolkit: READY');
  onmessage = handleNeonEvent;
  for (const message of backlog) {
    handleNeonEvent(message);
  }
  postMessage('ready');
}

function waitForModule(attempt) {
  if (toolkitReady()) {
    startToolkit();
    return;
  }
  if (attempt > 200) {
    console.error('Verovio WASM module failed to initialize');
    return;
  }
  setTimeout(() => waitForModule(attempt + 1), 50);
}

onmessage = function tempHandler(evt) {
  backlog.push(evt);
};

waitForModule(0);
