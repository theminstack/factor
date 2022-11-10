import { type Observable, createObservable } from './observable.js';

type Status = 'active' | 'idle';

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    [$REF_COUNT]?: Observable<number>;
    [$STATUS]?: Observable<Status>;
  }
}

const $STATUS = Symbol.for('$$FactorStatus');
const $REF_COUNT = Symbol.for('$$FactorRefCount');

const withContext = <TReturn, TArgs extends unknown[]>(
  useValueBase: (...args: TArgs) => TReturn,
): [
  useValue: (...args: TArgs) => TReturn,
  setRefCount: (count: number) => void,
  setStatus: (status: Status) => void,
] => {
  const observableStatus = createObservable<Status>('idle');
  const observableRefCount = createObservable<number>(0);

  const setRefCount = (count: number) => {
    if (count !== observableRefCount.value) {
      observableRefCount.next(count);
    }
  };

  const setStatus = (status: Status) => {
    if (status !== observableStatus.value) {
      observableStatus.next(status);
    }
  };

  const useValue = (...args: TArgs): TReturn => {
    try {
      window[$REF_COUNT] = observableRefCount;
      window[$STATUS] = observableStatus;
      return useValueBase(...args);
    } finally {
      window[$REF_COUNT] = undefined;
      window[$STATUS] = undefined;
    }
  };

  return [useValue, setRefCount, setStatus];
};

const getContext = () => ({
  refCount: window[$REF_COUNT],
  status: window[$STATUS],
});

export { getContext, withContext };
