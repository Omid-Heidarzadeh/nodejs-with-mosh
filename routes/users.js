const bcrypt = require('bcrypt');
const express = require('express');
const router = express.Router();
const { User, validate } = require('../models/user');
const auth = require('../middleware/auth');

router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.user._id).select('-password -__v');
  res.send(user);
});

router.post('/', async (req, res) => {
  let { error } = validate(req);
  if (error) return res.status(400).send(error.details[0].message);

  let { name, email, password } = req.body;
  let user = await User.findOne({ email });
  if (user) return res.status(400).send('This email address is not available.');

  const hashed = await bcrypt.hash(password, 10);
  user = new User({
    name,
    email,
    password: hashed
  });

  await user.save();
  const token = user.genAuthToken();
  user = { name: user.name, email: user.email };
  res.header('x-auth-token', token).send(user);
});

module.exports = router;
