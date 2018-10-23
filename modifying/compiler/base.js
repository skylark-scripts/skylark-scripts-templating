define([
  "../templater",
  './parser', 
  './WhitespaceControl', 
  './helpers', 
'../utils'
], function (templater,_parser, _WhitespaceControl, _helpers, _utils) {
  'use strict';

  var exports = {};

  exports.parse = parse;
  // istanbul ignore next

  exports.parser = _parser;

  var yy = {};

  _utils.extend(yy, _helpers);

  function parse(input, options) {
    // Just return if an already-compiled AST was passed in.
    if (input.type === 'Program') {
      return input;
    }

    _parser.yy = yy;

    // Altering the shared object here, but this is ok as parser is a sync operation
    yy.locInfo = function (locInfo) {
      return new yy.SourceLocation(options && options.srcName, locInfo);
    };

    var strip = new _WhitespaceControl(options);
    return strip.accept(_parser2.parse(input));
  }

  return exports;
});