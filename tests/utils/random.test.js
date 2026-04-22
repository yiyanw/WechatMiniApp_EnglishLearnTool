var { pickRandom, pickWeightedRandom } = require('../../miniprogram/utils/random');

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

describe('pickWeightedRandom', function () {
  var pool = [
    { id: 'a', en: 'A', zh: 'A中' },
    { id: 'b', en: 'B', zh: 'B中' },
    { id: 'c', en: 'C', zh: 'C中' },
    { id: 'd', en: 'D', zh: 'D中' },
    { id: 'e', en: 'E', zh: 'E中' }
  ];

  it('returns empty array for null/empty pool', function () {
    expect(pickWeightedRandom(null, {}, 3)).toEqual([]);
    expect(pickWeightedRandom([], {}, 3)).toEqual([]);
  });

  it('returns all items when pool smaller than count', function () {
    var small = [{ id: 'x' }, { id: 'y' }];
    var result = pickWeightedRandom(small, {}, 3);
    expect(result).toHaveLength(2);
  });

  it('returns baseCount items with no struggling sentences', function () {
    var result = pickWeightedRandom(pool, {}, 3);
    expect(result).toHaveLength(3);
  });

  it('returns unique items (no duplicates)', function () {
    for (var i = 0; i < 20; i++) {
      var result = pickWeightedRandom(pool, {}, 3);
      var ids = result.map(function (s) { return s.id; });
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('increases count when struggling sentences exist', function () {
    var prof = { a: 1, b: 1, c: 1, d: 1 };
    var result = pickWeightedRandom(pool, prof, 3);
    expect(result.length).toBeGreaterThanOrEqual(4);
  });

  it('caps count at 5', function () {
    var bigPool = [];
    var prof = {};
    for (var i = 0; i < 20; i++) {
      bigPool.push({ id: 's' + i });
      prof['s' + i] = 1;
    }
    var result = pickWeightedRandom(bigPool, prof, 3);
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it('favors struggling sentences over solid ones', function () {
    var counts = {};
    pool.forEach(function (s) { counts[s.id] = 0; });
    var prof = { a: 1, b: 3, c: 3, d: 3, e: 3 };
    for (var i = 0; i < 200; i++) {
      var result = pickWeightedRandom(pool, prof, 1);
      counts[result[0].id]++;
    }
    expect(counts.a).toBeGreaterThan(counts.b);
  });

  it('defaults to proficiency 2 when no map entry', function () {
    var result = pickWeightedRandom(pool, {}, 3);
    expect(result).toHaveLength(3);
    result.forEach(function (s) {
      expect(pool.map(function (p) { return p.id; })).toContain(s.id);
    });
  });
});
