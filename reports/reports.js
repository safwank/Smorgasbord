var neo4j = require('neo4j'),
  db = new neo4j.GraphDatabase(process.env.NEO4J_URL || 'http://localhost:7474'),
  sys = require('sys');

var Referral = require('../models/referral');

exports.getDistributionOfReferrals = function(callback) {
  var query = [
    'START referral=node:nodes(type="referral")', 
    'MATCH referral<-[relationship:REFERRED_THROUGH]-referred', 
    'RETURN referral, count(*)'
  ].join('\n');

  db.query(query, null, function(error, results) {
    if (error) return callback(error);

    var referrals = [];

    for (var i = 0; i < results.length; i++) {
      var currentReferral = {
        type: results[i]['referral'].data.Type,
        count: results[i]['count(*)']
      };
      referrals.push(currentReferral);
    }

    return callback(null, referrals);
  });
};
