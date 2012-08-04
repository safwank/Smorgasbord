// Initialization

var util = require('../common/util');
var csv = require('csv');
var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase(process.env.NEO4J_URL || 'http://localhost:7474');

// Constants

var INDEX_NAME = 'nodes';
var INDEX_KEY = 'type';
var INDEX_VAL = 'employee';

// Private "constructors"

var Employee = module.exports = function Employee(_node) {
    this._node = _node;
};

// Pass-through Employee properties

util.proxyProperty(Employee, 'Id', true);
util.proxyProperty(Employee, 'ReportTo', true);
util.proxyProperty(Employee, 'Title', true);
util.proxyProperty(Employee, 'FirstName', true);
util.proxyProperty(Employee, 'LastName', true);
util.proxyProperty(Employee, 'DOB', true);
util.proxyProperty(Employee, 'Mobile', true);
util.proxyProperty(Employee, 'Email', true);
util.proxyProperty(Employee, 'Twitter', true);
util.proxyProperty(Employee, 'Notes', true);
util.proxyProperty(Employee, 'AddressLine1', true);
util.proxyProperty(Employee, 'AddressLine2', true);
util.proxyProperty(Employee, 'Postcode', true);
util.proxyProperty(Employee, 'City', true);
util.proxyProperty(Employee, 'State', true);
util.proxyProperty(Employee, 'Income', true);

// Private functions

function loadEmployee(data, index) {
  var employee = data;
  util.removeNullOrEmptyPropertiesIn(employee);
  Employee.create(employee, handleCreated);
}

function handleSuccess(count) {
  console.log('Number of employees created: ' + count);
}

function handleLoadError(error) {
  console.log(error.message);
}

function handleCreated(error, data) {
  if (error) console.log(error.message);
  console.log('Created: ' + data);
}

// Public functions

Employee.loadFromCSV = function(csvFilePath) {
  csv().fromPath(csvFilePath, { columns: true, trim: true })
       .on('data', loadEmployee)
       .on('end', handleSuccess)
       .on('error', handleLoadError);
};

Employee.create = function (data, callback) {
  var node = db.createNode(data);
  var employee = new Employee(node);
    
  node.save(function (err) {
    if (err) return callback(err);
	
    node.index(INDEX_NAME, INDEX_KEY, INDEX_VAL, function (err) {
      if (err) return callback(err);
      callback(null, employee);
    });
  });
};

Employee.getAll = function (callback) {
  db.getIndexedNodes(INDEX_NAME, INDEX_KEY, INDEX_VAL, function (err, nodes) {
    if (err) return callback(null, []);

    var employees = nodes.map(function (node) {
        return new Employee(node);
    });
    
    callback(null, employees);
  });
};