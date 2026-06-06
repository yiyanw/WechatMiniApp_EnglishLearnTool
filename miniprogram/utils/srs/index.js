var srsStorage = require('./srs-storage');
var weightedRandom = require('./weighted-random');

var strategies = {};

function register(strategyFactory) {
  var instance = strategyFactory.create();
  strategies[instance.key] = strategyFactory;
}

function getActiveStrategy() {
  var key = srsStorage.getActiveAlgorithm();
  var factory = strategies[key];
  if (!factory) {
    console.error('Unknown SRS algorithm: ' + key + ', falling back to weighted-random');
    factory = strategies['weighted-random'];
  }
  return factory.create();
}

function listStrategies() {
  return Object.keys(strategies);
}

function switchAlgorithm(key) {
  if (!strategies[key]) {
    console.error('Cannot switch to unknown algorithm: ' + key);
    return false;
  }
  srsStorage.setActiveAlgorithm(key);
  return true;
}

register(weightedRandom);

module.exports = {
  getActiveStrategy: getActiveStrategy,
  listStrategies: listStrategies,
  switchAlgorithm: switchAlgorithm,
  register: register
};
