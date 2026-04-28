var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3').verbose();

// GET cart
router.get('/', function(req, res, next) {
  const db = new sqlite3.Database('./storedb.sqlite');
  const userEmail = res.locals.currentUser ? res.locals.currentUser.email : null;
  if (!userEmail) return res.redirect('/');

  db.all(
    `SELECT * FROM cart 
     JOIN listings ON cart.cartList = listings.listNo 
     WHERE cart.cartAct = ?`,
    [userEmail],
    (err, cartData) => {
      if (err) {
        db.close();
        return next(err);
      }

      const subtotal = cartData.reduce(
        (total, item) => total + (item.listPrice * item.cartQuantity),
        0
      );

      db.close();
      res.render('cart', { ...res.locals, cart: cartData, subtotal: subtotal.toFixed(2) });
    }
  );
});

// checkout page
router.get('/checkout', function(req, res, next) {
  const db = new sqlite3.Database('./storedb.sqlite');
  const userEmail = res.locals.currentUser ? res.locals.currentUser.email : null;
  if (!userEmail) return res.redirect('/');

  db.all(
    `SELECT * FROM cart 
     JOIN listings ON cart.cartList = listings.listNo 
     WHERE cart.cartAct = ?`,
    [userEmail],
    (err, cartData) => {
      if (err) return next(err);

      db.all(`SELECT * FROM card WHERE cardOwner = ?`, [userEmail], (err, cards) => {
        if (err) return next(err);

        const subtotal = cartData.reduce(
          (total, item) => total + (item.listPrice * item.cartQuantity),
          0
        );

        db.close();
        res.render('checkout', {
          ...res.locals,
          cart: cartData,
          cards: cards,
          subtotal: subtotal.toFixed(2)
        });
      });
    }
  );
});

// order review page - shown after card details, before payment is processed
router.post('/reviewOrder', function(req, res, next) {
  const db = new sqlite3.Database('./storedb.sqlite');
  const userEmail = res.locals.currentUser ? res.locals.currentUser.email : null;
  if (!userEmail) return res.redirect('/');

  // Pass card details through hidden fields so they survive to the next step
  const cardDetails = {
    fname: req.body.fname || '',
    lname: req.body.lname || '',
    card: req.body.card || '',
    experation: req.body.experation || '',
    cvv: req.body.cvv || '',
    savedCard: req.body.savedCard || ''
  };

  db.all(
    `SELECT * FROM cart
     JOIN listings ON cart.cartList = listings.listNo
     WHERE cart.cartAct = ?`,
    [userEmail],
    (err, cartData) => {
      if (err) { db.close(); return next(err); }

      if (cartData.length === 0) {
        db.close();
        return res.redirect('/cart');
      }

      const subtotal = cartData.reduce(
        (total, item) => total + (item.listPrice * item.cartQuantity), 0
      );

      db.close();
      res.render('order_review', {
        ...res.locals,
        cart: cartData,
        subtotal: subtotal.toFixed(2),
        cardDetails
      });
    }
  );
});

// perform checkout - now redirects to success page
router.post('/doCheckout', function(req, res, next) {
  const db = new sqlite3.Database('./storedb.sqlite');
  const userEmail = res.locals.currentUser ? res.locals.currentUser.email : null;

  const date = new Date();
  const formattedDate = `${date.getMonth()+1}-${date.getDate()}-${date.getFullYear()}`;

  db.all(
    `SELECT * FROM cart
     JOIN listings ON cart.cartList = listings.listNo
     WHERE cart.cartAct = ?`,
    [userEmail],
    (err, cartData) => {
      if (err) { db.close(); return next(err); }

      if (cartData.length === 0) {
        db.close();
        return res.redirect('/cart');
      }

      const subtotal = cartData.reduce(
        (total, item) => total + (item.listPrice * item.cartQuantity), 0
      );

      let completed = 0;

      cartData.forEach(item => {
        db.get(`SELECT * FROM listings WHERE listNo = ?`, [item.cartList], (err, listing) => {
          if (err) return next(err);

          const newQuant = listing.listQuantity - item.cartQuantity;
          db.run(`UPDATE listings SET listQuantity = ? WHERE listNo = ?`, [newQuant, item.cartList]);

          db.run(
            `INSERT INTO orders (orderDate, orderQuantity, orderList, orderAct)
             VALUES (?, ?, ?, ?)`,
            [formattedDate, item.cartQuantity, item.cartList, userEmail],
            () => {
              completed++;
              if (completed === cartData.length) {
                db.run(`DELETE FROM cart WHERE cartAct = ?`, [userEmail], () => {
                  db.close();
                  // Render success page with order summary instead of redirect to home
                  res.render('order_success', {
                    ...res.locals,
                    cart: cartData,
                    subtotal: subtotal.toFixed(2),
                    orderDate: formattedDate
                  });
                });
              }
            }
          );
        });
      });
    }
  );
});

// add to cart
router.post('/add', (req, res, next) => {
  const db = new sqlite3.Database('./storedb.sqlite');
  const { productId } = req.body;
  const userEmail = res.locals.currentUser ? res.locals.currentUser.email : null;

  if (!userEmail) {
    return res.redirect('/users/login');
  }

  db.get(
    `SELECT l.listQuantity AS availableStock,
            IFNULL(c.cartQuantity, 0) AS currentInCart
     FROM listings l
     LEFT JOIN cart c ON l.listNo = c.cartList AND c.cartAct = ?
     WHERE l.listNo = ?`,
    [userEmail, productId],
    (err, stockInfo) => {
      if (err) return next(err);

      if (stockInfo && stockInfo.currentInCart + 1 > stockInfo.availableStock) {
        db.close();
        return res.redirect('/cart');
      }

      if (stockInfo && stockInfo.currentInCart > 0) {
        db.run(
          `UPDATE cart SET cartQuantity = cartQuantity + 1 WHERE cartList = ? AND cartAct = ?`,
          [productId, userEmail]
        );
      } else {
        db.run(
          `INSERT INTO cart (cartQuantity, cartList, cartAct) VALUES (?, ?, ?)`,
          [1, productId, userEmail]
        );
      }

      db.close();
      res.redirect('/cart');
    }
  );
});

// update quantity
router.post('/update', (req, res, next) => {
  const db = new sqlite3.Database('./storedb.sqlite');
  const { productId, quantity } = req.body;
  const userEmail = res.locals.currentUser ? res.locals.currentUser.email : null;

  if (!userEmail) {
    return res.redirect('/users/login');
  }

  db.get(`SELECT listQuantity FROM listings WHERE listNo = ?`, [productId], (err, stock) => {
    if (err) return next(err);

    if (stock && parseInt(quantity) <= stock.listQuantity) {
      db.run(
        `UPDATE cart SET cartQuantity = ? WHERE cartList = ? AND cartAct = ?`,
        [quantity, productId, userEmail]
      );
    }

    db.close();
    res.redirect('/cart');
  });
});

// remove item
router.post('/remove', (req, res, next) => {
  const db = new sqlite3.Database('./storedb.sqlite');
  const { productId } = req.body;
  const userEmail = res.locals.currentUser ? res.locals.currentUser.email : null;

  if (!userEmail) {
    return res.redirect('/users/login');
  }

  db.run(`DELETE FROM cart WHERE cartList = ? AND cartAct = ?`,
    [productId, userEmail],
    () => {
      db.close();
      res.redirect('/cart');
    }
  );
});

module.exports = router;