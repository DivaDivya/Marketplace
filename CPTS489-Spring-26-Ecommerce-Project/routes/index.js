var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3').verbose();
var multer = require('multer');
var path = require('path');

// Multer setup - saves uploaded images to public/images/
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/images'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
var upload = multer({ storage: storage });

/* GET home page. */
router.get('/', function(req, res, next) {
  const db = new sqlite3.Database('./storedb.sqlite');
  db.all('SELECT * FROM listings', [], (err, listings) => {
    db.close();
    if (err) return next(err);
    res.render('home', { ...res.locals, listings });
  });
});

router.post('/homePopulate', function(req, res, next) {
  const db = new sqlite3.Database('./storedb.sqlite');
  db.all('SELECT * FROM listings', [], (err, rows) => {
    db.close();
    if (err) return next(err);
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
      if (err) return next(err);
      res.render('order_history', { ...res.locals, orders });
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

router.post('/createListing', upload.single('image'), function(req, res, next) {
  var listName = req.body.name;
  var listDesc = req.body.desc;
  var listPrice = req.body.price;
  var listQuantity = req.body.quantity;
  var listSeller = req.body.email;
  var listImage = req.file ? '/images/' + req.file.filename : null;

  if (!listImage) {
    return res.status(400).send('Image upload failed.');
  }

  const db = new sqlite3.Database('./storedb.sqlite');

  db.run(
    `INSERT INTO listings (listName, listDesc, listImage, listPrice, listQuantity, listSeller)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [listName, listDesc, listImage, listPrice, listQuantity, listSeller],
    function(err) {
      db.close();
      if (err) {
        console.log(err);
        return next(err);
      }
      console.log('Added listing ' + listName);
      res.redirect('/');
    }
  );
});

module.exports = router;