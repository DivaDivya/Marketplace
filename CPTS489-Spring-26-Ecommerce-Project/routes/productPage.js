var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3').verbose();

// GET productPage
router.get('/:listNo', function(req, res, next) {
  const productId = req.params.listNo;
  const db = new sqlite3.Database('./storedb.sqlite');

  db.get('SELECT * FROM listings WHERE listNo = ?', [productId], function(err, product) {
    db.close();

    if (err) {
      return next(err);
    }

    res.render('productPage', { product: product });
  });
});

router.post('/itemPopulate', function(req, res, next) {
  const db = new sqlite3.Database('./storedb.sqlite');

  db.get(`SELECT * FROM listings WHERE listNo = ?`, [req.body.id], function(err, row) {
    db.close();

    if (err) {
      return next(err);
    }

    res.send(row);
  });
});

router.post('/review', function(req, res, next) {
  const rating = req.body.rating;
  const title = req.body.title;
  const desc = req.body.desc;
  const id = req.body.id;
  const email = req.body.email;

  const db = new sqlite3.Database('./storedb.sqlite');

  db.run(
    `INSERT INTO reviews (revRating, revTitle, revDesc, revList, revAct)
     VALUES (?, ?, ?, ?, ?)`,
    [rating, title, desc, id, email],
    function(err) {
      db.close();

      if (err) {
        return next(err);
      }

      console.log("Added review");
      res.redirect(`/productPage/${id}`);
    }
  );
});

router.post('/getReviews', function(req, res, next) {
  const db = new sqlite3.Database('./storedb.sqlite');

  db.all(`SELECT * FROM reviews WHERE revList = ?`, [req.body.id], function(err, rows) {
    db.close();

    if (err) {
      return next(err);
    }

    res.send(rows);
  });
});

module.exports = router;