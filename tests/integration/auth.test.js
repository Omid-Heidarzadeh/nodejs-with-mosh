/* eslint no-undef: "off" */
const request = require('supertest');
const { User } = require('../../models/user');
const { Genre } = require('../../models/genre');

describe('Auth middleware', () => {
  let token = new User().genAuthToken();

  const exec = () => {
    return request(server)
      .post('/api/genres')
      .set('x-auth-token', token)
      .send({ name: 'genre1' });
  };

  beforeEach(() => {
    server = require('../../index');
  });

  afterEach(async () => {
    server.close();
    await Genre.deleteMany({});
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
