const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('index', {title: "Express app", h1: "hello"});
});

module.exports = router;