const winston = require('winston');
require('winston-mongodb');
// const startupDebug = require('debug')('app:startup');
// const morgan = require('morgan');
const config = require('config');
// const logger = require('./middleware/logger');
const express = require('express');
const app = express();
require('./startup/db')();
require('./startup/routes')(app);

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

if (!config.get('jwtPrivateKey')) {
  console.error(
    'FATAL ERROR: envitonment variable "jwtPrivateKey" is not defined.'
  );
  process.exit(1);
}

//morgan logger
// app.use(morgan('tiny'));

//custom logger middleware
// app.use(logger);

//debugging
// startupDebug('app started...');

//configuration
// console.log(`App name: ${config.get('name')}`);
// console.log(`Mail password: ${config.get('mail.password')}`);

//environment variables
// console.log(process.env.NODE_ENV);
// console.log(app.get('env'));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening to port ${port}...`));
