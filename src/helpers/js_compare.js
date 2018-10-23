define([
	"skylark-langx/types",
	"../templating"
],function(types,templating){

  return templating.helpers.js_compare =  function (expression, options) {
    var func;
    if (expression.indexOf('return')>=0) {
      func = '(function(){'+expression+'})';
    } else {
      func = '(function(){return ('+expression+')})';
    }
    var condition = eval.call(this, func).call(this);
    if (condition) {
      return options.fn(this,options.data);
    } else {
      return options.inverse(this,options.data);   
    }
  };

});