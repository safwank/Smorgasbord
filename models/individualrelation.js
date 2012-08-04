// Initialization

var util = require('../common/util');
var csv = require('csv');
var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase(process.env.NEO4J_URL || 'http://localhost:7474');

// Constants

var INDEX_NAME = 'nodes';
var INDEX_KEY = 'type';
var INDEX_VAL = 'individualRelation';

// Private "constructors"

var IndividualRelation = module.exports = function IndividualRelation(_node) {
    this._node = _node;
};

// Pass-through IndividualRelation properties

util.proxyProperty(IndividualRelation, 'PersonId1', true);
util.proxyProperty(IndividualRelation, 'RelatedAs', true);
util.proxyProperty(IndividualRelation, 'PersonId2', true);

// Private functions

function loadIndividualRelation(data, index) {
  var individualRelation = data;
  util.removeNullOrEmptyPropertiesIn(individualRelation);
  IndividualRelation.create(individualRelation, handleCreated);
}

function handleSuccess(count) {
  console.log('Number of individual relations created: ' + count);
}

function handleLoadError(error) {
  console.log(error.message);
}

function handleCreated(error, data) {
  if (error) console.log(error.message);
  console.log('Created: ' + data);
}

// Public functions

IndividualRelation.loadFromCSV = function(csvFilePath) {
  csv().fromPath(csvFilePath, { columns: true, trim: true })
       .on('data', loadIndividualRelation)
       .on('end', handleSuccess)
       .on('error', handleLoadError);
};

IndividualRelation.create = function (data, callback) {
  var node = db.createNode(data);
  var individualRelation = new IndividualRelation(node);
    
  node.save(function (err) {
    if (err) return callback(err);
	
    node.index(INDEX_NAME, INDEX_KEY, INDEX_VAL, function (err) {
      if (err) return callback(err);
      callback(null, individualRelation);
    });
  });
};

IndividualRelation.getAll = function (callback) {
  db.getIndexedNodes(INDEX_NAME, INDEX_KEY, INDEX_VAL, function (err, nodes) {
    if (err) return callback(null, []);

    var individualRelations = nodes.map(function (node) {
        return new IndividualRelation(node);
    });
    
    callback(null, individualRelations);
  });
};