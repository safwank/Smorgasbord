// Initialization
var sys = require('sys'),
  util = require('../common/util'),
  redisUtil = require('../common/redisutil'),
  csv = require('csv'),
  neo4j = require('neo4j'),
  db = new neo4j.GraphDatabase(process.env.NEO4J_URL || 'http://localhost:7474');

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
Individual.loadFromCSV = function(csvFilePath) {
  csv().fromPath(csvFilePath, {
    columns: true,
    trim: true
  }).on('data', loadIndividual).on('end', handleSuccess).on('error', handleLoadError);
};

Individual.create = function(data, callback) {
  var node = db.createNode(data);
  var individual = new Individual(node);

  node.save(function(err) {
    if (err) return callback(err);

    node.index(INDEX_NAME, INDEX_KEY, INDEX_VAL, function(err) {
      if (err) return callback(err);
      callback(null, individual);
    });
  });
};

Individual.getAll = function(callback) {
  db.getIndexedNodes(INDEX_NAME, INDEX_KEY, INDEX_VAL, function(err, nodes) {
    if (err) return callback(null, []);

    var individuals = nodes.map(function(node) {
      return new Individual(node);
    });

    callback(null, individuals);
  });
};

Individual.getById = function(id, callback) {
  var query = [
    'START person=node:INDEX_NAME(INDEX_KEY="INDEX_VAL")',
    'WHERE person.Id="PERSON_ID"',
    'RETURN person',
    'LIMIT 1'
  ].join('\n')
    .replace('INDEX_NAME', INDEX_NAME)
    .replace('INDEX_KEY', INDEX_KEY)
    .replace('INDEX_VAL', INDEX_VAL)
    .replace('PERSON_ID', id);

  var params = { personId: id };

  db.query(query, params, function(err, results) {
    if (err) return callback(err);

    var person = results[0] && results[0]['person'];
    callback(null, new Individual(person));
  });
};

Individual.relateTwoIndividuals = function(personId1, personId2, relationshipType, callback) {
  /*
  var query = [
    'START person1=node:INDEX_NAME(INDEX_KEY="INDEX_VAL"), person2=node:INDEX_NAME(INDEX_KEY="INDEX_VAL")', 
    'RELATE person1-[r:IS_RELATED_TO {type:"{relationshipType}"}]->person2', 
    'WHERE (person1.Id="{personId1}" AND person2.Id="{personId2}")'
    'RETURN relationship'
  ].join('\n')
    .replace('INDEX_NAME', INDEX_NAME)
    .replace('INDEX_KEY', INDEX_KEY)
    .replace('INDEX_VAL', INDEX_VAL);

  var params = {
    personId1: personId1,
    personId2: personId2,
    relationshipType: relationshipType
  };

  db.query(query, params, function(err, results) {
    if (err) return callback(err);

    var relationship = results[0] && results[0]['relationship'];
    callback(null, relationship);
  });*/

  Individual.getById(personId1, function(error, person1) {
    Individual.getById(personId2, function(error, person2) {
      person1._node.createRelationshipTo(person2._node, 'IS_RELATED_TO', { type: relationshipType }, function (error, relationship) {
        callback(error, relationship);
      });
    });
  });
};

Individual.relateIndividualWithStock = function(personId, stock, quantity, callback) {
  Individual.getById(personId, function(error, person) {
    person._node.createRelationshipTo(stock._node, 'OWNS', { quantity: quantity }, function (error, relationship) {
      callback(error, relationship);
    });
  });
};