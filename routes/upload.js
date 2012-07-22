var formidable = require('formidable');
var util = require('util');

// GET /upload
exports.show = function (req, res, next) {
  res.render('upload');
};

// POST /upload
exports.importCSVData = function (req, res, next) {
  var form = new formidable.IncomingForm();
  form.uploadDir = process.env.TMP || process.env.TMPDIR || process.env.TEMP || '/tmp' || process.cwd();
  console.log('Upload directory: ' + form.uploadDir);

  form.parse(req, function(err, fields, files) {
  	console.log(files);
    res.send(files.csvFile.name + ' successfully uploaded!')
  }).on('progress', function(bytesReceived, bytesExpected) {
  	console.log('Bytes received: ' + bytesReceived);
  }).on('error', function (err) {
  	console.error('Error: ' + err.message);
  	res.send('Error: ' + err.message);
  });
};
