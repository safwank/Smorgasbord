var IndividualTaxReturn = require('../models/individualtaxreturn');

// GET /individualtaxreturns
exports.list = function (req, res, next) {
    IndividualTaxReturn.getAll(function (err, individualTaxReturns) {
        if (err) return next(err);
        res.render('individualtaxreturns', {
            individualTaxReturns: individualTaxReturns
        });
    });
};
