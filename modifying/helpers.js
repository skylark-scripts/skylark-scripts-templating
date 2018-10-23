define([
  "../templater",
  './helpers/block-helper-missing', 
  './helpers/each', 
  './helpers/helper-missing', 
  './helpers/if', 
  './helpers/log', 
  './helpers/lookup', 
  './helpers/with'
], function (templater, _registerBlockHelperMissing, _registerEach, _registerHelperMissing, _registerIf, _registerLog, _registerLookup, _registerWith) {
  'use strict';

  var decorators = templater.decorators;

  return  {

     registerDefaultHelpers : function (instance) {
      _registerBlockHelperMissing(instance);
      _registerEach(instance);
      _registerHelperMissing(instance);
      _registerIf(instance);
      _registerLog(instance);
      _registerLookup(instance);
      _registerWith(instance);
    }

  };

});