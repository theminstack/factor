import { describe, expect, jest, test } from '@jest/globals';
import { render, renderHook } from '@testing-library/react';

import { createFactor, useFactor } from './factor.js';
import { useFactorMountEffect } from './factor-mount-effect.js';

describe('useFactorMountEffect', () => {
  test('acts like on-mount outside of factor', () => {
    const handler = jest.fn();
    const { rerender, unmount } = renderHook(() => useFactorMountEffect(handler));

    expect(handler).toHaveBeenCalledTimes(1);
    rerender();
    expect(handler).toHaveBeenCalledTimes(1);
    unmount();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('called when factor mounted', () => {
    const handler = jest.fn();
    const TestFactor = createFactor(() => {
      useFactorMountEffect(handler);
    });
    const TestConsumer = () => {
      useFactor(TestFactor);
      return null;
    };
    const { rerender } = render(<TestFactor></TestFactor>);

    expect(handler).not.toHaveBeenCalled();
    rerender(
      <TestFactor>
        <TestConsumer />
      </TestFactor>,
    );
    expect(handler).toHaveBeenCalledTimes(1);
    rerender(
      <TestFactor>
        <TestConsumer />
        <TestConsumer />
      </TestFactor>,
    );
    expect(handler).toHaveBeenCalledTimes(2);
    rerender(<TestFactor></TestFactor>);
    expect(handler).toHaveBeenCalledTimes(2);
  });
});
