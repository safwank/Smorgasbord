// Initialization

var util = require('../common/util'),
    redisUtil = require('../common/redisutil'),
    csv = require('csv'),
    neo4j = require('neo4j'),
    db = new neo4j.GraphDatabase(process.env.NEO4J_URL || 'http://localhost:7474');

// Constants

var INDEX_NAME = 'nodes';
var INDEX_KEY = 'type';
var INDEX_VAL = 'relation';

// Private "constructors"

var Relation = module.exports = function Relation(_node) {
    this._node = _node;
};

// Pass-through Relation properties

util.proxyProperty(Relation, 'Id', true);
util.proxyProperty(Relation, 'Type', true);

// Private functions

function loadRelation(data, index) {
  var relation = data;
  util.removeNullOrEmptyPropertiesIn(relation);
  Relation.create(relation, handleCreated);
}

function handleSuccess(count) {
  console.log('Number of relations created: ' + count);
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

Relation.loadFromCSV = function(csvFilePath) {
  csv().fromPath(csvFilePath, { columns: true, trim: true })
       .on('data', loadRelation)
       .on('end', handleSuccess)
       .on('error', handleLoadError);
};

Relation.create = function (data, callback) {
  var node = db.createNode(data);
  var relation = new Relation(node);
    
  node.save(function (err) {
    if (err) return callback(err);
	
    node.index(INDEX_NAME, INDEX_KEY, INDEX_VAL, function (err) {
      if (err) return callback(err);
      callback(null, relation);
    });
  });
};

Relation.getAll = function (callback) {
  db.getIndexedNodes(INDEX_NAME, INDEX_KEY, INDEX_VAL, function (err, nodes) {
    if (err) return callback(null, []);

    var relations = nodes.map(function (node) {
        return new Relation(node);
    });
    
    callback(null, relations);
  });
};