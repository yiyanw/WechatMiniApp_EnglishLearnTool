// utils/random.js

/**
 * Fisher-Yates 部分洗牌，从 arr 中随机抽取 count 个元素（不重复）。
 * 若 arr.length <= count，返回全部元素的副本。
 */
function pickRandom(arr, count) {
  if (!arr || arr.length === 0) {
    return [];
  }
  if (arr.length <= count) {
    return arr.slice();
  }
  var copy = arr.slice();
  for (var i = 0; i < count; i++) {
    var j = i + Math.floor(Math.random() * (copy.length - i));
    var temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy.slice(0, count);
}

var WEIGHT_MAP = { 1: 4, 2: 2, 3: 1 };
var DEFAULT_PROFICIENCY = 2;

function pickWeightedRandom(pool, proficiencyMap, baseCount) {
  if (!pool || pool.length === 0) return [];

  var strugglingCount = 0;
  var candidates = pool.map(function (sentence) {
    var level = proficiencyMap[sentence.id] || DEFAULT_PROFICIENCY;
    if (level === 1) strugglingCount++;
    return { sentence: sentence, weight: WEIGHT_MAP[level] || WEIGHT_MAP[DEFAULT_PROFICIENCY] };
  });

  var targetCount = Math.min(baseCount + Math.floor(strugglingCount / 2), 5, pool.length);
  var result = [];

  for (var picked = 0; picked < targetCount; picked++) {
    var totalWeight = 0;
    for (var i = 0; i < candidates.length; i++) {
      totalWeight += candidates[i].weight;
    }
    var randomThreshold = Math.random() * totalWeight;
    var cumulativeWeight = 0;
    for (var j = 0; j < candidates.length; j++) {
      cumulativeWeight += candidates[j].weight;
      if (randomThreshold < cumulativeWeight) {
        result.push(candidates[j].sentence);
        candidates.splice(j, 1);
        break;
      }
    }
  }

  return result;
}

module.exports = {
  pickRandom: pickRandom,
  pickWeightedRandom: pickWeightedRandom
};
