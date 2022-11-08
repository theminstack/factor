import { describe, expect, jest, test } from '@jest/globals';
import { renderHook } from '@testing-library/react';

import { createFactor, useFactor } from './factor.js';
import { useFactorStatus } from './factor-status.js';

describe('useFactorStatus', () => {
  test('active when outside of factor', () => {
    const { result } = renderHook(() => useFactorStatus());
    expect(result.current).toBe('active');
  });

  test('idle or active in a factor', () => {
    const useFactorStatusSpy = jest.fn().mockImplementation(useFactorStatus);
    const TestFactor = createFactor(() => {
      return useFactorStatusSpy();
    });

    renderHook(() => undefined, {
      wrapper: ({ children }) => <TestFactor>{children}</TestFactor>,
    });
    expect(useFactorStatusSpy).toHaveLastReturnedWith('idle');

    const { result } = renderHook(() => useFactor(TestFactor), {
      wrapper: ({ children }) => <TestFactor>{children}</TestFactor>,
    });
    expect(result.current).toBe('active');
  });
});
