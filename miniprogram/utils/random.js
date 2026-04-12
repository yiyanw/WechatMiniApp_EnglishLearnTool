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

module.exports = {
  pickRandom: pickRandom
};
