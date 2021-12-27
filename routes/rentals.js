const express = require('express');
const { Customer } = require('../models/customer');
const { Movie } = require('../models/movie');
const { Rental, validate } = require('../models/rental');
const router = express.Router();
const auth = require('../middleware/auth');
const asyncMiddleware = require('../middleware/async');

router.get(
  '/',
  auth,
  asyncMiddleware(async (req, res) => {
    if (!Object.keys(req.query).length) {
      let rentals = await Rental.find();
      return res.send(rentals);
    }
    
    let { id, customerId, movieTitles, from, to } = req.query;
    if (from) from = req.query.from = getDate(from);
    if (to) to = req.query.to = getDate(to);

    let { error } = validate(req);
    if (error) return res.status(400).send(error.details[0].message);

    const filters = [];
    id && filters.push({ _id: id });
    customerId && filters.push({ 'customer._id': customerId });
    movieTitles &&
      filters.push({
        $where: `for (let {_id, title} of this.movies) 
    { if ("${movieTitles}".toLowerCase().includes(title.toLowerCase())) return true }`
      });

    from &&
      filters.push({
        dateOut: {
          $gte: from
        }
      });

    to &&
      filters.push({
        dateOut: {
          $lte: to
        }
      });

    const rentals = await Rental.find()
      .and(filters)
      .catch((error) => {
        return { error };
      });

    if (rentals.error)
      return res
        .status(400)
        .send(`Somthing goes wrong: ${rentals.error.message}`);

    res.send(rentals);
  })
);

function getDate(input) {
  let pattern = /^\d{4}-\d{1,2}-\d{1,2}/g;
  let result;
  if (pattern.test(input)) {
    try {
      result = new Date(input).toISOString();
    } catch (error) {
      result = undefined;
    }
  } else if (Number.isSafeInteger(Number(input))) {
    try {
      result = new Date(Number(input)).toISOString();
    } catch (error) {
      result = undefined;
    }
  }
  return result;
}

router.post(
  '/',
  auth,
  asyncMiddleware(async (req, res) => {
    let { error } = validate(req);
    if (error) return res.status(400).send(error.details[0].message);

    let { customerId, movieTitles, date } = req.body;

    let customer = await Customer.findById(customerId).select('_id name');
    if (!customer)
      return res
        .status(400)
        .send(`Provided customer ID "${customerId}" is not valid.`);

    let movies = await Movie.find({ _id: movieTitles });
    if (!movies.length)
      return res
        .status(400)
        .send(`Could not find movies with provided IDs: ${movieTitles}`);

    const outOfStockMovies = checkMoviesStock(movies);
    if (outOfStockMovies.length > 0)
      return res
        .status(400)
        .send(
          `Out of stock ${
            outOfStockMovies.length > 1 ? 'movies' : 'movie'
          }: "${outOfStockMovies.join(', ')}"`
        );

    movies = movies.map((m) => {
      return { _id: m._id, title: m.title };
    });

    let rental = new Rental({
      customer,
      movies,
      date: date || Date.now()
    });

    let result = await rental
      .save()
      .then(async (saved) => {
        const { error, status } = await updateMoviesStock(movies);
        if (error) return { error, status };
        return saved;
      })
      .catch((error) => {
        return { error };
      });

    if (result.error) {
      await rental.remove();
      return res.status(result.status || 500).send(result.error.message);
    }

    res.send(result);
  })
);

function checkMoviesStock(movies) {
  let outOfStock = [];
  for (let movie of movies) {
    if (movie.numberInStock === 0) outOfStock.push(movie.title);
  }
  return outOfStock;
}

async function updateMoviesStock(movies) {
  let i = 0;
  for (let movie of movies) {
    movie = await Movie.findById(movie._id);
    if (movie.numberInStock === 0) {
      await reverseMoviesStockChanges(movies, i);
      return {
        error: new Error(`'${movie.title}' is out of stock.`),
        status: 400
      };
    }
    movie.numberInStock--;
    await movie.save();
    i++;
  }
  return { error: null };
}

async function reverseMoviesStockChanges(movies, i) {
  let updatedMovies = movies.slice(0, i);
  for (let movie of updatedMovies) {
    movie = await Movie.findById(movie._id);
    movie.numberInStock++;
    await movie.save();
  }
}

module.exports = router;
