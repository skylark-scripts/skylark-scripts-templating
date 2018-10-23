/**
 * skylark-utils-templating - The skylark template engine library.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.1
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["skylark-langx/types","../templating"],function(n,i){return i.helpers.join=function(i,e){return n.isFunction(i)&&(i=i.call(this)),i.join(e.hash.delimiter)}});
//# sourceMappingURL=../sourcemaps/helpers/join.js.map
