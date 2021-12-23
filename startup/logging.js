const winston = require('winston');
const config = require('config');
require('winston-mongodb');


module.exports = function () {
  winston.add(new winston.transports.Console);
  winston.add(new winston.transports.File({ filename: 'logger.log' }));
  winston.add(
    new winston.transports.MongoDB({
      db: config.get('db'),
      level: 'info'
    })
  );

  winston.exceptions.handle(
    new winston.transports.File({ filename: 'uncaughtException.log' })
  );

  process.on('unhandledRejection', (ex) => {
    throw ex;
  });
};
