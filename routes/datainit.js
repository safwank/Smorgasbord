var Business = require('../models/business');
var Partner = require('../models/partner');

// GET /datainit/business
exports.loadBusiness = function (req, res, next) {
    Business.loadFromCSV();
    res.redirect('/businesses');
};

// GET /datainit/partner
exports.loadPartner = function (req, res, next) {
    Partner.loadFromCSV();
    res.redirect('/partners');
};

