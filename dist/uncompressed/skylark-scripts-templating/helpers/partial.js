define([
	"skylark-langx/types",
	"../templating"
],function(types,templating){

	return templating.helpers.partial =  function (partialName, options) {
    const ctx = this;
    const p = this.templater._partials[partialName];
    if (!p || (p && !p.template)) {
      return '';
    }
    if (!p.compiled) {
      p.compiled = this.templater.compile(p.template);
    }
    Object.keys(options.hash).forEach(function(hashName) {
      ctx[hashName] = options.hash[hashName];
    });
    return p.compiled(ctx, options.data, options.root);
  };
});