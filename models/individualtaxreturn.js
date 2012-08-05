// Initialization

var util = require('../common/util'),
    redisUtil = require('../common/redisutil'),
    csv = require('csv'),
    neo4j = require('neo4j'),
    db = new neo4j.GraphDatabase(process.env.NEO4J_URL || 'http://localhost:7474');

// Constants

var INDEX_NAME = 'nodes';
var INDEX_KEY = 'type';
var INDEX_VAL = 'individualTaxReturn';

// Private "constructors"

var IndividualTaxReturn = module.exports = function IndividualTaxReturn(_node) {
    this._node = _node;
};

// Pass-through IndividualTaxReturn properties

util.proxyProperty(IndividualTaxReturn, 'PersonId', true);
util.proxyProperty(IndividualTaxReturn, 'FinancialYearId', true);
util.proxyProperty(IndividualTaxReturn, 'Income', true);
util.proxyProperty(IndividualTaxReturn, 'TaxPayable', true);

// Private functions

function loadIndividualTaxReturn(data, index) {
  var individualTaxReturn = data;
  util.removeNullOrEmptyPropertiesIn(individualTaxReturn);
  IndividualTaxReturn.create(individualTaxReturn, handleCreated);
}

function handleSuccess(count) {
  console.log('Number of individual tax returns created: ' + count);
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

IndividualTaxReturn.loadFromCSV = function(csvFilePath) {
  csv().fromPath(csvFilePath, { columns: true, trim: true })
       .on('data', loadIndividualTaxReturn)
       .on('end', handleSuccess)
       .on('error', handleLoadError);
};

IndividualTaxReturn.create = function (data, callback) {
  var node = db.createNode(data);
  var individualTaxReturn = new IndividualTaxReturn(node);
    
  node.save(function (err) {
    if (err) return callback(err);
	
    node.index(INDEX_NAME, INDEX_KEY, INDEX_VAL, function (err) {
      if (err) return callback(err);
      callback(null, individualTaxReturn);
    });
  });
};

IndividualTaxReturn.getAll = function (callback) {
  db.getIndexedNodes(INDEX_NAME, INDEX_KEY, INDEX_VAL, function (err, nodes) {
    if (err) return callback(null, []);

    var individualTaxReturns = nodes.map(function (node) {
        return new IndividualTaxReturn(node);
    });
    
    callback(null, individualTaxReturns);
  });
};