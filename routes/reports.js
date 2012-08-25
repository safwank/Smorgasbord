var reports = require('../reports/reports');

// GET /reports
exports.show = function(request, response, next) {
  reports.getDistributionOfReferrals(function(error, referrals) {
    if (error) return next(error);

    response.render('reports', {
      reportData: referrals
    });
  });
};