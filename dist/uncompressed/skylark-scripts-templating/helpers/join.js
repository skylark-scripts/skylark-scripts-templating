define([
	"skylark-langx/types",
	"../templating"
],function(types,templating){

	return templating.helpers.join =  function (items, options) {
    if (types.isFunction(items)) { 
      items = items.call(this); 
    }
    return items.join(options.hash.delimiter);
  };
});