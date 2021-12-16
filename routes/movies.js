const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Movie, generateQuery, validate } = require('../models/movie');
const { Genre } = require('../models/genre');
const auth = require('../middleware/auth');

router.get('/', async (req, res) => {
  const { error } = validate(req);
  if (error) return res.status(400).send(error.details[0].message);

  if (!Object.keys(req.query).length) {
    const movies = await Movie.find();
    return res.send(movies);
  }

  const query = generateQuery(req);
  const movie = await Movie.find(query);
  if (!movie.length)
    return res
      .status(404)
      .send('The requested movie with given ID was not found.');
  res.send(movie);
});

router.post('/', auth, async (req, res) => {
  const result = await makeListOfGenres(req.body.genres);
  if (result.error) return res.status(result.status).send(result.error);
  req.body.genres = result.list;

  const { error } = validate(req);
  if (error) return res.status(404).send(error.details[0].message);

  let created = await createMovie(req.body);
  if (created.error)
    return res
      .status(400)
      .send(`something goes wrong: ${created.error.message}`);
  res.send(created.movie);
});

router.put('/', auth, async (req, res) => {
  if (req.body?.genres?.length > 0) {
    const result = await makeListOfGenres(req.body.genres);
    if (result.error) return res.status(result.status).send(result.error);
    req.body.genres = result.list;
  }

  const { error } = validate(req);
  if (error) return res.status(404).send(error.details[0].message);

  let movie = await Movie.findById(req.body.id).catch((error) => {
    return { error };
  });
  if (movie.error)
    return res.send(404).send('No movie document with the givenID was found.');
  let updated = await updateMovie(movie, req.body);
  if (updated.error)
    return res.status(500).send(`server internal error: ${updated.error.message}`);
  return res.send(updated.movie);
});

router.delete('/', auth, async (req, res) => {
  const { error } = validate(req);
  if (error) return res.status(400).send(error.details[0].message);
  let result = await Movie.findByIdAndRemove(req.body.id)
    .then((movie) => {
      return { movie };
    })
    .catch((error) => {
      return { error };
    });
  if (result.error)
    return res.status(500).send(`Internal server error: ${result.error}`);
  res.send(result.movie);
});

async function createMovie({ title, genres, numberInStock, dailyRentalRate }) {
  let movie = new Movie({
    title,
    genres,
    numberInStock,
    dailyRentalRate
  });
  let result = await movie
    .save()
    .then((movie) => {
      return { movie };
    })
    .catch((error) => {
      return { error };
    });
  return result;
}

async function updateMovie(
  movie,
  { title, genres, numberInStock, dailyRentalRate }
) {
  movie.title = title ?? movie.title;
  movie.genres = genres ?? movie.genres;
  movie.numberInStock = numberInStock ?? movie.numberInStock;
  movie.dailyRentalRate = dailyRentalRate ?? movie.dailyRentalRate;
  let result = await movie
    .save()
    .then((movie) => {
      return { movie };
    })
    .catch((error) => {
      return { error };
    });
  return result;
}

async function makeListOfGenres(genres) {
  const genreDocs = [];
  for (let genre of genres) {
    if (!(genre instanceof mongoose.Schema)) {
      let result;
      try {
        result = await findGenreByNameOrId(genre).then((res) => {
          return res[0];
        });
      } catch (err) {
        return {
          error: `The provided genreID "${genre.id}" is not valid.`,
          status: 400
        };
      }
      if (!result && genre.id)
        return {
          error: `The provided genreID "${genre.id}" is not valid.`,
          status: 400
        };
      if (!result && genre.name)
        result = await createGenre(genre.name).catch((err) => {
          return { error: err };
        });
      if (result.error) return { error: result.error, status: 500 };
      genreDocs.push(result);
    }
  }
  return { list: genreDocs };
}

async function findGenreByNameOrId(genre) {
  return await Genre.find()
    .or([{ _id: genre.id }, { name: genre.name }])
    .select('_id name');
}

async function createGenre(name) {
  let genre;
  try {
    genre = new Genre({ name });
    genre = await genre.save().then(({ _id, name }) => {
      return { _id, name };
    });
    return genre;
  } catch (e) {
    console.error('creating and saving of genre failed.', e.message);
  }
}

module.exports = router;
