////////////
// EXTERN //
////////////

// eslint-disable-next-line
var CodeMirror;

// eslint-disable-next-line
var uxnasm;

////////
// IO //
////////

const dateFmt = () => {
  function toString(number, padLength) {
    return number.toString().padStart(padLength, '0');
  }

  const date = new Date();

  const fmt = `${toString(date.getHours(), 2)}:${toString(
    date.getMinutes(),
    2,
  )}:${toString(date.getSeconds(), 2)}.${toString(date.getMilliseconds(), 3)}`;
  return fmt;
};

const colorWrap = (text, color) => `<span style="color: var(--color-${color})">${text}</span>`;
const errWrap = (text) => colorWrap(text, 'red');
const successWrap = (text) => colorWrap(text, 'green');
const cleanupWrap = (text) => colorWrap(text, 'orange');

const log = (text, module) => {
  module = module || 'web';
  const prefixColorByLocation = {
    emu: 'blue',
    asm: 'purple',
    web: 'yellow',
  };
  const prefixColor = prefixColorByLocation[module];
  const prefix = colorWrap(`[${module}]`, prefixColor);

  // check for error messages that we want to suppress
  const lower = text.toLowerCase();
  const doSupress = ['sigaction: signal type not supported: this is a no-op.'];
  if (doSupress.some((x) => lower.includes(x))) {
    return;
  }

  // check for common error words if uxn tools don't use exit status code
  const hasBadLookingMessage = [
    'usage',
    'failed to open source',
    'failed to assemble rom',
    // macros
    'macro duplicate',
    'macro name is hex number',
    'macro name is invalid',
    'macro too large',
    'word too long',
    // labels
    'label duplicate',
    'label name is hex number',
    'label name is invalid',
    // token
    'address is not in zero page',
    'address is too far',
    'invalid hexadecimal literal',
    'invalid hexadecimal value',
    'invalid macro',
    'invalid token',
    // pass 1
    'invalid padding',
    // 'invalid macro',
    'invalid label',
    'invalid sublabel',
    // pass 2
    'memory overwrite',
    'unknown label',

    // emu
    'init failure',
    'sdl_',
    'failed to start uxn',
    'failed to open rom',
    'failed to initialize emulator',
  ].some((x) => lower.includes(x));

  const hasCleanupLookingMessage = ['--- unused'].some((x) => lower.includes(x));
  const hasGoodLookingMessage = ['assembled', 'loaded'].some((x) => lower.includes(x));

  if (hasGoodLookingMessage) {
    text = successWrap(text);
  } else if (hasBadLookingMessage) {
    text = errWrap(text);
  } else if (hasCleanupLookingMessage) {
    text = cleanupWrap(text);
  }

  const el = document.getElementById('console');

  el.innerHTML += `${prefix} ${dateFmt()} ${text}\n`;
};

const errFmt = (e) => {
  const err = `${e.message || '(no msg)'} : ${e.code || '(no code)'} ${
    e.errno || '(no errno)'
  }`;
  return errWrap(err);
};

const readFile = (w, path, encoding) => {
  const fs = w.Module.FS;
  try {
    const contents = fs.readFile(path, { encoding });
    return contents;
  } catch (e) {
    log(errFmt(e));
    throw e;
  }
};

const writeFile = (w, path, data) => {
  try {
    const fs = w.Module.FS;
    return fs.writeFile(path, data);
  } catch (e) {
    log(errFmt(e));
    throw e;
  }
};

///////////////
// ASSEMBLER //
///////////////

const readFileAsm = (path, encoding) => {
  log(`Reading path from assembler: ${path}`);
  return readFile(window.asm, path, encoding);
};

const writeFileAsm = (path, data) => {
  log(`Writing to path from assembler: ${path}`);
  return writeFile(window.asm, path, data);
};

