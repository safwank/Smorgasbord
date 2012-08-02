var FinancialYear = require('../models/financialyear');

// GET /financialyears
exports.list = function (req, res, next) {
    FinancialYear.getAll(function (err, financialYears) {
        if (err) return next(err);
        res.render('financialyears', {
            financialYears: financialYears
        });
    });
};
