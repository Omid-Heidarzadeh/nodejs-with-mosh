module.exports = function (err, req, res, next) {
  // Logging error
  res.status(500).send('Something failed.');
}