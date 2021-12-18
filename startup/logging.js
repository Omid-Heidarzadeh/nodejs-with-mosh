const winston = require('winston');
require('winston-mongodb');

module.exports = function () {
  winston.add(new winston.transports.File({ filename: 'logger.log' }));
winston.add(
  new winston.transports.MongoDB({
    db: 'mongodb://127.0.0.1:27017/vidly',
    level: 'info'
  })
);

winston.exceptions.handle(
  new winston.transports.File({ filename: 'uncaughtException.log' })
);

// process.on('uncaughtException', (ex) => {
//   console.log('custom', ex);
//   winston.log('error', ex);
// });

process.on('unhandledRejection', (ex) => {
  throw (ex);
});


}