const config = require('config');

module.exports = function () {
  if (!config.get('jwtPrivateKey')) {
    throw new Error(
      'FATAL ERROR: envitonment variable "jwtPrivateKey" is not defined.'
    );
  }
};
