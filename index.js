#!/usr/bin/env node


var Hooker = require('./src/hooker');

var hooker = new Hooker(process.cwd());
var argv = require('minimist')(process.argv.slice(2));


console.log(argv);

if (argv._.length > 0) {
  if (argv._[0] === 'install') {
    hooker.installHook(argv._[1]);
  }

  if (argv._[0] === 'exec') {
    var output = hooker.execHook(argv._[1]);

    if (output !== true) {
      process.stderr.write(output.stderr);
      process.exit(output.status);
    }
  }
}
