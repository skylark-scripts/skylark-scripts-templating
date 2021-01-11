/**
 * skylark-template7 - A version of template7.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["skylark-langx/types","../templating"],function(n,t){return t.helpers.if=function(t,i){return n.isFunction(t)&&(t=t.call(this)),t?i.fn(this,i.data):i.inverse(this,i.data)}});
//# sourceMappingURL=../sourcemaps/helpers/if.js.map
