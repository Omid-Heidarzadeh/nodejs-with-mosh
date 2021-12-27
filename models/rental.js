const Joi = require('joi');
const mongoose = require('mongoose');
// const { Movie } = require('./movie');
// const { customerSchema } = require('./customer');
// const { movieSchema } = require('./movie');

const rentalSchema = new mongoose.Schema({
  customer: {
    type: {
      name: String,
      _id: {
        type: String,
        length: 24,
        validate: {
          validator: function (value) {
            return mongoose.Types.ObjectId.isValid(value);
          },
          message: 'customer id is invalid'
        }
      }
    },
    required: true
  },
  movies: {
    type: Array,
    validate: {
      validator: function (movies) {
        if (!Array.isArray(movies) || !movies.length) return false;
        for (let movie of movies) {
          if (!movie.title || typeof movie.title !== 'string') return false;
          if (!movie._id || !mongoose.Types.ObjectId.isValid(movie._id))
            return false;
          return true;
        }
      },
      message: 'movies must be an array of valid objects'
    },
    required: true
  },
  dateOut: {
    type: Date,
    default: Date.now(),
    min: Date('2021-11-01')
  },
  returnDate: {
    type: Date,
    validate: {
      validator: function (value) {
        return !value || value >= this.dateOut;
      },
      message: 'Return date must be greater than or equal to dateOut'
    },
    default: undefined
  },
  rentalFee: {
    type: Number,
    default: 0
  }
});

const Rental = mongoose.model('Rental', rentalSchema);

function validateRequest(request) {
  const { method, query, body } = request;
  const toValidate = method === 'GET' ? query : body;
  const schema = {
    id: Joi.string().custom(isValidId),
    customerId: Joi.string().custom(isValidId),
    movieTitles: Joi.custom(checkMovieTitles, 'movieTitles custom validation'),
    dateOut: Joi.date().min(new Date('2021-10-01')).custom(validateDate),
    from: Joi.date().min(new Date('2021-10-01')).custom(validateDate),
    to: Joi.date().min(new Date('2021-10-01')).custom(validateDate)
  };
  if (method === 'POST') {
    schema.customerId = schema.customerId.required();
    schema.movieTitles = schema.movieTitles.required();
  }
  return Joi.object(schema).validate(toValidate);

  function isValidId(v, helper) {
    if (!mongoose.Types.ObjectId.isValid(v))
      return helper.message(`provided id is invalid:${v}`);
  }

  function checkMovieTitles(v, helper) {
    if (!v) return helper.error('any.invalid');

    if (typeof v !== 'string' && !Array.isArray(v))
      return helper.message(`Invalid movieTitles:${v}`);

    let titles = Array.isArray(v) ? v : v.split(',');
    for (let title of titles) {
      if (typeof title !== 'string')
        return helper.message('All movie titles must be string.');
    }
    return titles.length ? titles : [v];
  }

  function validateDate(v) {
    if (Number.isSafeInteger(Number(v))) v = Number(v);
    return new Date(v).toISOString();
  }
}

module.exports = { Rental, rentalSchema, validate: validateRequest };
