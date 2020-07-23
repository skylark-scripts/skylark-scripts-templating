/**
 * skylark-scripts-templating - The skylark template engine library.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["skylark-langx/types","../templating"],function(n,t){return t.helpers.js=function(n,t){var e;return e=n.indexOf("return")>=0?"(function(){"+n+"})":"(function(){return ("+n+")})",eval.call(this,e).call(this)}});
//# sourceMappingURL=../sourcemaps/helpers/js.js.map
