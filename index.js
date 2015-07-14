#!/usr/bin/env node


var Hooker = require('./src/hooker');

var hooker = new Hooker(process.cwd(), process.execPath, process.argv[1]);
var argv = require('minimist')(process.argv.slice(2));

if (argv._.length > 0) {
  if (argv._[0] === 'install') {
    hooker.installHook(argv._[1]);
  }

  if (argv._[0] === 'exec') {
    var output = hooker.execHook(argv._[1]);

    if (output !== true) {
      process.stderr.write(' > ' + argv._[1] + ' failed with this output:\n\n');
      process.stderr.write(output.stderr);
      process.exit(output.status);
    }
  }
}
