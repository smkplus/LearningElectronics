const fs=require('fs');
const Blockly=require('blockly/core');
require('blockly/blocks');
const En = require('blockly/msg/en');
Blockly.setLocale(En);
global.window={Blockly};
global.document={createElement:()=>({}),head:{appendChild(){}}};
global.ArduinoLang=require('./arduino-lang.js');
let src=fs.readFileSync('arduino-blocks.js','utf8');
src=src.replace("const msg = (e instanceof UnsupportedError)","console.error('REALERR',e);const msg = (e instanceof UnsupportedError)");
eval(src + '\n;global.__AB=ArduinoBlocks;');
(async () => {
  await global.__AB.ensureReady();
  const ws = new Blockly.Workspace();
  const code = "int a = 2;\nvoid setup() {\n}\nvoid loop() {\n}\n";
  console.log(global.__AB.codeToWorkspace(code, ws, null));
  console.log('--- back to code ---');
  console.log(global.__AB.workspaceToCode(ws));
})();
