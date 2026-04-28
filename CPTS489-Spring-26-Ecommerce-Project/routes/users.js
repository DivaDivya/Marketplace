var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3').verbose();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

/* GET login page. */
router.get('/login', function(req, res, next) {
  res.render('index');
});

/* GET register page. */
router.get('/register', function(req, res, next) {
  res.render('register');
});

router.get('/profile', function(req, res, next) {
  res.render('update_profile', { title: 'Express' });
});

// Registration
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
    `INSERT INTO accounts (actEmail, actPassword, actFname, actLname, actType)
     VALUES (?, ?, ?, ?, ?)`,
    [email, password, fname, lname, type],
    function(err) {
      db.close();

      if (err) {
        return next(err);
      }

      console.log("Added user " + email + " as " + type);
      res.redirect('/users/login');
    }
  );
});
// Log in
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

            if (err) {
              return next(err);
            }

            res.locals.userCart = rows || [];
            res.redirect('/');
          }
        );
      } else {
        db.close();
        res.render('index');
      }
    }
  );
});

// Log out
router.post('/logout_user', function(req, res, next) {
  res.clearCookie('user');
  res.redirect('/');
});

module.exports = router;