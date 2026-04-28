var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3').verbose();

router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/login', function(req, res, next) {
  res.render('index');
});

router.get('/register', function(req, res, next) {
  res.render('register');
});

router.get('/profile', function(req, res, next) {
  res.render('update_profile', { title: 'Express' });
});

router.post('/add_user', function(req, res, next) {
  var fname = req.body.fname;
  var lname = req.body.lname;
  var email = req.body.email;
  var password = req.body.password;
  var type = req.body.type;

  if (!['customer', 'seller'].includes(type)) {
    return res.status(400).send('Invalid account type');
  }

  const db = new sqlite3.Database('./storedb.sqlite');

  db.run(
    `INSERT INTO accounts (actEmail, actFname, actLname, actPassword, actType) VALUES (?, ?, ?, ?, ?)`,
    [email, fname, lname, password, type],
    function(err) {
      db.close();
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.render('register', {
            ...res.locals,
            error: 'An account with this email already exists.'
          });
        }
        return next(err);
      }
      res.redirect('/');
    }
  );
});

router.post('/login_user', function(req, res, next) {
  var email = req.body.email;
  var password = req.body.password;

  const db = new sqlite3.Database('./storedb.sqlite');

  db.get(
    'SELECT * FROM accounts WHERE actEmail = ? AND actPassword = ?',
    [email, password],
    function(err, user) {
      if (err) {
        db.close();
        return next(err);
      }
      if (user) {
        res.cookie('user', {
          email: user.actEmail,
          firstName: user.actFname,
          lastName: user.actLname,
          type: user.actType
        });
        db.all(
          'SELECT cartList, cartQuantity FROM cart WHERE cartAct = ?',
          [user.actEmail],
          function(err, rows) {
            db.close();
            if (err) return next(err);
            res.locals.userCart = rows || [];
            res.redirect('/');
          }
        );
      } else {
        db.close();
        res.render('index', {
          ...res.locals,
          error: 'Invalid email or password.'
        });
      }
    }
  );
});

router.post('/logout_user', function(req, res, next) {
  res.clearCookie('user');
  res.redirect('/');
});

module.exports = router;