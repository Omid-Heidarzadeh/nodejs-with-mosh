/* eslint no-undef: 'off' */
const request = require('supertest');
const { Genre } = require('../../models/genre');
const { User } = require('../../models/user');
const mongoose = require('mongoose');

let server;

describe('/api/genres', () => {
  beforeEach(() => {
    server = require('../../index');
  });
  afterEach(async () => {
    server.close();
    await Genre.deleteMany({});
  });

  describe('GET /', () => {
    it('should return list of all genres', async () => {
      await Genre.collection.insertMany([
        { name: 'genre1' },
        { name: 'genre2' }
      ]);

      const result = await request(server).get('/api/genres');
      expect(result.status).toBe(200);
      expect(result.body.length).toBe(2);
      expect(result.body.some((g) => g.name === 'genre1')).toBeTruthy();
      expect(result.body.some((g) => g.name === 'genre2')).toBeTruthy();
    });
  });

  describe('GET /:id', () => {
    it('should return requested genre by ID', async () => {
      const id = new mongoose.Types.ObjectId();
      await Genre.collection.insertOne({ _id: id, name: 'genre1' });

      const query = `/api/genres?id=${id}`;
      const param = `/api/genres/${id}`;
      const queryResult = await request(server).get(query);
      const paramResult = await request(server).get(param);

      expect(queryResult.status).toBe(200);
      expect(queryResult.body).toMatchObject({ _id: id, name: 'genre1' });
      expect(paramResult.status).toBe(200);
      expect(paramResult.body).toMatchObject({ _id: id, name: 'genre1' });
    });

    it('should return requested genre by name', async () => {
      // const id = new mongoose.Types.ObjectId();
      const genre = new Genre({ name: 'genre1' });
      await genre.save();
      // await Genre.collection.insertOne({ _id: id, name: 'genre1' });

      const query = '/api/genres?name=genre1';
      const result = await request(server).get(query);

      expect(result.status).toBe(200);
      expect(result.body).toMatchObject({ _id: genre._id, name: genre.name });
    });

    it.each([
      '?id=',
      '?id=12345',
      '?name=',
      '?name=ab',
      '?name=a very very very long string that exceeds 50 character',
      '/1',
      '/a'
    ])('should return proper error when invalid query sent', async (query) => {
      let result = await request(server).get(`/api/genres${query}`);

      expect(result.status).toBe(400);
      expect(
        typeof result.text === 'string' && result.text.length > 0
      ).toBeTruthy();
    });
  });

  describe('POST /', () => {
    let token;
    let name;

    const exec = async () => {
      return await request(server)
        .post('/api/genres')
        .set('x-auth-token', token)
        .send({ name });
    };

    beforeEach(() => {
      token = new User({ isAdmin: true }).genAuthToken();
      name = 'genre1';
    });

    it('should return 401 if the client does not logged in', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it('should return 403 if the user is not admin', async () => {
      token = new User({ isAdmin: false }).genAuthToken();
      const res = await exec();

      expect(res.status).toBe(403);
    });

    it('should return 400 if the name is less than 3 characters', async () => {
      name = 'ab';

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if the name is more than 50 characters', async () => {
      name = new Array(52).join('a');

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should save the genre if it is valid', async () => {
      await exec();

      const genre = await Genre.findOne({ name: 'genre1' });

      expect(genre).not.toBeNull();
      expect(genre).toMatchObject({ name: 'genre1' });
    });

    it('should return the genre if it is valid', async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ _id: /^[a-z0-9]{24}$/, name: 'genre1' });
    });
  });

  describe('PUT /', () => {
    let token;
    let id;
    let name;

    const exec = () => {
      return request(server)
        .put('/api/genres')
        .set('x-auth-token', token)
        .send({ id, name });
    };

    beforeEach(async () => {
      id = new mongoose.Types.ObjectId();
      name = 'new Genre';
      token = new User({ isAdmin: true }).genAuthToken();
      let genre = new Genre({ _id: id, name: 'old genre' });
      await genre.save();
    });

    it('should return 401 if no token is provided', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it('should return 403 if user is not admin', async () => {
      token = new User({ isAdmin: false }).genAuthToken();

      const res = await exec();

      expect(res.status).toBe(403);
    });

    it.each([
      ['invalidID', 'validName'],
      [mongoose.Types.ObjectId(), 'a'],
      ['', 'validName'],
      [mongoose.Types.ObjectId(), '']
    ])('should return 400 if request is invalid', async (a, b) => {
      id = a;
      name = b;

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 404 if requested genre does not exist', async () => {
      id = new mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it('should update genre if requested genre is valid', async () => {
      name = 'new genre';

      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ _id: id, name: name });
    });
  });

  describe('DELETE /', () => {
    const name = 'genre';
    let token;
    let id;

    const exec = () => {
      return request(server)
        .delete('/api/genres')
        .set('x-auth-token', token)
        .send({id});
    };

    beforeEach(async () => {
      token = new User({ isAdmin: true }).genAuthToken();
      id = new mongoose.Types.ObjectId();
      let genre = new Genre({ _id: id, name: name });
      await genre.save();
    });

    it('should return 401 if no token is provided', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it('should return 403 if user is not admin', async () => {
      token = new User({ isAdmin: false }).genAuthToken();

      const res = await exec();

      expect(res.status).toBe(403);
    });

    it.each(['', 'a', '1'])('should return 400 if provided id is invalid', async (arg) => {
      id = arg;
      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 404 if requested id is not found', async () => {
      id = new mongoose.Types.ObjectId().toHexString();

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it('should delete valid requested genre and return it', async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ _id: id, name: name });
    });
  });
});
