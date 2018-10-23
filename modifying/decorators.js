define([
  "../templater",
	'./decorators/inline'
], function (templater, _decoratorsInline) {
  'use strict';

  var decorators = templater.decorators;

  decorators.registerDefaultDecorators = function (instance) {
   	_decoratorsInline(instance);
  };

  return decorators;

});
