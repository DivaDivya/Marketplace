var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3').verbose();

// product list
router.get('/products', function(req, res) {
  const user = req.cookies.user;

  if (!user || !user.email || user.type !== 'seller') {
    return res.status(403).send('Forbidden - Seller access only');
  }

  const db = new sqlite3.Database('./storedb.sqlite');

  db.all(
    'SELECT * FROM listings WHERE listSeller = ?',
    [user.email],
    (err, listings) => {
      db.close();

      if (err) return res.status(500).send(err.message);

      res.render('edit_item', { ...res.locals, products: listings });
    }
  );
});

// delete product
router.post('/products/:id/delete', function(req, res) {
  const user = req.cookies.user;

  if (!user || !user.email || user.type !== 'seller') {
    return res.status(403).send('Forbidden - Seller access only');
  }

  const productId = parseInt(req.params.id, 10);
  const db = new sqlite3.Database('./storedb.sqlite');

  db.get(
    'SELECT * FROM listings WHERE listNo = ? AND listSeller = ?',
    [productId, user.email],
    (err, product) => {
      if (!product) {
        db.close();
        return res.status(404).render('error', {
          message: 'Seller product not found',
          error: { status: 404, stack: '' }
        });
      }

      db.run('DELETE FROM listings WHERE listNo = ?', [productId], function(err) {
        db.close();

        if (err) return res.status(500).send(err.message);

        res.redirect('/seller/products');
      });
    }
  );
});

// seller orders
router.get('/orders', function(req, res) {
  const user = req.cookies.user;

  if (!user || !user.email || user.type !== 'seller') {
    return res.status(403).send('Forbidden - Seller access only');
  }

  const db = new sqlite3.Database('./storedb.sqlite');

  db.all(
    `SELECT 
      o.rowid as orderId,
      l.listName as productName,
      a.actFname || ' ' || a.actLname as customerName,
      o.orderQuantity as quantity,
      o.orderDate as date
     FROM orders o
     JOIN listings l ON o.orderList = l.listNo
     JOIN accounts a ON o.orderAct = a.actEmail
     WHERE l.listSeller = ?
     ORDER BY o.orderDate DESC`,
    [user.email],
    (err, sellerOrders) => {
      db.close();

      if (err) return res.status(500).send(err.message);

      res.render('order_history', { sellerOrders });
    }
  );
});

// show edit form
router.get('/products/:id/edit', function(req, res) {
  const user = req.cookies.user;

  if (!user || !user.email || user.type !== 'seller') {
    return res.status(403).send('Forbidden - Seller access only');
  }

  const productId = parseInt(req.params.id, 10);
  const db = new sqlite3.Database('./storedb.sqlite');

  db.get(
    'SELECT * FROM listings WHERE listNo = ? AND listSeller = ?',
    [productId, user.email],
    (err, product) => {
      db.close();

      if (!product) {
        return res.status(404).render('error', {
          message: 'Product not found',
          error: { status: 404, stack: '' }
        });
      }

      res.render('edit_item', { product, error: null });
    }
  );
});

// update listing
router.post('/products/:id/edit', function(req, res) {
  const user = req.cookies.user;

  if (!user || !user.email || user.type !== 'seller') {
    return res.status(403).send('Forbidden - Seller access only');
  }

  const productId = parseInt(req.params.id, 10);
  const { name, price, desc, quantity, image } = req.body;

  if (!name || !price || !desc || !quantity) {
    const db = new sqlite3.Database('./storedb.sqlite');

    db.get('SELECT * FROM listings WHERE listNo = ?', [productId], (err, product) => {
      db.close();

      return res.render('edit_item', {
        product,
        error: 'All product fields are required.'
      });
    });

    return;
  }

  const db = new sqlite3.Database('./storedb.sqlite');

  db.get(
    'SELECT * FROM listings WHERE listNo = ? AND listSeller = ?',
    [productId, user.email],
    (err, product) => {
      if (!product) {
        db.close();
        return res.status(404).render('error', {
          message: 'Product not found',
          error: { status: 404 }
        });
      }

      db.get(
        'SELECT * FROM listings WHERE listSeller = ? AND LOWER(listName) = LOWER(?) AND listNo != ?',
        [user.email, name, productId],
        (err, duplicate) => {
          if (duplicate) {
            db.close();
            return res.render('edit_item', {
              product: { ...product, listName: name },
              error: 'Duplicate product name'
            });
          }

          const listImage = image ? "/images/" + image : product.listImage;

          db.run(
            `UPDATE listings 
             SET listName = ?, listPrice = ?, listDesc = ?, listQuantity = ?, listImage = ?
             WHERE listNo = ?`,
            [name, parseFloat(price), desc, parseInt(quantity), listImage, productId],
            function(err) {
              db.close();

              if (err) return res.status(500).send(err.message);

              res.redirect('/seller/products');
            }
          );
        }
      );
    }
  );
});

module.exports = router;