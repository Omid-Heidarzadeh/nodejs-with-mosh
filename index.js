// const startupDebug = require('debug')('app:startup');
// const morgan = require('morgan');
// const logger = require('./middleware/logger');
const config = require('config');
const express = require('express');
const app = express();

require('./startup/logging')();
require('./startup/db')();
require('./startup/routes')(app);

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
