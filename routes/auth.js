const bcrypt = require('bcrypt');
const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { User } = require('../models/user');

router.post('/', async (req, res) => {
  let { error } = await validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).send('Invalid email or password');

  const isValidPassword = await bcrypt.compare(req.body.password, user.password);
  if (!isValidPassword) return res.status(400).send('Invalid email or password');

  res.send(true);
});

function validate(request) {
  let schema = {
    email: Joi.string().email().required(),
    password: Joi.string().required()
  } 
  return Joi.object(schema).validateAsync(request);
}

module.exports = router;