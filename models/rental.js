const Joi = require('joi');
const mongoose = require('mongoose');
// const { customerSchema } = require('./customer');
// const { movieSchema } = require('./movie');

const rentalSchema = new mongoose.Schema({
  customer: {
    type: {
      name: String,
      _id: {
        type: String,
        length: 24
      }
    },
    required: true
  },
  movies: {
    type: Array,
    required: true
  },
  date: {
    type: Date,
    default: Date.now(),
    min: Date('2021-11-01')
  }
});

const Rental = mongoose.model('Rental', rentalSchema);

function validateRequest(request) {
  const { method, query, body } = request;
  const toValidate = method === 'GET' ? query : body;
  const schema = {
    id: Joi.string().length(24),
    customerId: Joi.string(),
    movieTitles: Joi.custom((v, helper) => {
      if (typeof v !== 'string' && !Array.isArray(v))
        return helper.message(`Invalid movieTitles:${v}`);
      let arr = Array.isArray(v) ? v : v.split(',');
      for (let id of arr) {
        if (typeof id !== 'string')
          return helper.message('All movie titles must be string.');
        // if (id.length !== 24) 
        //   return helper.message('Movie IDs must be 24 characters long.');
      }
      return true;
    }),
    date: Joi.date().min(new Date('2021-10-01')),
    from: Joi.date().min(new Date('2021-10-01')),
    to: Joi.date().min(new Date('2021-10-01'))
  };
  if (method === 'POST') {
    schema.customerId = schema.customerId.required();
    schema.movieTitles = schema.movieTitles.required();
  }
  return Joi.object(schema).validate(toValidate);
}

module.exports = { Rental, rentalSchema, validate: validateRequest };
