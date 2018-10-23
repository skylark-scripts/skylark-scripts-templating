define([
  "../templater"
], function () {
  'use strict';

  return function (instance) {
    instance.registerHelper('lookup', function (obj, field) {
      return obj && obj[field];
    });
  };
});