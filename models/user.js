const Joi = require('joi');
const mongoose = require('mongoose');

const User = mongoose.model(
  'User',
  new mongoose.Schema({
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 50
    },
    email: {
      type: String,
      required: true,
      unique: true,
      minlength: 6,
      maxlength: 255,
      match: /^[\w-]+@[\w-]+\.\w{2,}.*$/
    },
    password: {
      type: String,
      require: true,
      minlength: 8,
      maxlength: 1024
    }
  })
);

function validateRequest(request) {
  const { body } = request;
  const schema = {
    name: Joi.string().min(3).max(50).trim().required(),
    email: Joi.string().email().trim().required(),
    password: Joi.string().min(8).max(1024).required()
  };
  return Joi.object(schema).validate(body);
}

module.exports = { User, validate: validateRequest };
