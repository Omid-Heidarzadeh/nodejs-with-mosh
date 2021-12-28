const Joi = require('joi');
const mongoose = require('mongoose');
const { genreSchema } = require('./genre');

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 255,
    lowercase: true
  },
  genres: {
    type: [genreSchema],
    required: true
  },
  numberInStock: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
    set: (v) => Math.round(v)
  },
  dailyRentalRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
});

const Movie = mongoose.model('Movie', movieSchema);
const movieFields = new Map([
  ['id', '_id'],
  ['title', 'title'],
  ['genres', 'genres'],
  ['numberInStock', 'numberInStock'],
  ['dailyRentalRate', 'dailyRentalRate']
]);

function validateRequest(request) {
  const { method, query, body } = request;
  const toValidate = Object.keys(query).length > 0 ? query : body;
  
  const schema = {
    id: Joi.string().length(24),
    title: Joi.string().min(1).max(255).lowercase(),
    genres: Joi.array()
      .optional()
      .custom((arr, helper) => {
        if (!arr.length) return helper.message('Joi: Genres can not be empty.');
        for (let value of arr) {
          if (!value._id || !value.name)
            return helper.message('All genres must have "name" and "_id".');
        }
      }, 'custom validation for genre using Joi'),
    numberInStock: Joi.number().min(0).max(100),
    dailyRentalRate: Joi.number().min(0).max(100)
  };

  if (method === 'PUT' || method === 'DELETE')
    schema.id = schema.id.required();
  if (method === 'PUT' || method === 'POST')
    schema.title = schema.title.required();

  return Joi.object(schema).validate(toValidate);
}

function generateQuery(req) {
  let query = {};
  for (let key in req.query) {
    if (movieFields.has(key)) {
      query[movieFields.get(key)] = req.query[key];
    }
  }
  return query;
}

module.exports = {
  Movie,
  movieSchema,
  generateQuery,
  validate: validateRequest
};
