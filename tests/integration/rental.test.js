/* eslint no-undef: 0 */
const request = require('supertest');
const mongoose = require('mongoose');
const { User } = require('../../models/user');
const { Movie } = require('../../models/movie');
const { Customer } = require('../../models/customer');
const { Rental } = require('../../models/rental');
const config = require('config');

describe('/api/rentals', () => {
  let server;

  beforeEach(async () => {
    server = require('../../index');
    await mongoose.connect(config.get('db'));
  });

  afterEach(async () => {
    server.close();
    await Rental.deleteMany({});
    await Customer.deleteMany({});
    await Movie.deleteMany({});
    mongoose.connection.close();
  });

  describe('GET /', () => {
    let token;
    let customer;
    let movie1;
    let movie2;
    let filters = [];
    let rental;

    const exec = () => {
      return request(server)
        .get('/api/rentals' + makeQuery(filters))
        .set('x-auth-token', token);
    };

    beforeEach(async () => {
      token = new User().genAuthToken();
      customer = new Customer({ name: 'customer1', phone: '12345' });
      await customer.save();
      movie1 = new Movie({ title: 'first movie'});
      await movie1.save();
      movie2 = new Movie({ title: 'second movie'});
      await movie2.save();

      rental = new Rental({
        customer: {
          name: customer.name,
          _id: customer._id
        },
        movies: [
          {
            title: movie1.title,
            _id: movie1._id
          },
          {
            title: movie2.title,
            _id: movie2._id
          }
        ]
      });
      await rental.save();
    });

    function makeQuery(filters) {
      if (!filters.length) return '';
      let result = '?';
      for (let filter of filters) result += `${filter[0]}=${filter[1]}`;
      return result;
    }

    it('should return 401 if no token is provided', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it('should return list of all rentals', async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      let { __v, _id, customer, movies, dateOut, rentalFee } = rental;
      rental = {
        __v,
        _id: _id.toHexString(),
        customer: {
          name: customer.name,
          _id: customer._id
        },
        movies,
        dateOut: dateOut.toISOString(),
        rentalFee
      };
      expect(res.body[0]).toMatchObject(rental);
    });

    it('should return 400 if query is invalid', async () => {
      let invalidQueries = [
        ['id', 'invalidID'],
        ['customerId', 'invalidID'],
        ['movieTitles', ''],
        ['dateOut', '2021-09-01'],
        ['from', '2021-09-01'],
        ['to', '2021-09-01']
      ];

      for (let query of invalidQueries) {
        filters = [query];
        const res = await exec();

        expect(res.status).toBe(400);
      }
    });
    
    it('should return requested rental if query is valid', async () => {

      let validQueries = [
        ['id', rental._id],
        ['customerId', customer._id],
        ['movieTitles', movie1.title],
        ['movieTitles', movie2.title],
        ['movieTitles', `${movie1.title},${movie2.title}`],
        ['from', '2021-10-01'],
        ['to', Date.now()],
        ['from', '2021-10-01', 'to', Date.now()]
      ];

      for (let query of validQueries) {
        filters = [query];
        const res = await exec();

        expect(res.status).toBe(200);
        let { __v, _id, customer, movies, dateOut, rentalFee } = rental;
        rental = {
          __v,
          _id: _id,
          customer: {
            name: customer.name,
            _id: customer._id
          },
          movies,
          dateOut: new Date(dateOut).toISOString(),
          rentalFee
        };
        expect(res.body[0]).toMatchObject(rental);
      }
    });

  });
});
