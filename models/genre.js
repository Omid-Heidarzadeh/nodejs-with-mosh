const Joi = require('joi');
const mongoose = require('mongoose');

const genreSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 50,
    lowercase: true
  }
});

const genreFields = ['id', 'name'];

const Genre = mongoose.model('Genre', genreSchema);

function validateRequest(request) {
  const { method, body, query } = request;
  const toBeValidated = method === 'GET' ? query : body;
  let schema = {
    id: Joi.string().length(24),
    name: Joi.string().min(3).max(255).lowercase()
  };

  if (method === 'DELETE' || method === 'PUT') {
    schema.id = schema.id.required();
  }

  if (method === 'POST' || method === 'PUT') {
    schema.name = schema.name.required();
  }

  return Joi.object(schema).validate(toBeValidated);
}


function generateQuery(req) {
  let query = {};
  for (let key in req.query) {
    if (
      Object.prototype.hasOwnProperty.call(req.query, key) &&
      genreFields.includes(key)
    ) {
      let value = req.query[key];
      if (key === 'id') key = '_id';
      query[key] = value;
    }
  }
  return query;
}

module.exports = { Genre, genreSchema, generateQuery, validate: validateRequest };