define([
	"skylark-langx/types",
	"../templating"
],function(types,templating){

	return templating.helpers.each =  function (items, options) {
    var ret = '', i = 0;
    if (types.isFunction(items)) { 
      items = items.call(this); 
    }
    if (types.isArray(items)) {
      if (options.hash.reverse) {
        items = items.reverse();
      }
      for (i = 0; i < items.length; i++) {
        items[i].templater = this.templater;
        ret += options.fn(items[i], {
          first: i === 0, 
          last: i === items.length - 1, 
          index: i
        });
      }
      if (options.hash.reverse) {
        items = items.reverse();
      }
    } else {
      for (var key in items) {
        i++;
        items[key].templater = this.templater;
        ret += options.fn(items[key], {key: key});
      }
    }
    if (i > 0) {
      return ret;
    } else {
      return options.inverse(this);
    }
  };
});