// Initialization

var util = require('../common/util');
var csv = require('csv');
var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase(process.env.NEO4J_URL || 'http://localhost:7474');

// Constants

var INDEX_NAME = 'nodes';
var INDEX_KEY = 'type';
var INDEX_VAL = 'stock';

// Private "constructors"

var Stock = module.exports = function Stock(_node) {
    this._node = _node;
};

// Pass-through Stock properties

util.proxyProperty(Stock, 'Id', true);
util.proxyProperty(Stock, 'Code', true);
util.proxyProperty(Stock, 'Name', true);
util.proxyProperty(Stock, 'BaseValue', true);

// Private functions

function loadStock(data, index) {
  var stock = data;
  util.removeNullOrEmptyPropertiesIn(stock);
  Stock.create(stock, handleCreated);
}

function handleSuccess(count) {
  console.log('Number of stocks created: ' + count);
}

function handleLoadError(error) {
  console.log(error.message);
}

function handleCreated(error, data) {
  if (error) console.log(error.message);
  console.log('Created: ' + data);
}

// Public functions

Stock.loadFromCSV = function(csvFilePath) {
  csv().fromPath(csvFilePath, { columns: true, trim: true })
       .on('data', loadStock)
       .on('end', handleSuccess)
       .on('error', handleLoadError);
};

Stock.create = function (data, callback) {
  var node = db.createNode(data);
  var stock = new Stock(node);
    
  node.save(function (err) {
    if (err) return callback(err);
	
    node.index(INDEX_NAME, INDEX_KEY, INDEX_VAL, function (err) {
      if (err) return callback(err);
      callback(null, stock);
    });
  });
};

Stock.getAll = function (callback) {
  db.getIndexedNodes(INDEX_NAME, INDEX_KEY, INDEX_VAL, function (err, nodes) {
    if (err) return callback(null, []);

    var stocks = nodes.map(function (node) {
        return new Stock(node);
    });
    
    callback(null, stocks);
  });
};