define([
	"skylark-langx/types",
	"../templating"
],function(types,templating){

	return templating.helpers.if =  function (express, options) {
      if (types.isFunction(express)) { 
      	express = express.call(this); 
      }
      if (express) {
        return options.fn(this, options.data);
      }  else {
        return options.inverse(this, options.data);
      }
    };
});