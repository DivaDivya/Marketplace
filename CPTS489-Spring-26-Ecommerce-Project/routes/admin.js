var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3').verbose();

// View all users
router.get('/users', function(req, res, next) {
  const user = req.cookies.user;

  if (!user || !user.email || user.type !== 'admin') {
    return res.status(403).send('Forbidden - Admin access only');
  }

  const db = new sqlite3.Database('./storedb.sqlite');

  db.all('SELECT * FROM accounts', [], (err, users) => {
    db.close();

    if (err) return next(err);

    res.render('UC-013', { users });
  });
});

// Delete user
router.post('/users/:email/delete', function(req, res, next) {
  const user = req.cookies.user;

  if (!user || !user.email || user.type !== 'admin') {
    return res.status(403).send('Forbidden - Admin access only');
  }

  const userEmail = req.params.email;
  const db = new sqlite3.Database('./storedb.sqlite');

  db.get('SELECT * FROM accounts WHERE actEmail = ?', [userEmail], (err, targetUser) => {
    if (err) return next(err);

    if (!targetUser) {
      db.close();
      return res.status(404).render('error', {
        message: 'User not found',
        error: { status: 404 }
      });
    }

    if (targetUser.actType === 'admin') {
      db.close();
      return res.status(400).render('error', {
        message: 'Admins cannot delete other admin accounts.',
        error: { status: 400 }
      });
    }

    // Delete related data in sequence
    db.run('DELETE FROM reviews WHERE revAct = ?', [userEmail]);
    db.run('DELETE FROM orders WHERE orderAct = ?', [userEmail]);

    db.run(`DELETE FROM orders WHERE orderList IN 
      (SELECT listNo FROM listings WHERE listSeller = ?)`, [userEmail]);

    db.run(`DELETE FROM reviews WHERE revList IN 
      (SELECT listNo FROM listings WHERE listSeller = ?)`, [userEmail]);

    db.run('DELETE FROM listings WHERE listSeller = ?', [userEmail]);

    db.run('DELETE FROM accounts WHERE actEmail = ?', [userEmail], function(err) {
      db.close();

      if (err) return next(err);

      res.redirect('/admin/users');
    });
  });
});

// Analytics
router.get('/analytics', function(req, res, next) {
  const user = req.cookies.user;

  if (!user || !user.email || user.type !== 'admin') {
    return res.status(403).send('Forbidden - Admin access only');
  }

  const db = new sqlite3.Database('./storedb.sqlite');

  db.get('SELECT COUNT(*) as count FROM accounts', [], (err, usersRow) => {
    if (err) return next(err);

    db.get('SELECT COUNT(*) as count FROM listings', [], (err, productsRow) => {
      if (err) return next(err);

      db.get('SELECT COUNT(*) as count FROM orders', [], (err, ordersRow) => {
        if (err) return next(err);

        db.get(
          `SELECT SUM(o.orderQuantity * l.listPrice) as revenue
           FROM orders o
           JOIN listings l ON o.orderList = l.listNo`,
          [],
          (err, revenueResult) => {
            if (err) return next(err);

            db.all(
              `SELECT 
                a.actFname || ' ' || a.actLname as sellerName,
                COUNT(*) as orderCount
               FROM orders o
               JOIN listings l ON o.orderList = l.listNo
               JOIN accounts a ON l.listSeller = a.actEmail
               GROUP BY l.listSeller
               ORDER BY orderCount DESC
               LIMIT 7`,
              [],
              (err, topSellers) => {
                db.close();

                if (err) return next(err);

                const maxOrders =
                  topSellers.length > 0
                    ? Math.max(...topSellers.map(s => s.orderCount))
                    : 1;

                res.render('UC-014', {
                  stats: {
                    totalUsers: usersRow.count,
                    totalProducts: productsRow.count,
                    totalOrders: ordersRow.count,
                    totalRevenue: (revenueResult.revenue || 0).toFixed(2)
                  },
                  topSellers,
                  maxOrders
                });
              }
            );
          }
        );
      });
    });
  });
});

// View reviews
router.get('/reviews', function(req, res, next) {
  const user = req.cookies.user;

  if (!user || !user.email || user.type !== 'admin') {
    return res.status(403).send('Forbidden - Admin access only');
  }

  const db = new sqlite3.Database('./storedb.sqlite');

  db.all(
    `SELECT 
      r.rowid as id,
      r.revRating as rating,
      r.revTitle as title,
      r.revDesc as desc,
      l.listName as productName,
      a.actFname || ' ' || a.actLname as userName
     FROM reviews r
     LEFT JOIN listings l ON r.revList = l.listNo
     LEFT JOIN accounts a ON r.revAct = a.actEmail`,
    [],
    (err, reviewData) => {
      db.close();

      if (err) return next(err);

      res.render('UC-015', { reviews: reviewData });
    }
  );
});

// Delete review
router.post('/reviews/:id/delete', function(req, res, next) {
  const user = req.cookies.user;

  if (!user || !user.email || user.type !== 'admin') {
    return res.status(403).send('Forbidden - Admin access only');
  }

  const reviewId = parseInt(req.params.id, 10);
  const db = new sqlite3.Database('./storedb.sqlite');

  db.run('DELETE FROM reviews WHERE rowid = ?', [reviewId], function(err) {
    db.close();

    if (err) return next(err);

    res.redirect('/admin/reviews');
  });
});

module.exports = router;