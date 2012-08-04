var sys = require("sys"),
	http = require("http"),
    url = require("url"),
    fs = require("fs"),
	io = require('socket.io').listen(app),
	AdmZip = require('adm-zip'),
	uuid = require('node-uuid');

//TODO: Re-factor this to support multiple requests :)
var thisSocket; 
io.sockets.on('connection', function (socket) {
  	thisSocket = socket;
});

var FILE_DROP = 'temp/';
var FILE_EXTENSION = '.zip';

// GET /batchimport
exports.importCSVData = function (request, response, next) {
	importCSVData(function (error) {
    	if (error) return next(error);
    });

    response.render('batchimportstatus');
};

function importCSVData(callback) {
	var zipFile = downloadZipFile(function (error, zipFile) {
		unzipCSVFilesIn(zipFile, function (error) {
			//import each file
			//create relationships
		});
	});
}

function downloadZipFile(callback) {
	var downloadFileUrlString = "https://s3.amazonaws.com/myobadcodingcompetition/CSV+data.zip";
	var downloadFileUrl = url.parse(downloadFileUrlString);
	var host = downloadFileUrl.hostname;
	var downloadFilename = downloadFileUrl.pathname.split("/").pop();

	var downloadProgress = 0;
	var downloadFileLocation = FILE_DROP + uuid.v1() + FILE_EXTENSION;
    var downloadFile = fs.createWriteStream(downloadFileLocation, {'flags': 'a'});

    var downloadOptions = {
		host: host,
	  	port: 80,
	  	path: downloadFileUrl.pathname,
	  	method: 'GET'
	};

	var request = http.request(downloadOptions, function(response) {
		sys.puts('Downloading file: ' + downloadFilename);
	  	sys.puts('STATUS: ' + response.statusCode);
	  	sys.puts('HEADERS: ' + JSON.stringify(response.headers));

	  	var contentLength = response.headers['content-length'];

	  	response.setEncoding('binary');
	  	response.on('data', function (chunk) {
	    	downloadProgress += chunk.length;
      		downloadFile.write(chunk, encoding='binary');
      		
        	sys.puts('Download progress: ' + downloadProgress + ' bytes');
        	if (thisSocket)
        	{
        		var progressPercentage = (downloadProgress/contentLength) * 100;
        		thisSocket.emit('downloadZipFileProgress', { progress: progressPercentage });
        	}
	  	});
	  	response.on('end', function () {
	  		downloadFile.end();
      		sys.puts('Finished downloading ' + downloadFilename);
      		callback(null, downloadFileLocation);
		});
	});

	request.on('error', function(e) {
	  	sys.puts('Problem with request: ' + e.message);
	});

	request.end();
}

function unzipCSVFilesIn(zipFileLocation, callback) {
	sys.puts('Unzipping file: ' + zipFileLocation);
	thisSocket.emit('unzipFileProgress', { progress: 'Unzipping file...' });

	var zipFile = new AdmZip(zipFileLocation);
	zipFile.extractAllTo(FILE_DROP, true);
	
	sys.puts('Finished unzipping ' + zipFileLocation);
	if (thisSocket) 
		thisSocket.emit('unzipFileProgress', { progress: 'Finished unzipping file' });
	
	callback(null);
}
