var sys = require('sys'),
  http = require('http'),
  url = require('url'),
  fs = require('fs'),
  path = require('path'),
  io = require('socket.io').listen(app),
  uuid = require('node-uuid'),
  query = require('array-query'),
  redisUtil = require('../common/redisutil');

var Business = require('../models/business'),
  BusinessTaxReturn = require('../models/businesstaxreturn'),
  Employee = require('../models/employee'),
  FinancialYear = require('../models/financialyear'),
  Individual = require('../models/individual'),
  IndividualRelation = require('../models/individualrelation'),
  IndividualStock = require('../models/individualstock'),
  IndividualTaxReturn = require('../models/individualtaxreturn'),
  Partner = require('../models/partner'),
  Referral = require('../models/referral'),
  Relation = require('../models/relation'),
  Stock = require('../models/stock');

//TODO: Re-factor this to support multiple requests :)
var thisSocket;
io.sockets.on('connection', function(socket) {
  thisSocket = socket;
});

var FILE_DROP = 'temp';
var FILE_EXTENSION = '.zip';

// GET /batchimport
exports.importCSVData = function(request, response, next) {
  importCSVData(function(error) {
    if (error) return next(error);
  });

  response.render('batchimportstatus');
};

//TODO: Re-factor this to use promises
function importCSVData(callback) {
  downloadZipFile(function(error, zipFile) {
    unzipCSVFilesIn(zipFile, function(error, csvFilesPath) {
      importCSVFilesIn(csvFilesPath, function(error) {
        createNodeRelationships(function(error) {
          callback(null);
        });
      });
    });
  });
}

function downloadZipFile(callback) {
  var downloadFileUrlString = "https://s3.amazonaws.com/myobadcodingcompetition/CSV+data.zip";
  var downloadFileUrl = url.parse(downloadFileUrlString);
  var host = downloadFileUrl.hostname;
  var downloadFilename = downloadFileUrl.pathname.split("/").pop();

  var downloadProgress = 0;
  var downloadFilePath = path.join(FILE_DROP, uuid.v1() + FILE_EXTENSION);
  var downloadFile = fs.createWriteStream(downloadFilePath, {
    'flags': 'a'
  });

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
    response.on('data', function(chunk) {
      downloadProgress += chunk.length;
      downloadFile.write(chunk, encoding = 'binary');

      sys.puts('Download progress: ' + downloadProgress + ' bytes');
      if (thisSocket) {
        var progressPercentage = (downloadProgress / contentLength) * 100;
        thisSocket.emit('downloadZipFileProgress', {
          progress: progressPercentage
        });
      }
    });
    response.on('end', function() {
      downloadFile.end();
      sys.puts('Finished downloading ' + downloadFilename);
      callback(null, downloadFilePath);
    });
  });

  request.on('error', function(e) {
    sys.puts('Problem with request: ' + e.message);
  });

  request.end();
}

function unzipCSVFilesIn(zipFilePath, callback) {
  sys.puts('Unzipping file: ' + zipFilePath);
  if (thisSocket) thisSocket.emit('unzipFileProgress', {
    progress: 'Unzipping file...'
  });

  var zipFileName = path.basename(zipFilePath, '.zip');
  var csvFilesPath = path.join(FILE_DROP, zipFileName);

  var spawn = require('child_process').spawn;
  var unzip = spawn('unzip', [zipFilePath, '-d', csvFilesPath]);

  unzip.stdout.on('data', function(data) {});
  unzip.stderr.on('data', function(data) {});
  unzip.on('exit', function(code) {
    sys.puts('Finished unzipping ' + zipFilePath);
    if (thisSocket) thisSocket.emit('unzipFileProgress', {
      progress: 'Finished unzipping file'
    });

    callback(null, csvFilesPath);
  });
}

function importCSVFilesIn(csvFilesPath, callback) {
  sys.puts('Importing CSV files');
  redisUtil.resetTotalNodes();

  Business.loadFromCSV(path.join(csvFilesPath, 'Business.csv'));
  BusinessTaxReturn.loadFromCSV(path.join(csvFilesPath, 'Business_TaxRecord.csv'));
  Employee.loadFromCSV(path.join(csvFilesPath, 'Employee.csv'));
  FinancialYear.loadFromCSV(path.join(csvFilesPath, 'FinancialYear.csv'));
  Individual.loadFromCSV(path.join(csvFilesPath, 'Individual.csv'));
  IndividualRelation.loadFromCSV(path.join(csvFilesPath, 'Individual_Relation.csv'));
  IndividualStock.loadFromCSV(path.join(csvFilesPath, 'Individual_Stock.csv'));
  IndividualTaxReturn.loadFromCSV(path.join(csvFilesPath, 'Individual_TaxRecord.csv'));
  Partner.loadFromCSV(path.join(csvFilesPath, 'Partner.csv'));
  Referral.loadFromCSV(path.join(csvFilesPath, 'Referral.csv'));
  Relation.loadFromCSV(path.join(csvFilesPath, 'Relation.csv'));
  Stock.loadFromCSV(path.join(csvFilesPath, 'Stock.csv'));

  var refreshId = setInterval(function() {
    redisUtil.getTotalNodes(function(err, totalNodes) {
      if (err) return callback(err);

      if (thisSocket) thisSocket.emit('importCSVProgress', {
        progress: totalNodes
      });

      sys.puts('Total node: ' + totalNodes);

      if (totalNodes == 0) {
        sys.puts('Finished importing CSV files');
        clearInterval(refreshId);
        callback(null);
      }
    });
  }, 1000);
}

