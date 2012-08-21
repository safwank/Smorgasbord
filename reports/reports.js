var neo4j = require('neo4j'),
  db = new neo4j.GraphDatabase(process.env.NEO4J_URL || 'http://localhost:7474'),
  sys = require('sys');

exports.getDistributionOfReferrals = function(callback) {
  var query = [
    'START referral=node:nodes(type="referral")', 
    'MATCH referral<-[relationship:REFERRED_THROUGH]-referred', 
    'RETURN referral, count(*)'
  ].join('\n');

  db.query(query, null, function(error, results) {
    if (error) return callback(error);

    var referrals = [];

    results.forEach(function(result) {
      var referral = {
        type: result['referral'].data.Type,
        count: result['count(*)']
      };
      referrals.push(referral);
    });

    return callback(null, referrals);
  });
};

exports.getDistributionOfPartners = function(callback) {
  var query = [
    'START partner=node:nodes(type="partner")', 
    'MATCH partner-[rel:MANAGED_BY]-managed', 
    'RETURN partner, count(*)'
  ].join('\n');

  db.query(query, null, function(error, results) {
    if (error) return callback(error);

    var partners = [];

    results.forEach(function(result) {
      var resultData = result['partner'].data;
      var partner = {
        name: resultData.FirstName + ' ' + resultData.LastName,
        count: result['count(*)']
      };
      partners.push(partner);
    });

    return callback(null, partners);
  });
};

