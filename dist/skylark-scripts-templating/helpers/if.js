/**
 * skylark-scripts-templating - The skylark template engine library.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["skylark-langx/types","../templating"],function(n,t){return t.helpers.if=function(t,i){return n.isFunction(t)&&(t=t.call(this)),t?i.fn(this,i.data):i.inverse(this,i.data)}});
//# sourceMappingURL=../sourcemaps/helpers/if.js.map
