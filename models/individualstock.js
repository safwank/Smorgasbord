// Initialization

var util = require('../common/util'),
    redisUtil = require('../common/redisutil'),
    csv = require('csv'),
    neo4j = require('neo4j'),
    db = new neo4j.GraphDatabase(process.env.NEO4J_URL || 'http://localhost:7474');

// Constants

var INDEX_NAME = 'nodes';
var INDEX_KEY = 'type';
var INDEX_VAL = 'individualStock';

// Private "constructors"

var IndividualStock = module.exports = function IndividualStock(_node) {
    this._node = _node;
};

// Pass-through IndividualStock properties

util.proxyProperty(IndividualStock, 'PersonId', true);
util.proxyProperty(IndividualStock, 'StockId', true);
util.proxyProperty(IndividualStock, 'Quantity', true);

// Private functions

function loadIndividualStock(data, index) {
  var individualStock = data;
  util.removeNullOrEmptyPropertiesIn(individualStock);
  IndividualStock.create(individualStock, handleCreated);
}

function handleSuccess(count) {
  console.log('Number of individual stocks created: ' + count);
  redisUtil.incrementTotalNodesBy(count);
}

function handleLoadError(error) {
  console.log(error.message);
}

function handleCreated(error, data) {
  if (error) console.log(error.message);
  
  console.log('Created: ' + data);
  redisUtil.decrementTotalNodes();
}

// Public functions

IndividualStock.loadFromCSV = function(csvFilePath) {
  csv().fromPath(csvFilePath, { columns: true, trim: true })
       .on('data', loadIndividualStock)
       .on('end', handleSuccess)
       .on('error', handleLoadError);
};

IndividualStock.create = function (data, callback) {
  var node = db.createNode(data);
  var individualStock = new IndividualStock(node);
    
  node.save(function (err) {
    if (err) return callback(err);
	
    node.index(INDEX_NAME, INDEX_KEY, INDEX_VAL, function (err) {
      if (err) return callback(err);
      callback(null, individualStock);
    });
  });
};

IndividualStock.getAll = function (callback) {
  db.getIndexedNodes(INDEX_NAME, INDEX_KEY, INDEX_VAL, function (err, nodes) {
    if (err) return callback(null, []);

    var individualStocks = nodes.map(function (node) {
        return new IndividualStock(node);
    });
    
    callback(null, individualStocks);
  });
};