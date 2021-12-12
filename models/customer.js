const Joi = require('joi');
const mongoose = require('mongoose');

const Customer = mongoose.model(
  'Customer',
  new mongoose.Schema({
    isGold: {
      type: Boolean,
      default: false
    },
    name: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 50,
      lowercase: true
    },
    phone: {
      type: Number,
      required: true,
      min: 1e4,
      max: 1e10
    }
  })
);

function validateRequest(request) {
  const { method, query, body } = request;
  let toValidate = method === 'GET' ? query : body;

  const schema = {
    id: Joi.string().length(24),
    name: Joi.string().min(2).max(50).lowercase(),
    phone: Joi.number().min(1e4).max(1e10),
    isGold: Joi.boolean()
  };

  if (method === 'POST') {
    schema.name = schema.name.required();
    schema.phone = schema.phone.required();
  }

  if (method === 'DELETE' || method === 'PUT') {
    schema.id = schema.id.required();
  }

  return Joi.object(schema).validate(toValidate);
}

function generateQuery(req) {
  let query = {};
  for (let key in req.query) {
    let value = req.query[key];
    key = key === 'id' ? '_id' : key;
    query[key] = value;
  }
  return query;
}

module.exports = { Customer, generateQuery, validate: validateRequest };