require('assert');
var should = require('should');
var fs = require('fs');
var fse = require('fs-extra');

function dirExistsSync(d) {
  try {
    fs.statSync(d);
    return true;
  }
  catch (err) {
    return false;
  }
}

describe('hooker', function() {

  var Hooker = require('../src/hooker');
  var assetsRoot = __dirname + '/assets';
  var hooker;
  var workingDir = process.cwd();

  afterEach(function() {
    process.chdir(workingDir);
  });

  beforeEach(function() {
    hooker = new Hooker(assetsRoot);
  });

  describe('installHook()', function() {

    afterEach(function() {
      // re-write test file before each test
      fs.writeFileSync(
          assetsRoot + '/existing-hook/.git/hooks/pre-commit',
          '#!/bin/bash\n\n' +
          '// some other command\n'
      );
    });

    it('installs the hook command into the given hook', function() {
      hooker.installHook('pre-push');
      dirExistsSync(hooker.getHookDir() + '/pre-push').should.be.true();

      var file = fs.readFileSync(
          hooker.getHookDir() + '/pre-push',
          {encoding: 'utf-8'});

      file.length.should.be.greaterThan(0, 'hook file should have some content');

      file.should.match(/### HOOKERSTART ###/g);
      file.should.match(/hookerjs exec pre-push/g);
      file.should.match(/### HOOKEREND ###/g);
    });

    it('should append hooker if other commands exist', function() {
      hooker = new Hooker(assetsRoot + '/existing-hook');
      hooker.installHook('pre-commit');
      dirExistsSync(hooker.getHookDir() + '/pre-commit').should.be.true();

      var file = fs.readFileSync(
          hooker.getHookDir() + '/pre-commit',
          {encoding: 'utf-8'});

      file.length.should.be.greaterThan(0, 'hook file should have some content');

      file.should.match(/some other command/g, 'should contain its existing content');

      file.match(/#!/g).length.should.equal(1, 'should only be one shebang line');

      file.should.match(/### HOOKERSTART ###/g);
      file.should.match(/hookerjs exec pre-commit/g);
      file.should.match(/### HOOKEREND ###/g);
    });
  });

  describe('removeHook()', function() {

    beforeEach(function() {
      hooker = new Hooker(assetsRoot + '/existing-hook');
    });

    afterEach(function() {
      // re-write test file after each test
      fs.writeFileSync(
          assetsRoot + '/existing-hook/.git/hooks/commit-msg',
          hooker.getHookTemplate('commit-msg', true)
      );
    });

    it('removes the hook from the given hook file', function() {
      hooker.removeHook('commit-msg');

      var file = fs.readFileSync(
          hooker.getHookDir() + '/commit-msg',
          {encoding: 'utf-8'});

      file.should.match(/#!/g, 'only the shebang line should be left');
      file.should.not.match(/### HOOKERSTART ###/g);
      file.should.not.match(/hookerjs exec commit-msg/g);
      file.should.not.match(/### HOOKEREND ###/g);
    });
  });

  describe('execHook()', function() {
    it('will run a hook command', function() {
      var output = hooker.execHook('pre-commit');
      should.exist(output);
      output.should.be.true();
    });

    it('returns the exit code of the first failed command', function() {
      var output = hooker.execHook('commit-msg');
      should.exist(output);
      output.hasOwnProperty('status').should.be.true();
      output.hasOwnProperty('stderr').should.be.true();
      output.hasOwnProperty('stdout').should.be.true();

      output.status.should.equal(1);
    });

    it('returns the output of a failed command', function() {
      var output = hooker.execHook('pre-push');
      should.exist(output);
      output.hasOwnProperty('status').should.be.true();
      output.hasOwnProperty('stderr').should.be.true();
      output.hasOwnProperty('stdout').should.be.true();

      output.status.should.equal(1);
      output.stderr.should.equal('poop\n');

      console.log(output);
    });
  });

  describe('loadConfig()', function() {
    it('can load a default config file from path', function() {
      hooker = new Hooker(assetsRoot);
      var config = hooker.loadConfig();
      should.exist(config, 'config file should load');
      config.hasOwnProperty('pre-commit').should.be.true();
    });
  });

  describe('getHookDir()', function() {
    it('should return a path to the hooks directory', function() {
      var hookDir = hooker.getHookDir();
      hookDir.should.startWith(assetsRoot);
      hookDir.should.endWith('.git/hooks');
    });
  });

  describe('getHookTemplate()', function() {
    it('gets a hook template', function() {
      var template = hooker.getHookTemplate('pre-push');
      should.exist(template);
      template.length.should.be.greaterThan(0);
      template.should.match(/### HOOKERSTART ###/g);
      template.should.match(/hookerjs exec pre-push/g);
      template.should.match(/### HOOKEREND ###/g);
    });
  });

  describe('getHookTypePath', function() {
    it('gets the path ending in the hook type', function() {
      var path = hooker.getHookTypePath('pre-commit');
      path.should.endWith('pre-commit');
    });
  });

  afterEach(function() {
    fse.removeSync(assetsRoot + '/.git');
  });
});
