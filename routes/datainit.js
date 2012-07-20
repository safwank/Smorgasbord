var Business = require('../models/business');

// GET /datainit/business
exports.loadBusiness = function (req, res, next) {
    Business.loadFromCSV();
    res.redirect('/businesses');
};
