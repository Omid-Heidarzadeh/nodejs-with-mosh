const express = require('express');
const router = express.Router();
const { Customer, generateQuery, validate } = require('../models/customer');
const auth = require('../middleware/auth');
const asyncMiddleware = require('../middleware/async');

router.get('/', asyncMiddleware(async (req, res) => {
  const { error } = validate(req);
  if (error) return res.status(400).send(error.details[0].message);

  if (!Object.keys(req.query).length) {
    const customers = await Customer.find().select('_id name phone');
    return res.send(customers);
  }

  const query = generateQuery(req);
  const customer = await Customer.find(query).select('_id name phone');
  res.send(customer);
}));

router.post('/', auth, asyncMiddleware(async (req, res) => {
  const { error } = validate(req);
  if (error) return res.status(400).send(error.details[0].message);

  const { name, phone, isGold } = req.body;
  let customer = new Customer({
    name,
    phone,
    isGold
  });
  customer = await customer.save();
  res.send(customer);
}));

router.put('/', auth, asyncMiddleware(async (req, res) => {
  const { error } = validate(req);
  if (error) return res.status(400).send(error.details[0].message);

  const { name, phone, isGold } = req.body;
  const customer = await Customer.findByIdAndUpdate(
    req.body.id,
    {
      name,
      phone,
      isGold
    },
    { new: true }
  );
  if (!customer)
    return res.status(404).send('The requested customer not found.');
  res.send(customer);
}));

router.delete('/', auth, asyncMiddleware(async (req, res) => {
  const { error } = validate(req);
  if (error) return res.status(400).send(error.details[0].message);

  const customer = await Customer.findByIdAndRemove(req.body.id);
  res.send(customer);
}));

module.exports = router;
