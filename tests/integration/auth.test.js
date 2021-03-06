/* eslint no-undef: "off" */
const request = require('supertest');
const { User } = require('../../models/user');
const { Genre } = require('../../models/genre');
const mongoose = require('mongoose');
const config = require('config');

describe('Auth middleware', () => {
  let token = new User().genAuthToken();
  let server;

  const exec = () => {
    return request(server)
      .post('/api/genres')
      .set('x-auth-token', token)
      .send({ name: 'genre1' });
  };

  beforeEach(async () => {
    server = require('../../index');
    await mongoose.connect(config.get('db'));
  });

  afterEach(async () => {
    server.close();
    await Genre.deleteMany({});
    mongoose.connection.close();
  });

  it('should return 401 if no token is provided', async () => {
    token = '';

    const res = await exec();

    expect(res.status).toBe(401);
  });

  it('should return 400 if token is invalid', async () => {
    token = 'a';

    const res = await exec();

    expect(res.status).toBe(400);
  })
});
