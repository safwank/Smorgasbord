// Initialization

var util = require('../common/util');
var csv = require('csv');
var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase(process.env.NEO4J_URL || 'http://localhost:7474');

// Constants

var INDEX_NAME = 'nodes';
var INDEX_KEY = 'type';
var INDEX_VAL = 'financialYear';

// Private "constructors"

var FinancialYear = module.exports = function FinancialYear(_node) {
    this._node = _node;
};

// Pass-through FinancialYear properties

util.proxyProperty(FinancialYear, 'Id', true);
util.proxyProperty(FinancialYear, 'Year', true);

// Private functions

function loadFinancialYear(data, index) {
  var financialYear = data;
  util.removeNullOrEmptyPropertiesIn(financialYear);
  FinancialYear.create(financialYear, handleCreated);
}

function handleSuccess(count) {
  console.log('Number of financial years created: ' + count);
}

function handleLoadError(error) {
  console.log(error.message);
}

function handleCreated(error, data) {
  if (error) console.log(error.message);
  console.log('Created: ' + data);
}

// Public functions

FinancialYear.loadFromCSV = function() {
  csv().fromPath('data/FinancialYear.csv', { columns: true, trim: true })
       .on('data', loadFinancialYear)
       .on('end', handleSuccess)
       .on('error', handleLoadError);
};

FinancialYear.create = function (data, callback) {
  var node = db.createNode(data);
  var financialYear = new FinancialYear(node);
    
  node.save(function (err) {
    if (err) return callback(err);
	
    node.index(INDEX_NAME, INDEX_KEY, INDEX_VAL, function (err) {
      if (err) return callback(err);
      callback(null, financialYear);
    });
  });
};

FinancialYear.getAll = function (callback) {
  db.getIndexedNodes(INDEX_NAME, INDEX_KEY, INDEX_VAL, function (err, nodes) {
    if (err) return callback(null, []);
    
    var financialYears = nodes.map(function (node) {
        return new FinancialYear(node);
    });
    
    callback(null, financialYears);
  });
};