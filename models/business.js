// Initialization

var util = require('../common/util'),
    redisUtil = require('../common/redisutil'),
    csv = require('csv'),
    neo4j = require('neo4j'),
    db = new neo4j.GraphDatabase(process.env.NEO4J_URL || 'http://localhost:7474');

// Constants

var INDEX_NAME = 'nodes';
var INDEX_KEY = 'type';
var INDEX_VAL = 'business';

// Private "constructors"

var Business = module.exports = function Business(_node) {
    this._node = _node;
};

// Pass-through Business properties

util.proxyProperty(Business, 'Id', true);
util.proxyProperty(Business, 'ManagedBy', true);
util.proxyProperty(Business, 'Name', true);
util.proxyProperty(Business, 'ACN', true);
util.proxyProperty(Business, 'Phone', true);
util.proxyProperty(Business, 'Website', true);
util.proxyProperty(Business, 'AddressLine1', true);
util.proxyProperty(Business, 'AddressLine2', true);
util.proxyProperty(Business, 'Postcode', true);
util.proxyProperty(Business, 'City', true);
util.proxyProperty(Business, 'State', true);
util.proxyProperty(Business, 'Type', true);
util.proxyProperty(Business, 'Reserves', true);

// Private functions

function loadBusiness(data, index) {
  var business = data;
  util.removeNullOrEmptyPropertiesIn(business);
  Business.create(business, handleCreated);
}

function handleSuccess(count) {
  console.log('Number of businesses created: ' + count);
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

Business.loadFromCSV = function(csvFilePath) {
  csv().fromPath(csvFilePath, { columns: true, trim: true })
       .on('data', loadBusiness)
       .on('end', handleSuccess)
       .on('error', handleLoadError);
};

Business.create = function (data, callback) {
  var node = db.createNode(data);
  var business = new Business(node);
    
  node.save(function (err) {
    if (err) return callback(err);
	
    node.index(INDEX_NAME, INDEX_KEY, INDEX_VAL, function (err) {
      if (err) return callback(err);
      callback(null, business);
    });
  });
};

Business.getAll = function (callback) {
  db.getIndexedNodes(INDEX_NAME, INDEX_KEY, INDEX_VAL, function (err, nodes) {
    if (err) return callback(null, []);
    
    var businesses = nodes.map(function (node) {
        return new Business(node);
    });
    
    callback(null, businesses);
  });
};

Business.getById = function(id, callback) {
  var query = [
    'START business=node:INDEX_NAME(INDEX_KEY="INDEX_VAL")',
    'WHERE business.Id="BUSINESS_ID"',
    'RETURN business',
    'LIMIT 1'
  ].join('\n')
    .replace('INDEX_NAME', INDEX_NAME)
    .replace('INDEX_KEY', INDEX_KEY)
    .replace('INDEX_VAL', INDEX_VAL)
    .replace('BUSINESS_ID', id);

  //TODO: Figure out why the params are being ignored
  var params = { businessId: id };

  db.query(query, params, function(err, results) {
    if (err) return callback(err);

    var business = results[0] && results[0]['business'];
    callback(null, new Business(business));
  });
};

Business.prototype.relateToPartner = function(partner, callback) {
  this._node.createRelationshipTo(partner._node, 'MANAGED_BY', {}, function (error, relationship) {
    callback(error, relationship);
  });
};

Business.prototype.relateToTaxReturn = function(taxReturn, callback) {
  this._node.createRelationshipTo(taxReturn._node, 'HAS_A', {}, function (error, relationship) {
    callback(error, relationship);
  });
};