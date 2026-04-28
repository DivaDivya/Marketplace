var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var sqlite3 = require('sqlite3').verbose();

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var cartRouter = require('./routes/cart');
var searchRouter = require('./routes/search');
var productPageRouter = require('./routes/productPage');
var sellerRouter = require('./routes/seller');
var adminRouter = require('./routes/admin');

var app = express();

// Open SQLite database
const db = new sqlite3.Database('./storedb.sqlite', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to storedb.sqlite');
  }
});

// Create tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS accounts (
    actEmail TEXT PRIMARY KEY,
    actPassword TEXT NOT NULL,
    actFname TEXT NOT NULL,
    actLname TEXT NOT NULL,
    actType TEXT NOT NULL
  )`);
  db.run(
  `INSERT OR IGNORE INTO accounts (actEmail, actPassword, actFname, actLname, actType)
   VALUES (?, ?, ?, ?, ?)`,
  );

  db.run(`CREATE TABLE IF NOT EXISTS card (
    cardNo TEXT NOT NULL,
    cardName TEXT NOT NULL,
    cardExp TEXT NOT NULL,
    cardType TEXT NOT NULL,
    cardOwner TEXT NOT NULL,
    FOREIGN KEY(cardOwner) REFERENCES accounts(actEmail) ON UPDATE CASCADE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS listings (
    listNo INTEGER PRIMARY KEY AUTOINCREMENT,
    listName TEXT NOT NULL,
    listDesc TEXT NOT NULL,
    listImage TEXT NOT NULL,
    listPrice REAL NOT NULL,
    listQuantity INTEGER NOT NULL,
    listSeller TEXT NOT NULL,
    FOREIGN KEY(listSeller) REFERENCES accounts(actEmail) ON UPDATE CASCADE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS orders (
    orderDate TEXT NOT NULL,
    orderQuantity INTEGER NOT NULL,
    orderList INTEGER NOT NULL,
    orderAct TEXT,
    FOREIGN KEY(orderList) REFERENCES listings(listNo) ON UPDATE CASCADE,
    FOREIGN KEY(orderAct) REFERENCES accounts(actEmail) ON UPDATE CASCADE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS cart (
    cartQuantity INTEGER NOT NULL,
    cartList INTEGER NOT NULL,
    cartAct TEXT NOT NULL,
    FOREIGN KEY(cartList) REFERENCES listings(listNo) ON UPDATE CASCADE,
    FOREIGN KEY(cartAct) REFERENCES accounts(actEmail) ON UPDATE CASCADE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS reviews (
    revRating INTEGER NOT NULL,
    revTitle TEXT,
    revDesc TEXT,
    revList INTEGER NOT NULL,
    revAct TEXT NOT NULL,
    FOREIGN KEY(revList) REFERENCES listings(listNo) ON UPDATE CASCADE,
    FOREIGN KEY(revAct) REFERENCES accounts(actEmail) ON UPDATE CASCADE
  )`);

  // Optional test data
  /*
  db.run(`INSERT INTO accounts (actEmail, actPassword, actFname, actLname, actType)
    VALUES (?, ?, ?, ?, ?)`,
    ["seller@gmail.com", "password", "first", "last", "seller"]);

  db.run(`INSERT INTO accounts (actEmail, actPassword, actFname, actLname, actType)
    VALUES (?, ?, ?, ?, ?)`,
    ["seller2@gmail.com", "password", "2first", "2last", "seller"]);

  db.run(`INSERT INTO accounts (actEmail, actPassword, actFname, actLname, actType)
    VALUES (?, ?, ?, ?, ?)`,
    ["admin@gmail.com", "password", "first", "last", "admin"]);

  db.run(`INSERT INTO accounts (actEmail, actPassword, actFname, actLname, actType)
    VALUES (?, ?, ?, ?, ?)`,
    ["cust@gmail.com", "password", "first", "last", "customer"]);

  db.run(`INSERT INTO listings (listName, listDesc, listImage, listPrice, listQuantity, listSeller)
    VALUES (?, ?, ?, ?, ?, ?)`,
    ["Carrots", "Bundle of Carrots", "/images/Carrot.png", 0.99, 25, "seller@gmail.com"]);

  db.run(`INSERT INTO listings (listName, listDesc, listImage, listPrice, listQuantity, listSeller)
    VALUES (?, ?, ?, ?, ?, ?)`,
    ["Garlic", "1 Bulb of Garlic", "/images/garlic.jpg", 0.85, 20, "seller@gmail.com"]);

  db.run(`INSERT INTO listings (listName, listDesc, listImage, listPrice, listQuantity, listSeller)
    VALUES (?, ?, ?, ?, ?, ?)`,
    ["Milk", "1 glass of Milk", "/images/milk.jpg", 10.99, 0, "seller@gmail.com"]);
  */
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Make current user available in views
app.use((req, res, next) => {
  res.locals.currentUser = req.cookies.user || null;
  next();
});

// Routes
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/cart', cartRouter);
app.use('/search', searchRouter);
app.use('/productPage', productPageRouter);
app.use('/seller', sellerRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});