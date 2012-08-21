var reports = require('../reports/reports'),
  testCase = require('nodeunit').testCase;

module.exports = testCase({
  'getDistributionOfReferrals should return referrals and their counts': function(test) {
    reports.getDistributionOfReferrals(function(error, results) {
      test.ok(results.length > 0);
      test.done();
    });
  }
});