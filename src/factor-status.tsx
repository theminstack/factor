import { useCallback, useEffect, useRef, useState } from 'react';

import { type Observable, createObservable } from './observable.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    [$STATUS]?: Observable<FactorStatus>;
  }
}

type FactorStatus = 'active' | 'idle';

const $STATUS = Symbol.for('$$FactorStatus');

const withFactorStatus = <TReturn, TArgs extends unknown[]>(
  useValueBase: (...args: TArgs) => TReturn,
): [useValue: (...args: TArgs) => TReturn, setStatus: (status: FactorStatus) => void] => {
  const observable = createObservable<FactorStatus>('idle');
  const setStatus = (status: FactorStatus) => {
    if (status !== observable.value) {
      observable.next(status);
    }
  };
  const useValue = (...args: TArgs): TReturn => {
    try {
      window[$STATUS] = observable;
      return useValueBase(...args);
    } finally {
      window[$STATUS] = undefined;
    }
  };

  return [useValue, setStatus];
};

const useFactorStatus = (): FactorStatus => {
  const observable = window[$STATUS];
  const [status, setStatus] = useState(observable?.value ?? 'active');
  const statusRef = useRef(status);

  const update = useCallback((newStatus: FactorStatus = 'active') => {
    if (statusRef.current !== newStatus) {
      statusRef.current = newStatus;
      setStatus(newStatus);
    }
  }, []);

  useEffect(() => {
    observable?.onNext(update);
    update(observable?.value);
  }, [observable, update]);

  return status;
};

export { type FactorStatus, useFactorStatus, withFactorStatus };
