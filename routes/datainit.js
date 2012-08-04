var Business = require('../models/business'),
    BusinessTaxReturn = require('../models/businesstaxreturn'),
    Partner = require('../models/partner'),
    Employee = require('../models/employee'),
    Individual = require('../models/individual'),
    IndividualRelation = require('../models/individualrelation'),
    IndividualStock = require('../models/individualstock'),
    IndividualTaxReturn = require('../models/individualtaxreturn'),
    Stock = require('../models/stock'),
    Referral = require('../models/referral'),
    FinancialYear = require('../models/financialyear'),
    Relation = require('../models/relation');
var path = require('path');

var DATA_DIR = 'data';

// GET /datainit/business
exports.loadBusiness = function (req, res, next) {
    var csvFilePath = path.join(DATA_DIR, 'Business.csv');
    Business.loadFromCSV(csvFilePath);
    res.redirect('/businesses');
};

// GET /datainit/businesstaxreturn
exports.loadBusinessTaxReturn = function (req, res, next) {
    var csvFilePath = path.join(DATA_DIR, 'Business_TaxRecord.csv');
    BusinessTaxReturn.loadFromCSV(csvFilePath);
    res.redirect('/businesstaxreturns');
};

// GET /datainit/partner
exports.loadPartner = function (req, res, next) {
    var csvFilePath = path.join(DATA_DIR, 'Partner.csv');
    Partner.loadFromCSV(csvFilePath);
    res.redirect('/partners');
};

// GET /datainit/employee
exports.loadEmployee = function (req, res, next) {
    var csvFilePath = path.join(DATA_DIR, 'Employee.csv');
    Employee.loadFromCSV(csvFilePath);
    res.redirect('/employees');
};

// GET /datainit/individual
exports.loadIndividual = function (req, res, next) {
    var csvFilePath = path.join(DATA_DIR, 'Individual.csv');
    Individual.loadFromCSV(csvFilePath);
    res.redirect('/individuals');
};

// GET /datainit/individualrelation
exports.loadIndividualRelation = function (req, res, next) {
    var csvFilePath = path.join(DATA_DIR, 'Individual_Relation.csv');
    IndividualRelation.loadFromCSV(csvFilePath);
    res.redirect('/individualrelations');
};

// GET /datainit/individualstock
exports.loadIndividualStock = function (req, res, next) {
    var csvFilePath = path.join(DATA_DIR, 'Individual_Stock.csv');
    IndividualStock.loadFromCSV(csvFilePath);
    res.redirect('/individualstocks');
};

// GET /datainit/individualtaxreturn
exports.loadIndividualTaxReturn = function (req, res, next) {
    var csvFilePath = path.join(DATA_DIR, 'Individual_TaxRecord.csv');
    IndividualTaxReturn.loadFromCSV(csvFilePath);
    res.redirect('/individualtaxreturns');
};

// GET /datainit/stock
exports.loadStock = function (req, res, next) {
    var csvFilePath = path.join(DATA_DIR, 'Stock.csv');
    Stock.loadFromCSV(csvFilePath);
    res.redirect('/stocks');
};

// GET /datainit/referral
exports.loadReferral = function (req, res, next) {
    var csvFilePath = path.join(DATA_DIR, 'Referral.csv');
    Referral.loadFromCSV(csvFilePath);
    res.redirect('/referrals');
};

// GET /datainit/financialyear
exports.loadFinancialYear = function (req, res, next) {
    var csvFilePath = path.join(DATA_DIR, 'FinancialYear.csv');
    FinancialYear.loadFromCSV(csvFilePath);
    res.redirect('/financialyears');
};

// GET /datainit/relation
exports.loadRelation = function (req, res, next) {
    var csvFilePath = path.join(DATA_DIR, 'Relation.csv');
    Relation.loadFromCSV(csvFilePath);
    res.redirect('/relations');
};