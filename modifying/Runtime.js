define([
  "skylark-langx/types",
  "skylark-langx/objects",
  "skylark-langx/Evented",
  "../templater",
  './utils', 
  './Exception', 
  './helpers', 
  './decorators', 
  './logger',
  './complier/complier',
  './complier/parser',
  './complier/helpers',
  './complier/WhitespaceControl', 
  './complier/JavaScriptCompiler'

], function (types, objects, Evented, templater, _utils, _Exception, _helpers, _decorators, _logger, _complier, _parser, _helpers, _WhitespaceControl,_JavaScriptCompiler) {
  'use strict';

  function wrapProgram(container, i, fn, data, declaredBlockParams, blockParams, depths) {
    function prog(context) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var currentDepths = depths;
      if (depths && context !== depths[0]) {
        currentDepths = [context].concat(depths);
      }

      return fn(container, context, container.helpers, container.partials, options.data || data, blockParams && [options.blockParams].concat(blockParams), currentDepths);
    }

    prog = executeDecorators(fn, prog, container, depths, data, blockParams);

    prog.program = i;
    prog.depth = depths ? depths.length : 0;
    prog.blockParams = declaredBlockParams || 0;
    return prog;
  }

  function resolvePartial(partial, context, options) {
    if (!partial) {
      if (options.name === '@partial-block') {
        partial = options.data['partial-block'];
      } else {
        partial = options.partials[options.name];
      }
    } else if (!partial.call && !options.name) {
      // This is a dynamic partial that returned a string
      options.name = partial;
      partial = options.partials[partial];
    }
    return partial;
  }

  function invokePartial(partial, context, options) {
    options.partial = true;
    if (options.ids) {
      options.data.contextPath = options.ids[0] || options.data.contextPath;
    }

    var partialBlock = undefined;
    if (options.fn && options.fn !== noop) {
      partialBlock = options.data['partial-block'] = options.fn;

      if (partialBlock.partials) {
        options.partials = objects.mixin({}, options.partials, partialBlock.partials);
      }
    }

    if (partial === undefined && partialBlock) {
      partial = partialBlock;
    }

    if (partial === undefined) {
      throw new _Exception('The partial ' + options.name + ' could not be found');
    } else if (partial instanceof Function) {
      return partial(context, options);
    }
  }

  function initData(context, data) {
    if (!data || !('root' in data)) {
      data = data ? _utils.createFrame(data) : {};
      data.root = context;
    }
    return data;
  }

  function executeDecorators(fn, prog, container, depths, data, blockParams) {
    if (fn.decorator) {
      var props = {};
      prog = fn.decorator(prog, props, container, depths && depths[0], data, blockParams, depths);
      objects.mixin(prog, props);
    }
    return prog;
  }


  function template(env,templateSpec) {
      if (!templateSpec || !templateSpec.main) {
        throw new _Exception('Unknown template object: ' + typeof templateSpec);
      }

      templateSpec.main.decorator = templateSpec.main_d;

      function invokePartialWrapper(partial, context, options) {
        if (options.hash) {
          context = _utils.extend({}, context, options.hash);
          if (options.ids) {
            options.ids[0] = true;
          }
        }

        partial = env.VM.resolvePartial.call(this, partial, context, options);
        var result = env.VM.invokePartial.call(this, partial, context, options);

        if (result == null && env.compile) {
          options.partials[options.name] = env.compile(partial, templateSpec.compilerOptions, env);
          result = options.partials[options.name](context, options);
        }
        if (result != null) {
          if (options.indent) {
            var lines = result.split('\n');
            for (var i = 0, l = lines.length; i < l; i++) {
              if (!lines[i] && i + 1 === l) {
                break;
              }

              lines[i] = options.indent + lines[i];
            }
            result = lines.join('\n');
          }
          return result;
        } else {
          throw new _Exception('The partial ' + options.name + ' could not be compiled when running in runtime-only mode');
        }
      }

      // Just add water
      var container = {
        strict: function strict(obj, name) {
          if (!(name in obj)) {
            throw new _Exception('"' + name + '" not defined in ' + obj);
          }
          return obj[name];
        },
        lookup: function lookup(depths, name) {
          var len = depths.length;
          for (var i = 0; i < len; i++) {
            if (depths[i] && depths[i][name] != null) {
              return depths[i][name];
            }
          }
        },
        lambda: function lambda(current, context) {
          return typeof current === 'function' ? current.call(context) : current;
        },

        escapeExpression: _utils.escapeExpression,
        invokePartial: invokePartialWrapper,

        fn: function fn(i) {
          var ret = templateSpec[i];
          ret.decorator = templateSpec[i + '_d'];
          return ret;
        },

        programs: [],
        program: function program(i, data, declaredBlockParams, blockParams, depths) {
          var programWrapper = this.programs[i],
              fn = this.fn(i);
          if (data || depths || blockParams || declaredBlockParams) {
            programWrapper = wrapProgram(this, i, fn, data, declaredBlockParams, blockParams, depths);
          } else if (!programWrapper) {
            programWrapper = this.programs[i] = wrapProgram(this, i, fn);
          }
          return programWrapper;
        },

        data: function data(value, depth) {
          while (value && depth--) {
            value = value._parent;
          }
          return value;
        },
        merge: function merge(param, common) {
          var obj = param || common;

          if (param && common && param !== common) {
            obj = _utils.extend({}, common, param);
          }

          return obj;
        },

        noop: env.VM.noop,
        compilerInfo: templateSpec.compiler
      };

      function ret(context) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        var data = options.data;

        ret._setup(options);
        if (!options.partial && templateSpec.useData) {
          data = initData(context, data);
        }
        var depths = undefined,
            blockParams = templateSpec.useBlockParams ? [] : undefined;
        if (templateSpec.useDepths) {
          if (options.depths) {
            depths = context !== options.depths[0] ? [context].concat(options.depths) : options.depths;
          } else {
            depths = [context];
          }
        }

        function main(context /*, options*/) {
          return '' + templateSpec.main(container, context, container.helpers, container.partials, data, blockParams, depths);
        }
        main = executeDecorators(templateSpec.main, main, container, options.depths || [], data, blockParams);
        return main(context, options);
      }
      ret.isTop = true;

      ret._setup = function (options) {
        if (!options.partial) {
          container.helpers = container.merge(options.helpers, env.helpers);

          if (templateSpec.usePartial) {
            container.partials = container.merge(options.partials, env.partials);
          }
          if (templateSpec.useDecorators) {
            container.decorators = container.merge(options.decorators, env.decorators);
          }
        } else {
          container.helpers = options.helpers;
          container.partials = options.partials;
          container.decorators = options.decorators;
        }
      };

      ret._child = function (i, data, blockParams, depths) {
        if (templateSpec.useBlockParams && !blockParams) {
          throw new _Exception('must pass block params');
        }
        if (templateSpec.useDepths && !depths) {
          throw new _Exception('must pass parent depths');
        }

        return wrapProgram(container, i, templateSpec[i], data, 0, blockParams, depths);
      };
      return ret;
  }


  var Runtime =  Evented.inherit({
    "init" : function (helpers, partials, decorators) {
      this.helpers = helpers || {};
      this.partials = partials || {};
      this.decorators = decorators || {};

      _helpers.registerDefaultHelpers(this);
      _decorators.registerDefaultDecorators(this);
    },

    registerHelper: function (name, fn) {
      if (types.isObject(name)) {
        if (fn) {
          throw new _Exception('Arg not supported with multiple helpers');
        }
        objects.mixin(this.helpers, name);
      } else {
        this.helpers[name] = fn;
      }
    },

    unregisterHelper: function (name) {
      delete this.helpers[name];
    },

    registerPartial: function (name, partial) {
      if (types.isObject(name)) {
        objects.mixin(this.partials, name);
      } else {
        if (typeof partial === 'undefined') {
          throw new _Exception('Attempting to register a partial as undefined');
        }
        this.partials[name] = partial;
      }
    },

    unregisterPartial: function (name) {
      delete this.partials[name];
    },

    registerDecorator: function (name, fn) {
      if (types.isObject(name)) {
        if (fn) {
          throw new _Exception('Arg not supported with multiple decorators');
        }
        objects.mixin(this.decorators, name);
      } else {
        this.decorators[name] = fn;
      }
    },

    unregisterDecorator: function (name) {
      delete this.decorators[name];
    },

    template : function(templateSpec) {
      return template(this,templateSpec);
    },

    precompile : function (input, options, env) {
      if (input == null || typeof input !== 'string' && input.type !== 'Program') {
        throw new _Exception('You must pass a string or Handlebars AST to Handlebars.precompile. You passed ' + input);
      }

      options = options || {};
      if (!('data' in options)) {
        options.data = true;
      }
      if (options.compat) {
        options.useDepths = true;
      }

      var ast = env.parse(input, options),
          environment = new env.Compiler().compile(ast, options);
      return new env.JavaScriptCompiler().compile(environment, options);
    },

    compile : function (input, options, env) {
      if (options === undefined) options = {};

      if (input == null || typeof input !== 'string' && input.type !== 'Program') {
        throw new _Exception('You must pass a string or Handlebars AST to Handlebars.compile. You passed ' + input);
      }

      if (!('data' in options)) {
        options.data = true;
      }
      if (options.compat) {
        options.useDepths = true;
      }

      var compiled = undefined;

      function compileInput() {
        var ast = env.parse(input, options),
            environment = new env.Compiler().compile(ast, options),
            templateSpec = new env.JavaScriptCompiler().compile(environment, options, undefined, true);
        return env.template(templateSpec);
      }

      // Template is only compiled on first use and cached after that point.
      function ret(context, execOptions) {
        if (!compiled) {
          compiled = compileInput();
        }
        return compiled.call(this, context, execOptions);
      }
      ret._setup = function (setupOptions) {
        if (!compiled) {
          compiled = compileInput();
        }
        return compiled._setup(setupOptions);
      };
      ret._child = function (i, data, blockParams, depths) {
        if (!compiled) {
          compiled = compileInput();
        }
        return compiled._child(i, data, blockParams, depths);
      };
      return ret;
    }

  });
  
  var runtime = new Runtime();

  Runtime.getDefault = function () {
    return runtime;
  };

  [
    "registerHelper",
    "registerPartial",
    "registerDecorator",
    "unregisterHelper",
    "unregisterPartial",
    "unregisterDecorator",
    "template",
    "precompile",
    "compile"
  ].forEach(fn){
    templater[fn] = function() {
      Runtime.prototype[fn].apply(runtime,arguments);
    }
  }

  return  templater.Runtime = Runtime;

});
