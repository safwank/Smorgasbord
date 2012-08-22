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
  },
  'getDistributionOfPartners should return partners and their counts': function(test) {
    reports.getDistributionOfPartners(function(error, results) {
      test.ok(results.length > 0);

      results.forEach(function(result) {
        test.ok(result.hasOwnProperty('name'));
        test.ok(result.hasOwnProperty('count'));
      });

      test.done();
    });
  },
  'getTopBusinessesByRevenue should return top 10 businesses by revenue in descending order': function(test) {
    reports.getTopBusinessesByRevenue(function(error, results) {
      test.ok(results.length === 10);

      results.forEach(function(result) {
        test.ok(result.hasOwnProperty('name'));
        test.ok(result.hasOwnProperty('revenue'));
      });

      test.done();
    });
  },
  'getTopIndividualsByIncome should return top 10 individuals by income in descending order': function(test) {
    reports.getTopIndividualsByIncome(function(error, results) {
      test.ok(results.length === 10);

      results.forEach(function(result) {
        test.ok(result.hasOwnProperty('firstName'));
        test.ok(result.hasOwnProperty('lastName'));
        test.ok(result.hasOwnProperty('income'));
      });

      test.done();
    });
  }
});