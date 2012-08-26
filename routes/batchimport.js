var batchImport = require('../import/batchimport');

// GET /batchimport
exports.importCSVData = function(request, response, next) {
  batchImport.importCSVData(function(error) {
    if (error) return next(error);
  });

  response.render('batchimportstatus', {
    page: 'import'
  });
};