//TODO: Re-factor this to use promises
function createNodeRelationships(callback) {
  sys.puts('Creating node relationships')

  Individual.getAll(function(error, individuals) {
    createIndividualRelationships(individuals);
    createIndividualStockRelationships();
    createIndividualPartnerRelationships(individuals);
    createIndividualTaxReturnRelationships(individuals);
    createIndividualReferralRelationships(individuals);
  });
  
  Business.getAll(function(error, businesses) {
    createBusinessPartnerRelationships(businesses);
    createBusinessTaxReturnRelationships(businesses);
  });
}

function createIndividualRelationships(individuals) {
  Relation.getAll(function(error, relations) {
    IndividualRelation.getAll(function(error, individualRelations) {
      for (var i = 0; i < individualRelations.length; i++) {
        var individualRelation = individualRelations[i];
        var relationId = individualRelation.RelatedAs;
        var relation = getRelation(relationId, relations);
        var person1 = getIndividual(individualRelation.PersonId1, individuals);
        var person2 = getIndividual(individualRelation.PersonId2, individuals);

        person1.relateToIndividual(person2, relation.Type, function(error, relationship) {
          sys.puts('Relationship -> ' + JSON.stringify(relationship));
        });
      }
    });
  });
}

function getRelation(id, relations) {
  var relation = query('Id').is(id).limit(1).on(relations)[0];
  return new Relation(relation._node);
}

function getIndividual(id, individuals) {
  var individual = query('Id').is(id).limit(1).on(individuals)[0];
  return new Individual(individual._node);
}

function createIndividualStockRelationships() {
  Stock.getAll(function(error, stocks) {
    IndividualStock.getAll(function(error, individualStocks) {
      for (var i = 0; i < individualStocks.length; i++) {
        var individualStock = individualStocks[i];
        var stockId = individualStock.StockId;
        var stock = getStock(stockId, stocks);
        var personId = individualStock.PersonId;
        var quantity = individualStock.Quantity;

        Individual.relateIndividualWithStock(personId, stock, quantity, function(error, relationship) {
          sys.puts('Relationship -> ' + JSON.stringify(relationship));
        });
      }
    });
  });
}

function getStock(id, stocks) {
  var stock = query('Id').is(id).limit(1).on(stocks)[0];
  return new Stock(stock._node);
}

function createIndividualPartnerRelationships(individuals) {
  Partner.getAll(function(error, partners) {
    for (var i = 0; i < individuals.length; i++) {
      var individual = individuals[i];
      var partnerId = individual.ManagedBy;
      var partner = getPartner(partnerId, partners);

      individual.relateToPartner(partner, function(error, relationship) {
        sys.puts('Relationship -> ' + JSON.stringify(relationship));
      });
    }
  });
}

function getPartner(id, partners) {
  var partner = query('Id').is(id).limit(1).on(partners)[0];
  return new Partner(partner._node);
}

function createIndividualTaxReturnRelationships(individuals) {
  IndividualTaxReturn.getAll(function(error, individualTaxReturns) {
    for (var i = 0; i < individualTaxReturns.length; i++) {
      var taxReturn = individualTaxReturns[i];
      var personId = taxReturn.PersonId;
      var individual = getIndividual(personId, individuals);

      individual.relateToTaxReturn(taxReturn, function(error, relationship) {
        sys.puts('Relationship -> ' + JSON.stringify(relationship));
      });
    }
  });
}

function createIndividualReferralRelationships(individuals) {
  Referral.getAll(function(error, referrals) {
    for (var i = 0; i < individuals.length; i++) {
      var individual = individuals[i];
      var referralId = individual.ReferralId;
      var referral = getReferral(referralId, referrals);

      individual.relateToReferral(referral, function(error, relationship) {
        sys.puts('Relationship -> ' + JSON.stringify(relationship));
      });
    }
  });
}

function getReferral(id, referrals) {
  var referral = query('Id').is(id).limit(1).on(referrals)[0];
  return new Referral(referral._node);
}

function createBusinessPartnerRelationships(businesses) {
  //TODO: Hmmm, partners are being retrieved twice
  Partner.getAll(function(error, partners) {
    for (var i = 0; i < businesses.length; i++) {
      var business = businesses[i];
      var partnerId = business.ManagedBy;
      var partner = getPartner(partnerId, partners);

      business.relateToPartner(partner, function(error, relationship) {
        sys.puts('Relationship -> ' + JSON.stringify(relationship));
      });
    }
  });
}

function createBusinessTaxReturnRelationships(businesses) {
  BusinessTaxReturn.getAll(function(error, businessTaxReturns) {
    for (var i = 0; i < businessTaxReturns.length; i++) {
      var taxReturn = businessTaxReturns[i];
      var businessId = taxReturn.BusinessId;
      var business = getBusiness(businessId, businesses);

      business.relateToTaxReturn(taxReturn, function(error, relationship) {
        sys.puts('Relationship -> ' + JSON.stringify(relationship));
      });
    }
  });
}

function getBusiness(id, businesses) {
  var business = query('Id').is(id).limit(1).on(businesses)[0];
  return new Business(business._node);
}