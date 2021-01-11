define([
	"skylark-langx/types",
	"../templating"
],function(types,templating){

  return templating.helpers.with =  function (context, options) {
    if (types.isFunction(context)) { 
      context = context.call(this); 
    }
    return options.fn(context);
  };
});