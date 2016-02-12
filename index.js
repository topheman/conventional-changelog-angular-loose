'use strict';

var Q = require('q');

var config = require('conventional-changelog-angular')
  .then(function(data) {
    data.parserOpts.headerPattern = /^(\w*)(?:\((.*)\))?\:? (.*)$/;
    return data;
  });

module.exports = Q.resolve(config);
