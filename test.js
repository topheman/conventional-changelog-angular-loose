'use strict';
var child = require('child_process');
var conventionalChangelogCore = require('conventional-changelog-core');
var preset = require('./');
var expect = require('chai').expect;
var gitDummyCommit = require('git-dummy-commit');
var shell = require('shelljs');
var through = require('through2');

// We run the same tests twice, the expect clauses are EXACTLY the same
// (and EXACTLY the same as the original conventional-changelog-angular)
// In the before hook, we set or not the colon ...

/**
 *
 * @param {String} mode
 *  `-loose`: will return ''
 *  ``: will return ':'
 * @returns {string}
 */
function colon(mode) {
  return mode === '' ? ':' : '';
}

['-loose', ''].forEach(function(mode) {
  describe('angular' + mode + ' preset', function() {
    before(function(done) {
      shell.config.silent = true;
      shell.rm('-rf', 'tmp');
      shell.mkdir('tmp');
      shell.cd('tmp');
      shell.mkdir('git-templates');
      shell.exec('git init --template=./git-templates');
      gitDummyCommit('chore' + colon(mode) + ' first commit');
      // fix this until https://github.com/arturadib/shelljs/issues/175 is solved
      child.exec('git commit -m"feat' + colon(mode) + ' amazing new module\n\nBREAKING CHANGE: Not backward compatible." --allow-empty', function() {
        gitDummyCommit(['fix(compile)' + colon(mode) + ' avoid a bug', 'BREAKING CHANGE: The Change is huge.']);
        gitDummyCommit('perf(ngOptions)' + colon(mode) + ' make it faster');
        gitDummyCommit('revert(ngOptions)' + colon(mode) + ' make it faster');
        gitDummyCommit('fix(*)' + colon(mode) + ' oops');

        done();
      });
    });

    it('should work if there is no semver tag', function(done) {
      conventionalChangelogCore({
        config: preset
      })
        .on('error', function(err) {
          done(err);
        })
        .pipe(through(function(chunk) {
          chunk = chunk.toString();

          expect(chunk).to.include('amazing new module');
          expect(chunk).to.include('avoid a bug');
          expect(chunk).to.include('make it faster');
          expect(chunk).to.include('Not backward compatible.');
          expect(chunk).to.include('compile: The Change is huge.');
          expect(chunk).to.include('Features');
          expect(chunk).to.include('Bug Fixes');
          expect(chunk).to.include('Performance Improvements');
          expect(chunk).to.include('Reverts');
          expect(chunk).to.include('BREAKING CHANGES');

          expect(chunk).to.not.include('first commit');
          expect(chunk).to.not.include('feat');
          expect(chunk).to.not.include('fix');
          expect(chunk).to.not.include('perf');
          expect(chunk).to.not.include('revert');
          expect(chunk).to.not.include('***:**');
          expect(chunk).to.not.include(': Not backward compatible.');

          done();
        }));
    });

    it('should not discard commit if there is BREAKING CHANGE', function(done) {
      gitDummyCommit(['docs(readme)' + colon(mode) + ' make it clear', 'BREAKING CHANGE: The Change is huge.']);
      gitDummyCommit(['style(whitespace)' + colon(mode) + ' make it easier to read', 'BREAKING CHANGE: The Change is huge.']);
      gitDummyCommit(['refactor(code)' + colon(mode) + ' change a lot of code', 'BREAKING CHANGE: The Change is huge.']);
      gitDummyCommit(['test(*)' + colon(mode) + ' more tests', 'BREAKING CHANGE: The Change is huge.']);
      gitDummyCommit(['chore(deps)' + colon(mode) + ' bump', 'BREAKING CHANGE: The Change is huge.']);

      conventionalChangelogCore({
        config: preset
      })
        .on('error', function(err) {
          done(err);
        })
        .pipe(through(function(chunk) {
          chunk = chunk.toString();

          expect(chunk).to.include('Documentation');
          expect(chunk).to.include('Styles');
          expect(chunk).to.include('Code Refactoring');
          expect(chunk).to.include('Tests');
          expect(chunk).to.include('Chores');

          done();
        }));
    });

    it('should work if there is a semver tag', function(done) {
      var i = 0;

      shell.exec('git tag v1.0.0');
      gitDummyCommit('feat' + colon(mode) + ' some more features');

      conventionalChangelogCore({
        config: preset,
        outputUnreleased: true
      })
        .on('error', function(err) {
          done(err);
        })
        .pipe(through(function(chunk, enc, cb) {
          chunk = chunk.toString();

          expect(chunk).to.include('some more features');
          expect(chunk).to.not.include('BREAKING');

          i++;
          cb();
        }, function() {
          expect(i).to.equal(1);
          done();
        }));
    });
  });
});
