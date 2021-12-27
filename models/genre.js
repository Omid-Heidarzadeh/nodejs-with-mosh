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

const Genre = mongoose.model('Genre', genreSchema);

function validateRequest(request) {
  const { method, body, query, params } = request;
  const toValidate = method === 'GET' ? (params.id ? params : query) : body;
  let schema = {
    id: Joi.string()
      .length(24)
      .custom((value, helpers) => {
        if (!mongoose.Types.ObjectId.isValid(value))
          return helpers.message('Provided id is invalid');
        return value;
      }, 'custom validation for id'),
    name: Joi.string().min(3).max(50).lowercase()
  };

  if (method === 'DELETE' || method === 'PUT') schema.id = schema.id.required();

  if (method === 'POST' || method === 'PUT')
    schema.name = schema.name.required();

  return Joi.object(schema).validate(toValidate);
}

function generateQuery(req) {
  const query = {};
  const genreFields = ['id', 'name'];
  const requested = Object.keys(req.query).length ? req.query : req.params;
  for (let key in requested) {
    if (
      Object.prototype.hasOwnProperty.call(requested, key) &&
      genreFields.includes(key)
    ) {
      let value = requested[key];
      if (key === 'id') key = '_id';
      query[key] = value;
    }
  }
  return query;
}

module.exports = {
  Genre,
  genreSchema,
  generateQuery,
  validate: validateRequest
};
