var Business = require('../models/business');
var Partner = require('../models/partner');
var Employee = require('../models/employee');
var Individual = require('../models/individual');
var Stock = require('../models/stock');
var Referral = require('../models/referral');

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

// GET /datainit/employee
exports.loadEmployee = function (req, res, next) {
    Employee.loadFromCSV();
    res.redirect('/employees');
};

// GET /datainit/individual
exports.loadIndividual = function (req, res, next) {
    Individual.loadFromCSV();
    res.redirect('/individuals');
};

// GET /datainit/stock
exports.loadStock = function (req, res, next) {
    Stock.loadFromCSV();
    res.redirect('/stocks');
};

// GET /datainit/referral
exports.loadReferral = function (req, res, next) {
    Referral.loadFromCSV();
    res.redirect('/referrals');
};