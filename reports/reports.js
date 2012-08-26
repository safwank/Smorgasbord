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
      var partner = [
        resultData.FirstName + ' ' + resultData.LastName,
        result['count(*)']
      ];
      partners.push(partner);
    });

    return callback(null, partners);
  });
};

exports.getTopBusinessesByRevenue = function(callback) {
  var query = [
    'START business=node:nodes(type="business")',
    'MATCH business-[rel:HAS_A]->taxReturn',
    'RETURN business.Name AS name, taxReturn.Revenue AS revenue',
    'ORDER BY length(taxReturn.Revenue) DESC, taxReturn.Revenue DESC LIMIT 10'
  ].join('\n');

  db.query(query, null, function(error, results) {
    if (error) return callback(error);
    
    var businesses = [
      ['Name', 'Revenue']
    ];

    results.forEach(function(result) {
      var business = [
        result.name, 
        parseInt(result.revenue)
      ];
      businesses.push(business);
    });

    return callback(null, businesses);
  });
};

exports.getTopIndividualsByIncome = function(callback) {
  var query = [
    'START individual=node:nodes(type="individual")',
    'MATCH individual-[rel:HAS_A]->taxReturn',
    'RETURN individual.FirstName AS firstName, individual.LastName AS lastName, taxReturn.Income AS income',
    'ORDER BY length(taxReturn.Income) DESC, taxReturn.Income DESC LIMIT 10'
  ].join('\n');

  db.query(query, null, function(error, results) {
    if (error) return callback(error);

    var individuals = [
      ['Name', 'Income']
    ];

    results.forEach(function(result) {
      var individual = [
        result.firstName + ' ' + result.lastName,
        parseFloat(result.income)
      ];
      individuals.push(individual);
    });

    return callback(null, individuals);
  });
};

exports.getTopStatesByBusinesses = function(callback) {
  var query = [
    'START business=node:nodes(type="business")',
    'RETURN business.State AS state, count(*) AS businesses'
  ].join('\n');

  db.query(query, null, function(error, results) {
    if (error) return callback(error);

    var states = [
      ['State', 'Businesses']
    ];

    results.forEach(function(result) {
      var state = [
        result.state,
        parseInt(result.businesses)
      ];
      states.push(state);
    });

    return callback(null, states);
  });
};