var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3').verbose();

/* GET home page. */
router.get('/', function(req, res, next) {
  const db = new sqlite3.Database('./storedb.sqlite');

  db.all('SELECT * FROM listings', [], (err, listings) => {
    db.close();

    if (err) {
      return next(err);
    }

    res.render('home', { ...res.locals, listings });
  });
});

router.post('/homePopulate', function(req, res, next) {
  const db = new sqlite3.Database('./storedb.sqlite');

  db.all('SELECT * FROM listings', [], (err, rows) => {
    db.close();

    if (err) {
      return next(err);
    }

    res.send(rows);
  });
});

router.get('/order_history', function(req, res, next) {
  const db = new sqlite3.Database('./storedb.sqlite');
  const userEmail = res.locals.currentUser ? res.locals.currentUser.email : null;

  db.all(
    `SELECT * FROM orders 
     JOIN listings ON orders.orderList = listings.listNo 
     WHERE orders.orderAct = ?`,
    [userEmail],
    (err, orders) => {
      db.close();

      if (err) {
        return next(err);
      }

      res.render('order_history', { ...res.locals, orders: orders });
    }
  );
});

router.get('/productPage', function(req, res, next) {
  res.render('productPage.ejs', { title: 'Express' });
});

router.get('/add_item', function(req, res, next) {
  res.render('add_item', { title: 'Express' });
});

router.get('/profile', function(req, res, next) {
  res.render('update_profile', { title: 'Express' });
});

router.post('/createListing', function(req, res, next) {
  var listNo = 1;
  var listName = req.body.name;
  var listDesc = req.body.desc;
  var listImage = req.body.image;
  var listPrice = req.body.price;
  var listQuantity = req.body.quantity;
  var listSeller = req.body.email;

  const db = new sqlite3.Database('./storedb.sqlite');

  db.get(`SELECT COUNT(*) AS count FROM listings`, [], (err, row) => {
    if (err) {
      db.close();
      return next(err);
    }

    listNo = listNo + row.count;

    db.run(
      `INSERT INTO listings (listNo, listName, listDesc, listImage, listPrice, listQuantity, listSeller)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [listNo, listName, listDesc, "/images/" + listImage, listPrice, listQuantity, listSeller],
      function(err) {
        db.close();

        if (err) {
          console.log(err);
          return next(err);
        }

        console.log("Added listing " + listName);
        res.redirect('/');
      }
    );
  });
});

module.exports = router;