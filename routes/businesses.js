var Business = require('../models/business');

// GET /businesses
exports.list = function (req, res, next) {
    Business.getAll(function (err, businesses) {
        if (err) return next(err);
        res.render('businesses', {
            businesses: businesses
        });
    });
};
