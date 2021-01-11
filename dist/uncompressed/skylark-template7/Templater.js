define([
  "skylark-langx/types",
  "skylark-langx/objects",
  "skylark-langx/Evented",
  "./templating",
  "./helpers/each",
  "./helpers/if",
  "./helpers/join",
  "./helpers/js",
  "./helpers/js_compare",
  "./helpers/partial",
  "./helpers/unless",
  "./helpers/with"
],function(
  types, 
  objects, 
  Evented, 
  templating,
  eachHelper, 
  ifHelper,
  joinHelper,
  jsHelper,
  jsCompareHelper,
  partialHelper,
  unlessHelper,
  withHelper){

  "use strict";

  var cache = {};
  function helperToSlices(string) {
    var helperParts = string.replace(/[{}#}]/g, '').split(' ');
    var slices = [];
    var shiftIndex, i, j;
    for (i = 0; i < helperParts.length; i++) {
      var part = helperParts[i];
      if (i === 0) slices.push(part);
      else {
        if (part.indexOf('"') === 0) {
          // Plain String
          if (part.match(/"/g).length === 2) {
            // One word string
            slices.push(part);
          }
          else {
            // Find closed Index
            shiftIndex = 0;
            for (j = i + 1; j < helperParts.length; j++) {
              part += ' ' + helperParts[j];
              if (helperParts[j].indexOf('"') >= 0) {
                shiftIndex = j;
                slices.push(part);
                break;
              }
            }
            if (shiftIndex) i = shiftIndex;
          }
        }
        else {
          if (part.indexOf('=') > 0) {
            // Hash
            var hashParts = part.split('=');
            var hashName = hashParts[0];
            var hashContent = hashParts[1];
            if (hashContent.match(/"/g).length !== 2) {
              shiftIndex = 0;
              for (j = i + 1; j < helperParts.length; j++) {
                hashContent += ' ' + helperParts[j];
                if (helperParts[j].indexOf('"') >= 0) {
                  shiftIndex = j;
                  break;
                }
              }
              if (shiftIndex) i = shiftIndex;
            }
            var hash = [hashName, hashContent.replace(/"/g,'')];
            slices.push(hash);
          }
          else {
            // Plain variable
            slices.push(part);
          }
        }
      }
    }
    return slices;
  }
  function stringToBlocks(string) {
    var blocks = [], i, j, k;
    if (!string) return [];
    var _blocks = string.split(/({{[^{^}]*}})/);
    for (i = 0; i < _blocks.length; i++) {
      var block = _blocks[i];
      if (block === '') continue;
      if (block.indexOf('{{') < 0) {
        blocks.push({
          type: 'plain',
          content: block
        });
      } else {
        if (block.indexOf('{/') >= 0) {
          continue;
        }
        if (block.indexOf('{#') < 0 && block.indexOf(' ') < 0 && block.indexOf('else') < 0) {
          // Simple variable
          blocks.push({
            type: 'variable',
            contextName: block.replace(/[{}]/g, '')
          });
          continue;
        }
        // Helpers
        var helperSlices = helperToSlices(block);
        var helperName = helperSlices[0];
        var isPartial = helperName === '>';
        var helperContext = [];
        var helperHash = {};
        for (j = 1; j < helperSlices.length; j++) {
          var slice = helperSlices[j];
          if (types.isArray(slice)) {
            // Hash
            helperHash[slice[0]] = slice[1] === 'false' ? false : slice[1];
          }
          else {
            helperContext.push(slice);
          }
        }

        if (block.indexOf('{#') >= 0) {
          // Condition/Helper
          var helperStartIndex = i;
          var helperContent = '';
          var elseContent = '';
          var toSkip = 0;
          var shiftIndex;
          var foundClosed = false, foundElse = false, foundClosedElse = false, depth = 0;
          for (j = i + 1; j < _blocks.length; j++) {
            if (_blocks[j].indexOf('{{#') >= 0) {
              depth ++;
            }
            if (_blocks[j].indexOf('{{/') >= 0) {
              depth --;
            }
            if (_blocks[j].indexOf('{{#' + helperName) >= 0) {
              helperContent += _blocks[j];
              if (foundElse) elseContent += _blocks[j];
              toSkip ++;
            }
            else if (_blocks[j].indexOf('{{/' + helperName) >= 0) {
              if (toSkip > 0) {
                toSkip--;
                helperContent += _blocks[j];
                if (foundElse) elseContent += _blocks[j];
              }
              else {
                shiftIndex = j;
                foundClosed = true;
                break;
              }
            }
            else if (_blocks[j].indexOf('else') >= 0 && depth === 0) {
              foundElse = true;
            }
            else {
              if (!foundElse) helperContent += _blocks[j];
              if (foundElse) elseContent += _blocks[j];
            }

          }
          if (foundClosed) {
            if (shiftIndex) i = shiftIndex;
            blocks.push({
              type: 'helper',
              helperName: helperName,
              contextName: helperContext,
              content: helperContent,
              inverseContent: elseContent,
              hash: helperHash
            });
          }
        } else if (block.indexOf(' ') > 0) {
          if (isPartial) {
            helperName = 'partial';
            if (helperContext[0]) {
              if (helperContext[0].indexOf('[') === 0) {
                helperContext[0] = helperContext[0].replace(/[[\]]/g, '');
              } else {
                helperContext[0] = helperContext[0].replace(/"|'/g, '');
              }
            }
          }

          blocks.push({
            type: 'helper',
            helperName: helperName,
            contextName: helperContext,
            hash: helperHash
          });
        }
      }
    }
    return blocks;
  }


  var Templater = Evented.inherit({
    klassName : "Templater",

    init : function(options,helpers) {
      this._options = options || {};
      this._helpers = objects.mixin({
        "each" : eachHelper,
        "if" : ifHelper,
        "join" : joinHelper,
        "js" : jsHelper,
        "js_compare" : jsCompareHelper,
        "partial" : partialHelper,
        "unless" : unlessHelper,
        "with" : withHelper,
      },helpers);

      this._partials = {};
      this._cache = {};

    },
    compile : function(template) {
      var templater = this;

      function getCompileFn(block, depth) {
        if (block.content) return compile(block.content, depth);
        else return function () {return ''; };
      }
      function getCompileInverse(block, depth) {
        if (block.inverseContent) return compile(block.inverseContent, depth);
        else return function () {return ''; };
      }
      function getCompileVar(name, ctx) {
        var variable, parts, levelsUp = 0, initialCtx = ctx;
        if (name.indexOf('../') === 0) {
          levelsUp = name.split('../').length - 1;
          var newDepth = ctx.split('_')[1] - levelsUp;
          ctx = 'ctx_' + (newDepth >= 1 ? newDepth : 1);
          parts = name.split('../')[levelsUp].split('.');
        }
        else if (name.indexOf('@global') === 0) {
          ctx = '$.Template7.global';
          parts = name.split('@global.')[1].split('.');
        }
        else if (name.indexOf('@root') === 0) {
          ctx = 'ctx_1';
          parts = name.split('@root.')[1].split('.');
        }
        else {
          parts = name.split('.');
        }
        variable = ctx;
        for (var i = 0; i < parts.length; i++) {
          var part = parts[i];
          if (part.indexOf('@') === 0) {
            if (i > 0) {
              variable += '[(data && data.' + part.replace('@', '') + ')]';
            }
            else {
              variable = '(data && data.' + name.replace('@', '') + ')';
            }
          }
          else {
            if (isFinite(part)) {
              variable += '[' + part + ']';
            }
            else {
              if (part.indexOf('this') === 0) {
                variable = part.replace('this', ctx);
              }
              else {
                variable += '.' + part;       
              }
            }
          }
        }

        return variable;
      }
      function getCompiledArguments(contextArray, ctx) {
        var arr = [];
        for (var i = 0; i < contextArray.length; i++) {
          if (contextArray[i].indexOf('"') === 0) arr.push(contextArray[i]);
          else {
            arr.push(getCompileVar(contextArray[i], ctx));
          }
        }
        return arr.join(', ');
      }
      function compile(template, depth) {
        depth = depth || 1;
        template = template || t.template;
        if (typeof template !== 'string') {
          throw new Error('Template7: Template must be a string');
        }
        var blocks = stringToBlocks(template);
        if (blocks.length === 0) {
          return function () { return ''; };
        }
        var ctx = 'ctx_' + depth;
        var resultString = '(function (' + ctx + ', data) {\n';
        if (depth === 1) {
          resultString += ctx + '.templater = this\n';
          resultString += 'function isArray(arr){return Object.prototype.toString.apply(arr) === \'[object Array]\';}\n';
          resultString += 'function isFunction(func){return (typeof func === \'function\');}\n';
          resultString += 'function c(val, ctx) {if (typeof val !== "undefined") {if (isFunction(val)) {return val.call(ctx);} else return val;} else return "";}\n';
        }
        resultString += 'var r = \'\';\n';
        var i, j, context;
        for (i = 0; i < blocks.length; i++) {
          var block = blocks[i];
          // Plain block
          if (block.type === 'plain') {
            resultString += 'r +=\'' + (block.content).replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/'/g, '\\' + '\'') + '\';';
            continue;
          }
          var variable, compiledArguments;
          // Variable block
          if (block.type === 'variable') {
            variable = getCompileVar(block.contextName, ctx);
            resultString += 'r += c(' + variable + ', ' + ctx + ');';
          }
          // Helpers block
          if (block.type === 'helper') {
            if (block.helperName in templater._helpers) {
              compiledArguments = getCompiledArguments(block.contextName, ctx);
              resultString += 'r += '+ ctx + '.templater._helpers.' + block.helperName + '.call(' + ctx + ', '  + (compiledArguments && (compiledArguments + ', ')) +'{hash:' + JSON.stringify(block.hash) + ', data: data || {}, fn: ' + getCompileFn(block, depth+1) + ', inverse: ' + getCompileInverse(block, depth+1) + ', root: ctx_1});';
            }
            else {
              if (block.contextName.length > 0) {
                throw new Error('Missing helper: "' + block.helperName + '"');
              } else {
                variable = getCompileVar(block.helperName, ctx);
                resultString += 'if (' + variable + ') {';
                resultString += 'if (isArray(' + variable + ')) {';
                resultString += 'r += '+ ctx + '.templater._helpers.each.call(' + ctx + ', '  + variable + ', {hash:' + JSON.stringify(block.hash) + ', data: data || {}, fn: ' + getCompileFn(block, depth+1) + ', inverse: ' + getCompileInverse(block, depth+1) + ', root: ctx_1});';
                resultString += '}else {';
                resultString += 'r += '+ ctx + '.templater._helpers.with.call(' + ctx + ', '  + variable + ', {hash:' + JSON.stringify(block.hash) + ', data: data || {}, fn: ' + getCompileFn(block, depth+1) + ', inverse: ' + getCompileInverse(block, depth+1) + ', root: ctx_1});';
                resultString += '}}';
              }
            }
          }
        }
        resultString += '\nreturn r;})';
        return eval.call(window, resultString);
      }

      var compiled = this._cache[template];
      if (!compiled) {
        var fn = compile(template);
        compiled = this._cache[template] = function(){
          return fn.apply(templater,arguments);
        };
      }
      return compiled;
    },

    render : function(template,data) {
      var compiled = this.compile(template);
      return compiled(data);
    },

    registerHelper : function (name, fn) {
      this._helpers[name] = fn;
    },
    
    unregisterHelper : function (name) {
      this._helpers[name] = undefined;  
      delete this._helpers[name];
    },

    registerPartial : function (name, template) {
      this._partials[name] = { 
        "template" : template 
      };
    },

    unregisterPartial : function (name) {
      if (this._partials[name]) {
        this._partials[name] = undefined;
        delete this._partials[name];
      }
    }


  });

  var defaultTemplater = Templater.defaultTemplater = new Templater();

  [
    "registerHelper",
    "registerPartial",
    "unregisterHelper",
    "unregisterPartial",
    "render",
    "compile"
  ].forEach(function(fn){
    templating[fn] = function() {
      return Templater.prototype[fn].apply(defaultTemplater,arguments);
    }
  });

  return templating.Templater = Templater;
});

