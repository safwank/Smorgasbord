// TODO: Switch between local Redis and Redis To Go (Heroku)
var redis = require('redis'),
  redisClient = redis.createClient();

var TOTAL_NODES_KEY = 'total_nodes_imported';

exports.incrementTotalNodesBy = function(value) {
  redisClient.incrby(TOTAL_NODES_KEY, value, redis.print);
}

exports.incrementTotalNodes = function() {
  redisClient.incr(TOTAL_NODES_KEY);
}

exports.decrementTotalNodesBy = function(value) {
  redisClient.decrby(TOTAL_NODES_KEY, value);
}

exports.decrementTotalNodes = function() {
  redisClient.decr(TOTAL_NODES_KEY, redis.print);
}

exports.resetTotalNodes = function() {
  redisClient.set(TOTAL_NODES_KEY, 0, redis.print);
}

exports.getTotalNodes = function(callback) {
  redisClient.get('total_nodes_imported', function(err, reply) {
    if (err) return callback(err);

    callback(null, reply);
  });
}