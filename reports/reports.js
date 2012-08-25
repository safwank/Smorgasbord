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
      var referral = [
        result['referral'].data.Type,
        result['count(*)']
      ];
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

exports.getTopBusinessesByRevenue = function(callback) {
  var query = [
    'START business=node:nodes(type="business")',
    'MATCH business-[rel:HAS_A]->taxReturn',
    'RETURN business.Name AS name, taxReturn.Revenue as revenue',
    'ORDER BY length(taxReturn.Revenue) DESC, taxReturn.Revenue DESC LIMIT 10'
  ].join('\n');

  db.query(query, null, function(error, results) {
    if (error) return callback(error);

    var businesses = [];

    results.forEach(function(result) {
      businesses.push(result);
    });

    return callback(null, businesses);
  });
};

exports.getTopIndividualsByIncome = function(callback) {
  var query = [
    'START individual=node:nodes(type="individual")',
    'MATCH individual-[rel:HAS_A]->taxReturn',
    'RETURN individual.FirstName AS firstName, individual.LastName as lastName, taxReturn.Income as income',
    'ORDER BY length(taxReturn.Income) DESC, taxReturn.Income DESC LIMIT 10'
  ].join('\n');

  db.query(query, null, function(error, results) {
    if (error) return callback(error);

    var individuals = [];

    results.forEach(function(result) {
      individuals.push(result);
    });

    return callback(null, individuals);
  });
};