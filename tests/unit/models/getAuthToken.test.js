/* eslint no-undef: "off" */
const { User } = require('../../../models/user');
const config = require('config');
const jwt = require('jsonwebtoken');

describe('userSchema.genAuthToken', () => {
  it('should return a valid jsonwebtoken', () => {
    const user = new User({
      name: 'Omid',
      email: 'a@b.com',
      password: '$EcRet',
      isAdmin: true
    });
    const token = user.genAuthToken();
    const decoded = jwt.verify(token, config.get('jwtPrivateKey'));

    expect(decoded).toMatchObject({
      _id: /^[a-z0-9]{24}$/,
      isAdmin: true
    });
  });
});
