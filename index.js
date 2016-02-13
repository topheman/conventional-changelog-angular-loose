'use strict';

module.exports = require('conventional-changelog-angular')
  .then(function(data) {
    data.parserOpts.headerPattern = /^(\w*)(?:\((.*)\))?\:? (.*)$/;
    return data;
  });
