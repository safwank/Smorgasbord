var io = require('socket.io').listen(app);
var thisSocket;
io.sockets.on('connection', function (socket) {
  	thisSocket = socket;
});

// GET /batchimport
exports.importCSVData = function (request, response, next) {
	importCSVData(function (error) {
    	if (error) return next(error);
        response.render('batchimportstatus');
    });
};

function importCSVData(callback) {
	downloadCSVFile();
	callback();
}

function downloadCSVFile() {
	var sys = require("sys"),
    http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    events = require("events");

	var downloadFileUrlString = "https://s3.amazonaws.com/myobadcodingcompetition/CSV+data.zip";
	var downloadFileUrl = url.parse(downloadFileUrlString);
	var host = downloadFileUrl.hostname;
	var downloadFilename = downloadFileUrl.pathname.split("/").pop();

	var downloadProgress = 0;
	var downloadFileUrlStringLocation = 'temp/' + downloadFilename;
    var downloadfile = fs.createWriteStream(downloadFileUrlStringLocation, {'flags': 'a'});

    var downloadOptions = {
		host: host,
	  	port: 80,
	  	path: downloadFileUrl.pathname,
	  	method: 'GET'
	};

	var request = http.request(downloadOptions, function(response) {
		sys.puts("Downloading file: " + downloadFilename);
	  	sys.puts('STATUS: ' + response.statusCode);
	  	sys.puts('HEADERS: ' + JSON.stringify(response.headers));

	  	response.setEncoding('utf8');
	  	response.on('data', function (chunk) {
	    	downloadProgress += chunk.length;
      		downloadfile.write(chunk, encoding='binary');
        	sys.puts("Download progress: " + downloadProgress + " bytes");

        	if (thisSocket)
        		thisSocket.emit('progress', { progress: downloadProgress });
	  	});
	  	response.on('end', function () {
	  		downloadfile.end();
      		sys.puts('Finished downloading ' + downloadFilename);
		});
	});

	request.on('error', function(e) {
	  	sys.puts('Problem with request: ' + e.message);
	});

	request.end();
}