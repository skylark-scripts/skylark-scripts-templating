define([
	"skylark-langx/types",
	"../templating"
],function(types,templating){

	return templating.helpers.js =  function (expression, options) {
    var func;
    if (expression.indexOf('return')>=0) {
      func = '(function(){'+expression+'})';
    } else {
      func = '(function(){return ('+expression+')})';
    }
    return eval.call(this, func).call(this);
  };
});