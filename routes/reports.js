var reports = require('../reports/reports'),
  sys = require('sys');

// GET /reports
exports.show = function(request, response, next) {
  response.render('reports');
};

// GET /reports/:id
exports.generate = function(request, response, next) {
  var reportType = request.params.id;

  switch (reportType) {
    case 'referrals':
      reports.getDistributionOfReferrals(function(error, referrals) {
        if (error) return next(error);

        response.writeHead(200, {'content-type': 'text/json' });
        response.write(JSON.stringify(referrals));
        response.end('\n');
      });
      break;
    case 'partners':
      reports.getDistributionOfPartners(function(error, partners) {
        if (error) return next(error);

        response.writeHead(200, {'content-type': 'text/json' });
        response.write(JSON.stringify(partners));
        response.end('\n');
      });
      break;
    case 'businesses':
      reports.getTopBusinessesByRevenue(function(error, businesses) {
        if (error) return next(error);

        response.writeHead(200, {'content-type': 'text/json' });
        response.write(JSON.stringify(businesses));
        response.end('\n');
      });
      break;
    case 'individuals':
      reports.getTopIndividualsByIncome(function(error, individuals) {
        if (error) return next(error);

        response.writeHead(200, {'content-type': 'text/json' });
        response.write(JSON.stringify(individuals));
        response.end('\n');
      });
      break;
    case 'states':
      reports.getTopStatesByBusinesses(function(error, states) {
        if (error) return next(error);

        response.writeHead(200, {'content-type': 'text/json' });
        response.write(JSON.stringify(states));
        response.end('\n');
      });
      break;
  }
};