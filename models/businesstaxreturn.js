// Initialization

var util = require('../common/util');
var csv = require('csv');
var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase(process.env.NEO4J_URL || 'http://localhost:7474');

// Constants

var INDEX_NAME = 'nodes';
var INDEX_KEY = 'type';
var INDEX_VAL = 'businessTaxReturn';

// Private "constructors"

var BusinessTaxReturn = module.exports = function BusinessTaxReturn(_node) {
    this._node = _node;
};

// Pass-through BusinessTaxReturn properties

util.proxyProperty(BusinessTaxReturn, 'BusinessId', true);
util.proxyProperty(BusinessTaxReturn, 'FinancialYearId', true);
util.proxyProperty(BusinessTaxReturn, 'Revenue', true);
util.proxyProperty(BusinessTaxReturn, 'TaxPayable', true);

// Private functions

function loadBusinessTaxReturn(data, index) {
  var businesstaxreturn = data;
  util.removeNullOrEmptyPropertiesIn(businesstaxreturn);
  BusinessTaxReturn.create(businesstaxreturn, handleCreated);
}

function handleSuccess(count) {
  console.log('Number of business tax returns created: ' + count);
}

function handleLoadError(error) {
  console.log(error.message);
}

function handleCreated(error, data) {
  if (error) console.log(error.message);
  console.log('Created: ' + data);
}

// Public functions

BusinessTaxReturn.loadFromCSV = function(csvFilePath) {
  csv().fromPath(csvFilePath, { columns: true, trim: true })
       .on('data', loadBusinessTaxReturn)
       .on('end', handleSuccess)
       .on('error', handleLoadError);
};

BusinessTaxReturn.create = function (data, callback) {
  var node = db.createNode(data);
  var businessTaxReturn = new BusinessTaxReturn(node);
    
  node.save(function (err) {
    if (err) return callback(err);
	
    node.index(INDEX_NAME, INDEX_KEY, INDEX_VAL, function (err) {
      if (err) return callback(err);
      callback(null, businessTaxReturn);
    });
  });
};

BusinessTaxReturn.getAll = function (callback) {
  db.getIndexedNodes(INDEX_NAME, INDEX_KEY, INDEX_VAL, function (err, nodes) {
    if (err) return callback(null, []);
    
    var businessTaxReturns = nodes.map(function (node) {
        return new BusinessTaxReturn(node);
    });
    
    callback(null, businessTaxReturns);
  });
};