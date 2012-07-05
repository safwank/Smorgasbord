// Initialization

var csv = require('csv');
var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase(process.env.NEO4J_URL || 'http://localhost:7474');

// Constants:

var INDEX_NAME = 'nodes';
var INDEX_KEY = 'type';
var INDEX_VAL = 'business';

// Private "constructors"

var Business = module.exports = function Business(_node) {
    this._node = _node;
};

// Pass-through Business properties:

function proxyProperty(prop, isData) {
    Object.defineProperty(Business.prototype, prop, {
        get: function () {
            if (isData) {
                return this._node.data[prop];
            } else {
                return this._node[prop];
            }
        },
        set: function (value) {
            if (isData) {
                this._node.data[prop] = value;
            } else {
                this._node[prop] = value;
            }
        }
    });
}

proxyProperty('Id');
proxyProperty('Name');
proxyProperty('ACN');
proxyProperty('Phone');
proxyProperty('Website');
proxyProperty('AddressLine1');
proxyProperty('AddressLine2');
proxyProperty('Postcode');
proxyProperty('City');
proxyProperty('State');
proxyProperty('Type');

// Private functions
     
function loadBusiness(data, index) {
  var business = data;
  Business.create(business, handleCreated);
}

function handleSuccess(count) {
  console.log('Number of businesses created: ' + count);
}

function handleLoadError(error) {
  console.log(error.message);
}

function handleCreated(error, data) {
  if (error) console.log(error.message);
  console.log('Created: ' + data);
}

// Public functions

Business.loadFromCSV = function() {
  csv().fromPath('data/BusinessTest.csv', { columns: true, trim: true })
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