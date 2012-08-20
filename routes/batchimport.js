var sys = require('sys'),
  http = require('http'),
  url = require('url'),
  fs = require('fs'),
  path = require('path'),
  io = require('socket.io').listen(app),
  uuid = require('node-uuid'),
  query = require('array-query'),
  async = require('async'),
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

function importCSVData(callback) {
  sys.puts('Running batch import');

  async.waterfall([
    downloadZipFile, 
    unzipCSVFilesIn, 
    importCSVFilesIn, 
    createNodeRelationships
  ], function(error, result) {
    if (error) return callback(error);

    sys.puts('Finished running batch import');
    callback(null);
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

function createNodeRelationships(mainCallback) {
  sys.puts('Creating node relationships');
  if (thisSocket) thisSocket.emit('createRelationshipsProgress', {
    progress: 'Creating node relationships...'
  });

  async.parallel([
    createRelationshipsForIndividuals,
    createRelationshipsForBusinesses
  ], function(error, results) {
    if (error) return mainCallback(error);

    sys.puts('Finished creating node relationships');
    if (thisSocket) thisSocket.emit('createRelationshipsProgress', {
      progress: 'Finished creating node relationships'
    });

    mainCallback(null);
  });
}

function createRelationshipsForIndividuals(individualCallback) {
  async.waterfall([Individual.getAll], function(error, individuals) {
    async.parallel([
      function(callback) {
        createIndividualRelationships(individuals, callback);
      }, function(callback) {
        createIndividualStockRelationships(individuals, callback);
      }, function(callback) {
        createIndividualPartnerRelationships(individuals, callback);
      }, function(callback) {
        createIndividualTaxReturnRelationships(individuals, callback);
      }, function(callback) {
        createIndividualReferralRelationships(individuals, callback);
      }
    ], function(error, results) {
      if (error) return individualCallback(error);

      individualCallback(null);
    });
  })
}

function createRelationshipsForBusinesses(mainCallBack) {
  async.waterfall([Business.getAll], function(error, businesses) {
    async.parallel([
      function(callback) {
        createBusinessPartnerRelationships(businesses, callback);
      }, function(callback) {
        createBusinessTaxReturnRelationships(businesses, callback);
      }
    ], function(error, results) {
      if (error) return businessCallback(error);

      mainCallBack(null);
    });
  })
}

function createIndividualRelationships(individuals, mainCallback) {
  async.parallel({
    relations: Relation.getAll,
    individualRelations: IndividualRelation.getAll
  }, function(mainError, result) {
    if (mainError) return mainCallback(mainError);

    var relations = result.relations;
    var individualRelations = result.individualRelations;

    async.forEach(individualRelations, function(individualRelation, iterationCallback) {
      var relationId = individualRelation.RelatedAs;
      var relation = getRelation(relationId, relations);
      var person1 = getIndividual(individualRelation.PersonId1, individuals);
      var person2 = getIndividual(individualRelation.PersonId2, individuals);

      person1.relateToIndividual(person2, relation.Type, function(error, relationship) {
        if (error) return iterationCallback(error);

        sys.puts('Relationship -> ' + JSON.stringify(relationship));
        iterationCallback(null);
      });
    }, function(error) {
      if (error) return mainCallback(error);

      mainCallback(null);
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

function createIndividualStockRelationships(individuals, mainCallback) {
  async.parallel({
    stocks: Stock.getAll,
    individualStocks: IndividualStock.getAll
  }, function(mainError, result) {
    var stocks = result.stocks;
    var individualStocks = result.individualStocks;

    async.forEach(individualStocks, function(individualStock, iterationCallback) {
      var stockId = individualStock.StockId;
      var stock = getStock(stockId, stocks);
      var person = getIndividual(individualStock.PersonId, individuals);
      var quantity = individualStock.Quantity;

      person.relateToStock(stock, quantity, function(error, relationship) {
        if (error) return iterationCallback(error); 

        sys.puts('Relationship -> ' + JSON.stringify(relationship));
        iterationCallback(null);
      });
    }, function(error) {
      if (error) return mainCallback(error); 

      mainCallback(null);
    });
  });
}

function getStock(id, stocks) {
  var stock = query('Id').is(id).limit(1).on(stocks)[0];
  return new Stock(stock._node);
}

function createIndividualPartnerRelationships(individuals, mainCallback) {
  Partner.getAll(function(mainError, partners) {
    async.forEach(individuals, function(individual, iterationCallback) {
      var partnerId = individual.ManagedBy;
      var partner = getPartner(partnerId, partners);

      individual.relateToPartner(partner, function(error, relationship) {
        if (error) return iterationCallback(error);

        sys.puts('Relationship -> ' + JSON.stringify(relationship));
        iterationCallback(null);
      });
    }, function(error) {
      if (error) return mainCallback(error);

      mainCallback(null);
    });
  });
}

function getPartner(id, partners) {
  var partner = query('Id').is(id).limit(1).on(partners)[0];
  return new Partner(partner._node);
}

function createIndividualTaxReturnRelationships(individuals, mainCallback) {
  IndividualTaxReturn.getAll(function(mainError, individualTaxReturns) {
    async.forEach(individualTaxReturns, function(taxReturn, iterationCallback) {
      var personId = taxReturn.PersonId;
      var individual = getIndividual(personId, individuals);

      individual.relateToTaxReturn(taxReturn, function(error, relationship) {
        if (error) return iterationCallback(error); 

        sys.puts('Relationship -> ' + JSON.stringify(relationship));
        iterationCallback(null);
      });
    }, function(error) {
      if (error) return mainCallback(error);

      mainCallback(null);
    });
  });
}

function createIndividualReferralRelationships(individuals, mainCallback) {
  Referral.getAll(function(error, referrals) {
    async.forEach(individuals, function(individual, iterationCallback) {
      var referralId = individual.ReferralId;
      var referral = getReferral(referralId, referrals);

      individual.relateToReferral(referral, function(error, relationship) {
        if (error) return iterationCallback(error); 

        sys.puts('Relationship -> ' + JSON.stringify(relationship));
        iterationCallback(null);
      });
    }, function(error) {
      if (error) return mainCallback(error);

      mainCallback(null);
    });
  });
}

function getReferral(id, referrals) {
  var referral = query('Id').is(id).limit(1).on(referrals)[0];
  return new Referral(referral._node);
}

function createBusinessPartnerRelationships(businesses, mainCallback) {
  //TODO: Hmmm, partners are being retrieved twice
  Partner.getAll(function(error, partners) {
    async.forEach(businesses, function(business, iterationCallback) {
      var partnerId = business.ManagedBy;
      var partner = getPartner(partnerId, partners);

      business.relateToPartner(partner, function(error, relationship) {
        if (error) return iterationCallback(error); 

        sys.puts('Relationship -> ' + JSON.stringify(relationship));
        iterationCallback(null);
      });
    }, function(error) {
      if (error) return mainCallback(error);

      mainCallback(null);
    });
  });
}

function createBusinessTaxReturnRelationships(businesses, mainCallback) {
  BusinessTaxReturn.getAll(function(error, businessTaxReturns) {
    async.forEach(businessTaxReturns, function(taxReturn, iterationCallback) {
      var businessId = taxReturn.BusinessId;
      var business = getBusiness(businessId, businesses);

      business.relateToTaxReturn(taxReturn, function(error, relationship) {
        if (error) return iterationCallback(error); 

        sys.puts('Relationship -> ' + JSON.stringify(relationship));
        iterationCallback(null);
      });
    }, function(error) {
      if (error) return mainCallback(error);

      mainCallback(null);
    });
  });
}

function getBusiness(id, businesses) {
  var business = query('Id').is(id).limit(1).on(businesses)[0];
  return new Business(business._node);
}