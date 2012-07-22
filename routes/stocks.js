var Stock = require('../models/stock');

// GET /stocks
exports.list = function (req, res, next) {
    Stock.getAll(function (err, stocks) {
        if (err) return next(err);
        res.render('stocks', {
            stocks: stocks
        });
    });
};
