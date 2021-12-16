const express = require('express');
const router = express.Router();
const { Genre, generateQuery, validate } = require('../models/genre');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

router.get('/', async (req, res) => {
  if (!Object.keys(req.query).length) {
    const genres = await Genre.find().select('_id name');
    res.status(200).send(genres);
  } else {
    const { error } = validate(req);
    if (error) return res.status(400).send(error.details[0].message);

    let query = generateQuery(req);
    const genre = await Genre.find(query);
    if (genre.length > 0) res.status(200).send(genre);
    else
      res
        .status(404)
        .send('The requested "genre" is not found in the database.');
  }
});

router.post('/', [auth, admin], async (req, res) => {
  const { body } = req;
  const { error } = validate(req);
  if (error) return res.status(400).send(error.details[0].message);

  const genre = new Genre({
    name: body.name
  });

  genre
    .save()
    .then((saved) => res.status(200).send(saved))
    .catch((e) => res.status(400).send(`Bad request: ${e}`));
});

router.put('/', [auth, admin], async (req, res) => {
  const { body } = req;
  const { error } = validate(body);
  if (error) return res.status(400).send(error.details[0].message);

  let genre = await Genre.findByIdAndUpdate(
    body.id,
    {
      name: body.name,
      $inc: { __v: 1 }
    },
    { new: true }
  );
  if (!genre)
    return res
      .status(404)
      .send('The requested "genre" is not found in the database.');
  res.status(200).send(genre);
});

router.delete('/', [auth, admin], async (req, res) => {
  const { body } = req;
  const { error } = validate(body);
  if (error) return res.status(400).send(error.details[0].message);
  const result = await Genre.findByIdAndDelete(body.id);
  if (!result)
    return res
      .status(404)
      .send('The requested "genre" is not found in the database.');
  res.status(200).send(result);
});

module.exports = router;
