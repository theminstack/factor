/* eslint-disable @typescript-eslint/no-inferrable-types */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import { type FC, type ReactNode, useState } from 'react';
import { act } from 'react-dom/test-utils';

import {
  type Factor,
  createFactor,
  useFactor as useFactorBase,
  useOptionalFactor as useOptionalFactorBase,
} from './factor.js';
import { type Selector } from './selector.js';

const useFactor = jest
  .fn<(factor: Factor<any, any>, selector?: Selector<any, any>, deps?: unknown[]) => any>()
  .mockImplementation(useFactorBase);
const useOptionalFactor = jest
  .fn<(factor: Factor<any, any>, selector?: Selector<any, any>, deps?: unknown[]) => any>()
  .mockImplementation(useOptionalFactorBase);

let setValue: (value: any) => void;

const useTest = jest.fn<(props: { initialValue?: any }) => any>().mockImplementation((props) => {
  const [value0, setValue0] = useState(props.initialValue);

  setValue = setValue0;

  return { setValue: setValue0, value: value0 };
});

const TestFactor = createFactor(useTest);

const TestApp: FC<{ children?: ReactNode; initialValue?: any }> = jest
  .fn<FC<{ children?: ReactNode; initialValue?: any }>>()
  .mockImplementation((props) => {
    return <TestFactor initialValue={props.initialValue}>{props.children}</TestFactor>;
  });

const TestChild: FC = jest.fn<FC>().mockReturnValue(null);

beforeEach(() => {
  jest.clearAllMocks();
  setValue = () => undefined;
});

describe('useFactor without parent', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockReturnValue(undefined);
  });

  test('throws', () => {
    expect(() => renderHook(() => useFactor(TestFactor))).toThrow();
  });
});

describe('useOptionalFactor without parent', () => {
  test('returns undefined', () => {
    const { result } = renderHook(() => useOptionalFactor(TestFactor));
    expect(result.current).toBeUndefined();
  });
});

(
  [
    [useFactor, 'useFactor'],
    [useOptionalFactor, 'useOptionalFactor'],
  ] as const
).forEach(([useFactorTest, name]) => {
  describe(name, () => {
    test('returns value', () => {
      const { result } = renderHook(() => useFactorTest(TestFactor), {
        wrapper: ({ children }) => <TestApp initialValue={'foo'}>{children}</TestApp>,
      });
      expect(result.current.value).toBe('foo');
    });

    test('updates when value changes', () => {
      const { result } = renderHook(() => useFactorTest(TestFactor), {
        wrapper: ({ children }) => (
          <TestApp initialValue={'foo'}>
            <TestChild />
            {children}
          </TestApp>
        ),
      });

      const count0 = useFactorTest.mock.calls.length;
      const count1 = jest.mocked(TestChild).mock.calls.length;
      expect(result.current.value).toBe('foo');

      void act(() => setValue('bar'));
      expect(useFactorTest).toHaveBeenCalledTimes(count0 + 1);
      expect(result.current.value).toBe('bar');

      // Sibling should not have been updated.
      expect(TestChild).toHaveBeenCalledTimes(count1);
    });

    test('selects single value', () => {
      const { result } = renderHook(() => useFactorTest(TestFactor, (value: any) => value.value.a), {
        wrapper: ({ children }) => <TestApp initialValue={{ a: 1 }}>{children}</TestApp>,
      });

      const count = useFactorTest.mock.calls.length;
      expect(result.current).toBe(1);

      // No update if the selection is unchanged.
      void act(() => setValue({ a: 1, b: 2 }));
      expect(useFactorTest).toHaveBeenCalledTimes(count);
      expect(result.current).toBe(1);

      void act(() => setValue({ a: 2, b: 2 }));
      expect(useFactorTest).toHaveBeenCalledTimes(count + 1);
      expect(result.current).toBe(2);
    });

    test('selects array tuple', () => {
      const { result } = renderHook(
        () => useFactorTest(TestFactor, [(value: any) => value.value.a, (value: any) => value.value.b]),
        {
          wrapper: ({ children }) => <TestApp initialValue={{ a: 1, b: 2, c: 3 }}>{children}</TestApp>,
        },
      );

      const count = useFactorTest.mock.calls.length;
      expect(result.current).toEqual([1, 2]);

      // No update if the selection is unchanged.
      void act(() => setValue({ a: 1, b: 2, c: 4 }));
      expect(useFactorTest).toHaveBeenCalledTimes(count);
      expect(result.current).toEqual([1, 2]);

      void act(() => setValue({ a: 2, b: 2, c: 4 }));
      expect(useFactorTest).toHaveBeenCalledTimes(count + 1);
      expect(result.current).toEqual([2, 2]);

      void act(() => setValue({ a: 2, b: 3, c: 4 }));
      expect(useFactorTest).toHaveBeenCalledTimes(count + 2);
      expect(result.current).toEqual([2, 3]);
    });

    test('selects object tuples', () => {
      const { result } = renderHook(
        () => useFactorTest(TestFactor, { a: (value: any) => value.value.a, b: (value: any) => value.value.b }),
        {
          wrapper: ({ children }) => <TestApp initialValue={{ a: 1, b: 2, c: 3 }}>{children}</TestApp>,
        },
      );

      const count = useFactorTest.mock.calls.length;
      expect(result.current).toEqual({ a: 1, b: 2 });

      // No update if the selection is unchanged.
      void act(() => setValue({ a: 1, b: 2, c: 4 }));
      expect(useFactorTest).toHaveBeenCalledTimes(count);
      expect(result.current).toEqual({ a: 1, b: 2 });

      void act(() => setValue({ a: 2, b: 2, c: 4 }));
      expect(useFactorTest).toHaveBeenCalledTimes(count + 1);
      expect(result.current).toEqual({ a: 2, b: 2 });

      void act(() => setValue({ a: 2, b: 3, c: 4 }));
      expect(useFactorTest).toHaveBeenCalledTimes(count + 2);
      expect(result.current).toEqual({ a: 2, b: 3 });
    });

    test('updates on dependency change', () => {
      const { result, rerender } = renderHook(
        (props: string = 'a') => useFactorTest(TestFactor, (value: any) => value.value[props], [props]),
        {
          wrapper: ({ children }) => <TestApp initialValue={{ a: 1, b: 2 }}>{children}</TestApp>,
        },
      );

      const count = useFactorTest.mock.calls.length;
      expect(result.current).toEqual(1);

      rerender('b');
      expect(useFactorTest).toHaveBeenCalledTimes(count + 2);
      expect(result.current).toEqual(2);
    });
  });
});
