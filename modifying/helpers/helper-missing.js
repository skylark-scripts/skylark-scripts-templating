define([
  "../templater",
  '../Exception'
], function (_Exception) {
  'use strict';

  return function (instance) {
    instance.registerHelper('helperMissing', function () /* [args, ]options */{
      if (arguments.length === 1) {
        // A missing field in a {{foo}} construct.
        return undefined;
      } else {
        // Someone is actually trying to call something, blow up.
        throw new _Exception('Missing helper: "' + arguments[arguments.length - 1].name + '"');
      }
    });
  };
});
