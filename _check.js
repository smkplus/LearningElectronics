const fs = require('fs'), vm = require('vm');
let bad = 0;
process.argv.slice(2).forEach(f => {
  try{ new vm.Script(fs.readFileSync(f, 'utf8'), {filename: f}); console.log('OK   ' + f); }
  catch(e){ bad++; console.log('FAIL ' + f + ' -> ' + e.message + ' @ ' + (e.stack.split('\n')[0])); }
});
process.exit(bad ? 1 : 0);
