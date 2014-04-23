"use strict";

/**
 * Returns an object containing mix-in functions to be added as instance
 * methods on models that need object lifetime checking
 *
 * @param {Number} lifetime The maximum age of the object before it becomes
 * invalid, in seconds
 *
 * @returns {Object} An object containing <code>getTimeToLive</code> and
 * <code>hasExpired</code> functions
 */

var expiresMixin = function(lifetime) {
  return {

    /**
     * @returns {Number} The duration, in seconds, before this object expires
     */

    getTimeToLive: function() {
      // Use updated_at instead of created_at, to reset the time to live after
      // any change to the object's attributes.

      var now = new Date();
      var duration = (now - this.updated_at) / 1000.0;
      var timeToLive = lifetime - duration;

      return timeToLive;
    },

    /**
     * @returns {Boolean} <code>true</code> if this object has expired, or
     * <code>false</code> otherwise
     */

    hasExpired: function() {
      return this.getTimeToLive() <= 0.0;
    }
  };
};

module.exports = expiresMixin;
