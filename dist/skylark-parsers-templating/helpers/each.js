/**
 * skylark-parsers-templating - The skylark template engine library.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["skylark-langx/types","../templating"],function(e,r){return r.helpers.each=function(r,t){var s="",n=0;if(e.isFunction(r)&&(r=r.call(this)),e.isArray(r)){for(t.hash.reverse&&(r=r.reverse()),n=0;n<r.length;n++)r[n].templater=this.templater,s+=t.fn(r[n],{first:0===n,last:n===r.length-1,index:n});t.hash.reverse&&(r=r.reverse())}else for(var i in r)n++,r[i].templater=this.templater,s+=t.fn(r[i],{key:i});return n>0?s:t.inverse(this)}});
//# sourceMappingURL=../sourcemaps/helpers/each.js.map
