var fs = require('fs-extra');
var exec = require('sync-exec');

var Hooker = function(baseDir, hookerInstallPath, nodePath) {
  this.baseDir = baseDir;
  this.config = this.loadConfig();
  this.nodeInstallpath = nodePath;
  this.hookerPath = hookerInstallPath;
};


Hooker.prototype.installHook = function(hookType) {
  var hookTypepath = this.getHookTypePath(hookType);
  fs.ensureFileSync(hookTypepath);
  fs.chmodSync(hookTypepath, '777');
  var contents = fs.readFileSync(hookTypepath, {encoding: 'utf-8'});

  if (contents.length === 0) {
    fs.writeFileSync(hookTypepath, this.getHookTemplate(hookType, true));
  } else {
    contents += this.getHookTemplate(hookType);
    fs.writeFileSync(hookTypepath, contents);
  }
};


Hooker.prototype.removeHook  = function(hookType) {
  var template = this.getHookTemplate(hookType);
  var hookTypepath = this.getHookTypePath(hookType);

  var contents = fs.readFileSync(hookTypepath, {encoding: 'utf-8'});
  contents = contents.replace(template, '');
  fs.writeFileSync(hookTypepath, contents);
};


Hooker.prototype.execHook = function(hookType) {
  var currentWorkingDir = process.cwd();
  process.chdir(this.baseDir);

  for (var cmd in this.config[hookType]) {
    if (!this.config[hookType].hasOwnProperty(cmd)) {
      continue;
    }

    cmd = this.config[hookType][cmd];

    var result = exec(cmd);
    if (result.status !== 0) {
      return result;
    } else {
      console.log('res', result);
    }
  }

  process.chdir(currentWorkingDir);
  return true;
};


Hooker.prototype.loadConfig = function() {

  var file;

  try {
    file = fs.readJsonSync(this.baseDir + '/hooker.config.json', {encoding: 'utf-8'});
  } catch (err) {
    file = {};
    fs.writeJsonSync(this.baseDir + '/hooker.config.json', file);
  }

  return file;
};


Hooker.prototype.getHookDir = function() {
  return this.baseDir + '/.git/hooks';
};


Hooker.prototype.getHookTemplate = function(hookType, withShebang) {

  var template = '### HOOKERSTART ###\n' +
      'hookerjs exec ' + hookType + '\n' +
      '### HOOKEREND ###\n\n';
  if (withShebang) {
    template = '#!/bin/bash\n' + template;
  }

  return template;
};


Hooker.prototype.getHookTypePath = function(hookType) {
  return this.getHookDir() + '/' + hookType;
};

module.exports = Hooker;
