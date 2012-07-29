var BusinessTaxReturn = require('../models/businesstaxreturn');

// GET /businesstaxreturns
exports.list = function (req, res, next) {
    BusinessTaxReturn.getAll(function (err, businessTaxReturns) {
        if (err) return next(err);
        res.render('businesstaxreturns', {
            businessTaxReturns: businessTaxReturns
        });
    });
};
