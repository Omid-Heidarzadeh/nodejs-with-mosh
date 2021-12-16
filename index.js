const startupDebug = require('debug')('app:startup');
const dbDebug = require('debug')('app:db');
const morgan = require('morgan');
const helmet = require('helmet');
const config = require('config');
const logger = require('./middleware/logger');
const home = require('./routes/home');
const genres = require('./routes/genres');
const customers = require('./routes/customers');
const movies = require('./routes/movies');
const rentals = require('./routes/rentals');
const users = require('./routes/users');
const auth = require('./routes/auth.js');
const error = require('./middleware/error');
const express = require("express");
const app = express();
const mongoose = require('mongoose');

if (!config.get('jwtPrivateKey')) {
  console.error('FATAL ERROR: envitonment variable "jwtPrivateKey" is not defined.');
  process.exit(1);
}

mongoose.connect('mongodb://127.0.0.1:27017/vidly')
  .then(() => dbDebug('Connected to MongoDB...'))
  .catch((err) => dbDebug(`Could not connect to MongoDB: ${err}`));

app.use(express.json());
app.use(helmet());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/', home);
app.use('/api/genres', genres);
app.use('/api/customers', customers);
app.use('/api/movies', movies);
app.use('/api/rentals', rentals);
app.use('/api/users', users);
app.use('/api/auth', auth);
app.use(error);
app.set('view engine', 'pug');


//morgan logger
app.use(morgan('tiny'));

//custom logger middleware
app.use(logger);

//debugging 
startupDebug('app started...');
dbDebug('connected to the DB...');

//configuration
// console.log(`App name: ${config.get('name')}`);
// console.log(`Mail password: ${config.get('mail.password')}`);

//environment variables
// console.log(process.env.NODE_ENV);
// console.log(app.get('env'));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening to port ${port}...`));
