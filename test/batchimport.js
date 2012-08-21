var batchimport = require('../routes/batchimport'),
  testCase = require('nodeunit').testCase,
  app = require('../app');

module.exports = testCase({
  'importCSVData should execute without errors': function(test) {
    //TODO: how do we mock complex stuff like app?
    var response = {
      render: function(view) {
        return true;
      }
    }
    batchimport.importCSVData(null, response, null);
    test.done();
  }
});