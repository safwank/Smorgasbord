// Initialization

var util = require('../common/util');
var csv = require('csv');
var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase(process.env.NEO4J_URL || 'http://localhost:7474');

// Constants

var INDEX_NAME = 'nodes';
var INDEX_KEY = 'type';
var INDEX_VAL = 'partner';

// Private "constructors"

var Partner = module.exports = function Partner(_node) {
    this._node = _node;
};

// Pass-through Partner properties

util.proxyProperty(Partner, 'Id', true);
util.proxyProperty(Partner, 'Title', true);
util.proxyProperty(Partner, 'FirstName', true);
util.proxyProperty(Partner, 'LastName', true);
util.proxyProperty(Partner, 'DOB', true);
util.proxyProperty(Partner, 'Mobile', true);
util.proxyProperty(Partner, 'Email', true);
util.proxyProperty(Partner, 'Twitter', true);
util.proxyProperty(Partner, 'Notes', true);
util.proxyProperty(Partner, 'AddressLine1', true);
util.proxyProperty(Partner, 'AddressLine2', true);
util.proxyProperty(Partner, 'Postcode', true);
util.proxyProperty(Partner, 'City', true);
util.proxyProperty(Partner, 'State', true);
util.proxyProperty(Partner, 'Income', true);
util.proxyProperty(Partner, 'Type', true);

// Private functions

function loadPartner(data, index) {
  var partner = data;
  util.removeNullOrEmptyPropertiesIn(partner);
  Partner.create(partner, handleCreated);
}

function handleSuccess(count) {
  console.log('Number of partners created: ' + count);
}

function handleLoadError(error) {
  console.log(error.message);
}

function handleCreated(error, data) {
  if (error) console.log(error.message);
  console.log('Created: ' + data);
}

// Public functions

Partner.loadFromCSV = function(csvFilePath) {
  csv().fromPath(csvFilePath, { columns: true, trim: true })
       .on('data', loadPartner)
       .on('end', handleSuccess)
       .on('error', handleLoadError);
};

Partner.create = function (data, callback) {
  var node = db.createNode(data);
  var partner = new Partner(node);
    
  node.save(function (err) {
    if (err) return callback(err);
	
    node.index(INDEX_NAME, INDEX_KEY, INDEX_VAL, function (err) {
      if (err) return callback(err);
      callback(null, partner);
    });
  });
};

Partner.getAll = function (callback) {
  db.getIndexedNodes(INDEX_NAME, INDEX_KEY, INDEX_VAL, function (err, nodes) {
    if (err) return callback(null, []);

    var partners = nodes.map(function (node) {
        return new Partner(node);
    });
    
    callback(null, partners);
  });
};