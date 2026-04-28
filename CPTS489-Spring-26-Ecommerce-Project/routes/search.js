var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3').verbose();

// GET search
router.get('/', function(req, res, next) {
  const searchTerm = req.query.q || '';
  const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : null;
  const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null;
  const inStock = req.query.inStock === 'true';

  const db = new sqlite3.Database('./storedb.sqlite');

  // find product from search, matching name or description
  let query = 'SELECT * FROM listings WHERE (listName LIKE ? OR listDesc LIKE ?)';
  let params = [`%${searchTerm}%`, `%${searchTerm}%`];

  // filters
  if (minPrice !== null) {
    query += ' AND listPrice >= ?';
    params.push(minPrice);
  }

  if (maxPrice !== null) {
    query += ' AND listPrice <= ?';
    params.push(maxPrice);
  }

  if (inStock) {
    query += ' AND listQuantity > 0';
  }

  // combine search with filters
  db.all(query, params, function(err, listings) {
    db.close();

    if (err) {
      return next(err);
    }

    res.render('search', {
      ...res.locals,
      listings,
      searchTerm,
      minPrice,
      maxPrice,
      inStock
    });
  });
});

module.exports = router;