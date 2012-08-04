// Initialization

var util = require('../common/util');
var csv = require('csv');
var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase(process.env.NEO4J_URL || 'http://localhost:7474');

// Constants

var INDEX_NAME = 'nodes';
var INDEX_KEY = 'type';
var INDEX_VAL = 'referral';

// Private "constructors"

var Referral = module.exports = function Referral(_node) {
    this._node = _node;
};

// Pass-through Referral properties

util.proxyProperty(Referral, 'Id', true);
util.proxyProperty(Referral, 'Type', true);
util.proxyProperty(Referral, 'Value', true);

// Private functions

function loadReferral(data, index) {
  var referral = data;
  util.removeNullOrEmptyPropertiesIn(referral);
  Referral.create(referral, handleCreated);
}

function handleSuccess(count) {
  console.log('Number of referrals created: ' + count);
}

function handleLoadError(error) {
  console.log(error.message);
}

function handleCreated(error, data) {
  if (error) console.log(error.message);
  console.log('Created: ' + data);
}

// Public functions

Referral.loadFromCSV = function(csvFilePath) {
  csv().fromPath(csvFilePath, { columns: true, trim: true })
       .on('data', loadReferral)
       .on('end', handleSuccess)
       .on('error', handleLoadError);
};

Referral.create = function (data, callback) {
  var node = db.createNode(data);
  var referral = new Referral(node);
    
  node.save(function (err) {
    if (err) return callback(err);
	
    node.index(INDEX_NAME, INDEX_KEY, INDEX_VAL, function (err) {
      if (err) return callback(err);
      callback(null, referral);
    });
  });
};

Referral.getAll = function (callback) {
  db.getIndexedNodes(INDEX_NAME, INDEX_KEY, INDEX_VAL, function (err, nodes) {
    if (err) return callback(null, []);

    var referrals = nodes.map(function (node) {
        return new Referral(node);
    });
    
    callback(null, referrals);
  });
};