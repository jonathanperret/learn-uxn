
let resizeIframe = (el) => {
    el.style.height = el.contentWindow.document.getElementById('canvas').clientHeight + 25;
};

let gebi = (id) => {
    return document.getElementById(id)
};


let loadNav = () => {
  var hamburger = {
    navToggle: document.querySelector(".nav-toggle"),
    nav: document.querySelector("nav"),
    doToggle: function (e) {
      e.preventDefault();
      this.navToggle.classList.toggle("expanded");
      this.nav.classList.toggle("expanded");
    },
  };

  hamburger.navToggle.addEventListener("click", function (e) {
    hamburger.doToggle(e);
  });
};

/**
 * Loads the tal source using the ?rom= query param
 */
let loadTal = (someWindow, el) => {
    let urlParams = new URLSearchParams(someWindow.location.search);

    let rom = urlParams.get('rom');
    if (!rom || rom.length == 0) {
        rom = "piano";
    }

    let iframe = gebi('uxnemu-iframe');
    let contents = "\n" + someWindow.FS.readFile(`/roms/${rom}.tal`, {encoding: 'utf8'})

    commentRegex = /\((.+?)\)/gms
    parsed = contents.replace(commentRegex, '<span class="comment">($1)</span>');

    let labelRegex = /(@.+?)(\s)/g
    parsed = parsed.replace(labelRegex, '<span class="rune-label">$1</span>$2');

    let sublabelRegex = /(&.+?)(\s)/g
    parsed = parsed.replace(sublabelRegex, '<span class="rune-sublabel">$1</span>$2');

    let hexLiteral = /(#.+?)(\s)/g
    parsed = parsed.replace(hexLiteral, '<span class="rune-hexliteral">$1</span>$2');

    let makeOpCodeRegex = (ops) => {
        let regex = "("
        let temp = [];
        ops.forEach((x) => {
            temp.push(`${x}2kr`)
            temp.push(`${x}2r`)
            temp.push(`${x}2k`)
            temp.push(`${x}2`)
            temp.push(`${x}k`)
            temp.push(`${x}r`)
            temp.push(x)
        });
        regex  += temp.join("|")
        regex += ")"
        return new RegExp(regex, "g");
    }

    let stackOpCodes = [
        "BRK",
        "LIT",
        "POP",
        "DUP",
        "NIP",
        "SWP",
        "OVR",
        "ROT"
    ]
    parsed = parsed.replaceAll(makeOpCodeRegex(stackOpCodes), '<span class="stack-opcode" data-opcode="$1">$1</span>');

    let logicOpCodes = [
        "EQU",
        "NEQ",
        "GTH",
        "LTH",
        "JMP",
        "JCN",
        "JSR",
        "STH"
    ]
    parsed = parsed.replaceAll(makeOpCodeRegex(logicOpCodes), '<span class="logic-opcode" data-opcode="$1">$1</span>');

    let memoryOpCodes = [
        "LDZ",
        "STZ",
        "LDR",
        "STR",
        "LDA",
        "STA",
        "DEI",
        "DEO",
    ]

    parsed = parsed.replaceAll(makeOpCodeRegex(memoryOpCodes), '<span class="memory-opcode" data-opcode="$1">$1</span>');

    let arithmeticOpCodes = [
        "ADD",
        "SUB",
        "MUL",
        "DIV",
        "AND",
        "ORA",
        "EOR",
        "SFT",
    ]

    parsed = parsed.replaceAll(makeOpCodeRegex(arithmeticOpCodes), '<span class="arithmetic-opcode" data-opcode="$1">$1</span>');

    el.innerHTML = parsed;
}

let loadRomButtons = () => {
  document.querySelectorAll("button").forEach((button) =>
    button.addEventListener("click", (e) => {
      let rom = button.getAttribute("data-rom");
      loadRom(rom);
    })
  );
};


let initUxnEmu = (uxnemu) => {
    return uxnemu({
        noInitialRun: true,
        canvas: (function () {
            var canvas = document.getElementById("canvas");

            // As a default initial behavior, pop up an alert when webgl context is lost. To make your
            // application robust, you may want to override this behavior before shipping!
            // See http://www.khronos.org/registry/webgl/specs/latest/1.0/#5.15.2
            canvas.addEventListener(
              "webglcontextlost",
              function (e) {
                alert("WebGL context lost. You will need to reload the page.");
                e.preventDefault();
              },
              false
            );

            return canvas;
          })()

    }).then((Module) => {
        return Module
    })
}


let loadRom = (uxnWindow, rom) => {
  let original = uxnWindow.location.href.split("?")[0];
  let url = original + "?rom=" + rom;
  uxnWindow.location.replace(url);
}

let readFileEmu = (uxnWindow, path) => {
  let fs = uxnWindow.Module.FS;
  let contents = fs.readFile(path, { encoding: 'utf8' });
  return contents;
}

let writeFileEmu = (uxnWindow, path, data) => {
  let fs = uxnWindow.Module.FS;
  return fs.writeFile(path, data);
}

let readFileAsm = async (asm, path) => {
  return asm.FS.readFile(path, { encoding: 'utf8' });
}

let writeFileAsm = async (asm, path, data) => {
  return asm.FS.writeFile(path, data);
}

let assemble = async (asm, data) => {
    let written = await writeFileAsm(asm, "temp.tal", data)
    console.log(written);
    asm.callMain(["temp.tal", "output.rom"]);
    return readFileAsm(asm, "output.rom");
}

let assembleAndLoad = async (uxnWindow, asm, data) => {
    let rom = await assemble(asm, data);
    debugger;
    writeFileEmu(uxnWindow, "/roms/new.rom", rom);
    loadRom(uxnWindow, "new");
}


(async () => {

    loadNav();
    loadRomButtons();

    uxnIframe = gebi('uxnemu-iframe');

    uxnWindow = uxnIframe.contentWindow
    // uxnModule = uxnWindow.Module;
    // FS = uxnModule.FS;

    var talContents = gebi('tal-contents');

    // uxnasm is a global loaded from emscripten
    asm = await uxnasm({ noInitialRun: true });
        
    window.addEventListener('resize', () => { 
        resizeIframe(uxnemuIframe);
    });

})();