const assemble = (data) => {
  log('Assembling...');
  writeFileAsm('temp.tal', data);

  window.asm.callMain(['temp.tal', 'output.rom']);
  const b64 = btoa(readFileAsm('output.rom', 'binary'));

  // reload to clear global state
  log('Reloading assembler...');
  window.asm.location.reload();
  return b64;
};

const assembleEditor = () => {
  const { children, texts } = window.editor.state.doc;
  if (!children && !texts) {
    log(errWrap('No uxntal to assemble!'));
    return;
  }
  const chunks = children ? children.map((x) => x.text) : texts;
  const lines = chunks.map((x) => x.join('\n'));
  const text = lines.join('\n');
  assemble(text);
};

/////////
// URL //
/////////

//eslint-disable-next-line
const setURLParam = (param, value) => {
  // Construct URLSearchParams object instance from current URL querystring.
  const queryParams = new URLSearchParams(window.location.search);

  // Set new or modify existing parameter value.
  queryParams.set(param, value);

  // Replace current querystring with the new one.
  //eslint-disable-next-line
  history.replaceState(null, null, `?${queryParams.toString()}`);
};

const getURLParam = (param) => {
  const queryParams = new URLSearchParams(window.location.search);
  return queryParams.get(param);
};

//////////////
// EMULATOR //
//////////////

const loadRom = (rom) => {
  log('Loading rom...');
  // force reload to get a clean slate
  // otherwise SDL has all these issues
  // with teardown
  window.uxn.location.reload();

  // grab the iframe again to get a new reference to the window
  // stash the rom we have here in the window so it can load it
  // after it is done initializing
  const iframe = document.getElementById('uxnemu-iframe');
  iframe.onload = (e) => {
    e.target.contentWindow.rom = rom;
  };
};

////////////
// EDITOR //
////////////

const populateEditor = (insert) => {
  window.editor.dispatch({
    changes: { from: 0, insert },
  });
};

//////////////
// WORKFLOW //
//////////////

/**
 * assemble takes utf8 and produces a binary rom encoded in b64
 */

const load = (tal) => {
  populateEditor(tal);
  const rom = assemble(tal);
  loadRom(rom);
};

// eslint-disable-next-line
const loadRomByName = (romName) => {
  const tal = readFileAsm(`/tals/${romName}.tal`, 'utf8');
  load(tal);
};

// eslint-disable-next-line
const reload = () => {
  window.uxn.location.reload();
};

const addListeners = () => {
  document.getElementById('assemble').addEventListener('click', () => {
    assembleEditor();
  });

  document.getElementById('save').addEventListener('click', () => {
    log('todo');
  });

  window.document.addEventListener(
    'uxn',
    (e) => {
      const { module, message } = e.detail;
      // normally we'd try to use the err verus normal stream
      // but uxn tools seem to write info to stderr

      // it seems uxn tools don't actually set exitstatus
      // but in case they do later...
      // let success = e.detail.exit === 0

      log(message, module);
    },
    false,
  );
};

//////////////
// DOM UTIL //
//////////////

const resize = (el) => {
  // get the emulator height
  const height = el.contentWindow.document.getElementById('canvas').clientHeight;
  const newHeight = height + 25;
  el.style.height = `${newHeight}px`;
};

const hideNoScript = () => {
  document.getElementById('noscript').innerHTML = '';
};

//////////
// MAIN //
//////////

(async () => {
  hideNoScript();

  const uxnIframe = document.getElementById('uxnemu-iframe');
  window.uxn = uxnIframe.contentWindow;

  const asmIframe = document.getElementById('uxnasm-iframe');
  window.asm = asmIframe.contentWindow;

  addListeners();

  // on the iframe load
  window.onload = () => {
    // check the flat promise
    Promise.all([window.uxn.allReady, window.asm.allReady]).then(() => {
      resize(uxnIframe);

      const rom = getURLParam('rom') || 'piano';
      loadRomByName(rom);
    });
    resize(uxnIframe);
  };

  window.addEventListener('resize', () => {
    resize(uxnIframe);
  });
})();
