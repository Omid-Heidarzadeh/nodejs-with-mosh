const Joi = require('joi');
const mongoose = require('mongoose');
const { genreSchema } = require('./genre');

const movieSchema = new mongoose.Schema({
  // _id: {
  //   type: mongoose.Types.ObjectId,
  //   get: v => v.toString()
  // },
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
    // validate: {
    //   validator:  function() {
    //     console.log(`mongooes validation: mongoose.Schema('genreSchema')`, mongoose.Schema('genreSchema'));
    //     if (!this.genres.length) return false;
    //     for (let genre of this.genres) {
    //       if (!(genre instanceof mongoose.Schema('genreSchema'))) return false;
    //     }
    //     return true;
    //   },
    //   message: 'each movie must have at least one valid genre.'
    // }
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
    // {
    //   validate: {
    //     validator: function () {
    //       console.log(this);
    //       return this.numberInStock.max;
    //     },
    //     messsage:
    //       "dailyRentalRate can't be greater than numberInStock max value."
    //   }
    // }
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

  const schema = {
    id: Joi.string().length(24),
    title: Joi.string().min(1).max(255).lowercase(),
    genres: Joi.array().optional().custom((arr, helper) => {
      if (!arr.length) return helper.message('Joi: Genres can not be empty.');
      for (let value of arr) {
        if (!value._id || !value.name)
          return helper.message('All genres must have "name" and "_id".');
      }
    }, 'custom validation for genre using Joi'),
    numberInStock: Joi.number().min(0).max(100),
    dailyRentalRate: Joi.number().min(0).max(100)
  };

  const toValidate = Object.keys(query).length > 0 ? query : body;

  if (['PUT', 'DELETE'].includes(method)) schema.id = schema.id.required();
  if (['POST', 'PUT'].includes(method)) schema.title = schema.title.required();

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
