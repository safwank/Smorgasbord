var reports = require('../reports/reports'),
  testCase = require('nodeunit').testCase;

module.exports = testCase({
  'getDistributionOfReferrals should return referrals and their counts': function(test) {
    reports.getDistributionOfReferrals(function(error, results) {
      test.ok(results.length > 0);

      results.forEach(function(result) {
      	test.ok(result.hasOwnProperty('type'));
      	test.ok(result.hasOwnProperty('count'));
      });

      test.done();
    });
  }
});