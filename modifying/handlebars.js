define([
  './handlebars.runtime', 
  './handlebars/compiler/AST', 
  './handlebars/compiler/base', 
  './handlebars/compiler/compiler', 
  './handlebars/compiler/JavascriptCompiler', 
  './handlebars/compiler/Visitor'
], function (_runtime, _AST, _base, _compiler, _JavascriptCompiler, _Visitor) {
  'use strict';

  // istanbul ignore next

 // Compiler imports

  var _create = _runtime.create;
  function create() {
    var hb = _create();

    hb.compile = function (input, options) {
      return _compiler.compile(input, options, hb);
    };
    hb.precompile = function (input, options) {
      return _compiler.precompile(input, options, hb);
    };

    hb.AST = _AST;
    hb.Compiler = _compiler.Compiler;
    hb.JavaScriptCompiler = _JavaScriptCompiler;
    hb.Parser = _base.parser;
    hb.parse = _base.parse;

    return hb;
  }

  var inst = create();
  inst.create = create;

  inst.Visitor = _Visitor;

  inst = inst;

  module.exports = inst;
});