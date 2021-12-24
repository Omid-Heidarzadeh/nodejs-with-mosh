/* eslint no-undef: 'off' */
const { User } = require('../../../models/user');
const mongoose = require('mongoose');
const auth = require('../../../middleware/auth');

it('it should populate the req.user with jwt payload', () => {
  const user = {
    _id: mongoose.Types.ObjectId(),
    isAdmin: true
  };
  const token = new User(user).genAuthToken();
  const req = {
    header: jest.fn().mockReturnValue(token)
  };
  const res = {};
  const next = jest.fn();

  auth(req, res, next);
  expect(req.user).toMatchObject(user);
});
