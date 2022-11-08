import * as util from 'node:util';

import { describe, expect, test } from '@jest/globals';

import { isTupleChanged } from './is.js';

describe('isTupleChanged', () => {
  const values = ['a', 1, 2n, true, {}, null, undefined, () => undefined];

  values.forEach((a) => {
    values.forEach((b) => {
      test(`expect ${a !== b}: isTupleChanged(${util.inspect(a)}, ${util.inspect(b)})`, () => {
        expect(isTupleChanged(a, b)).toBe(a !== b);
      });

      test(`expect ${a !== b}: isTupleChanged([${util.inspect(a)}], [${util.inspect(b)}])`, () => {
        expect(isTupleChanged([a], [b])).toBe(a !== b);
      });

      test(`expect ${a !== b}: isTupleChanged({ x: ${util.inspect(a)} }, { x: ${util.inspect(b)} })`, () => {
        expect(isTupleChanged({ x: a }, { x: b })).toBe(a !== b);
      });
    });

    test(`expect true: isTupleChanged([${util.inspect(a)}], [${util.inspect(a)}, ${util.inspect(a)}])`, () => {
      expect(isTupleChanged([a], [a, a])).toBe(true);
    });

    test(`expect true: isTupleChanged({ x: ${util.inspect(a)} }, { x: ${util.inspect(a)}, y: ${util.inspect(
      a,
    )} })`, () => {
      expect(isTupleChanged({ x: a }, { x: a, y: a })).toBe(true);
      expect(isTupleChanged({ x: a, y: a }, { x: a })).toBe(true);
    });

    test(`expect true: isTupleChanged([${util.inspect(a)}], { 0: ${util.inspect(a)}, length: 1 })`, () => {
      expect(isTupleChanged([a], { 0: a, length: 1 })).toBe(true);
      expect(isTupleChanged({ 0: a, length: 1 }, [a])).toBe(true);
    });
  });
});
