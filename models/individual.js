// Initialization

var util = require('../common/util');
var csv = require('csv');
var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase(process.env.NEO4J_URL || 'http://localhost:7474');

// Constants

var INDEX_NAME = 'nodes';
var INDEX_KEY = 'type';
var INDEX_VAL = 'individual';

// Private "constructors"

var Individual = module.exports = function Individual(_node) {
    this._node = _node;
};

// Pass-through Individual properties

util.proxyProperty(Individual, 'Id', true);
util.proxyProperty(Individual, 'ReportTo', true);
util.proxyProperty(Individual, 'Title', true);
util.proxyProperty(Individual, 'FirstName', true);
util.proxyProperty(Individual, 'LastName', true);
util.proxyProperty(Individual, 'DOB', true);
util.proxyProperty(Individual, 'Mobile', true);
util.proxyProperty(Individual, 'Email', true);
util.proxyProperty(Individual, 'Twitter', true);
util.proxyProperty(Individual, 'Notes', true);
util.proxyProperty(Individual, 'AddressLine1', true);
util.proxyProperty(Individual, 'AddressLine2', true);
util.proxyProperty(Individual, 'Postcode', true);
util.proxyProperty(Individual, 'City', true);
util.proxyProperty(Individual, 'State', true);
util.proxyProperty(Individual, 'Income', true);

// Private functions

function loadIndividual(data, index) {
  var individual = data;
  util.removeNullOrEmptyPropertiesIn(individual);
  Individual.create(individual, handleCreated);
}

function handleSuccess(count) {
  console.log('Number of individuals created: ' + count);
}

function handleLoadError(error) {
  console.log(error.message);
}

function handleCreated(error, data) {
  if (error) console.log(error.message);
  console.log('Created: ' + data);
}

// Public functions

Individual.loadFromCSV = function(csvFilePath) {
  csv().fromPath(csvFilePath, { columns: true, trim: true })
       .on('data', loadIndividual)
       .on('end', handleSuccess)
       .on('error', handleLoadError);
};

Individual.create = function (data, callback) {
  var node = db.createNode(data);
  var individual = new Individual(node);
    
  node.save(function (err) {
    if (err) return callback(err);
	
    node.index(INDEX_NAME, INDEX_KEY, INDEX_VAL, function (err) {
      if (err) return callback(err);
      callback(null, individual);
    });
  });
};

Individual.getAll = function (callback) {
  db.getIndexedNodes(INDEX_NAME, INDEX_KEY, INDEX_VAL, function (err, nodes) {
    if (err) return callback(null, []);

    var individuals = nodes.map(function (node) {
        return new Individual(node);
    });
    
    callback(null, individuals);
  });
};