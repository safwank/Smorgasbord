var IndividualStock = require('../models/individualstock');

// GET /individualstocks
exports.list = function (req, res, next) {
    IndividualStock.getAll(function (err, individualStocks) {
        if (err) return next(err);
        res.render('individualstocks', {
            individualStocks: individualStocks
        });
    });
};
