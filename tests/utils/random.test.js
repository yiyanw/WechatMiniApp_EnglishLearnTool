var { pickRandom } = require('../../miniprogram/utils/random');

describe('pickRandom', function () {
  it('returns empty array for null/empty input', function () {
    expect(pickRandom(null, 3)).toEqual([]);
    expect(pickRandom([], 3)).toEqual([]);
  });

  it('returns all elements when count >= array length', function () {
    var arr = [1, 2, 3];
    var result = pickRandom(arr, 5);
    expect(result).toEqual([1, 2, 3]);
    expect(result).not.toBe(arr);
  });

  it('returns all elements when count equals array length', function () {
    var arr = ['a', 'b'];
    expect(pickRandom(arr, 2)).toEqual(['a', 'b']);
  });

  it('returns exactly count elements', function () {
    var arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    var result = pickRandom(arr, 3);
    expect(result).toHaveLength(3);
  });

  it('returns elements from the original array', function () {
    var arr = [10, 20, 30, 40, 50];
    var result = pickRandom(arr, 2);
    result.forEach(function (item) {
      expect(arr).toContain(item);
    });
  });

  it('returns unique elements (no duplicates)', function () {
    var arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    for (var i = 0; i < 20; i++) {
      var result = pickRandom(arr, 5);
      var unique = new Set(result);
      expect(unique.size).toBe(result.length);
    }
  });

  it('does not mutate the original array', function () {
    var arr = [1, 2, 3, 4, 5];
    var original = arr.slice();
    pickRandom(arr, 3);
    expect(arr).toEqual(original);
  });
});

