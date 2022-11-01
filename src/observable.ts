const scope = Symbol.for('$$ReactFactorObservableScope');

type Observable<TResult> = {
  readonly count: number;
  current: TResult;
  initialized: boolean;
  readonly next: (result: TResult) => void;
  readonly onNext: (subscriber: (result: TResult) => void) => () => void;
  readonly onSubscribe: (listener: (count: number) => void) => () => void;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    [scope]?: Observable<any>;
  }
}

const createObservable = <TResult>(): Observable<TResult> => {
  const nextListeners = new Set<(result: TResult) => void>();
  const onNextListeners = new Set<(count: number) => void>();
  const observable: Observable<TResult> = {
    get count() {
      return nextListeners.size;
    },
    current: undefined as TResult,
    initialized: false,
    next: (result) => {
      observable.current = result;
      nextListeners.forEach((listener) => listener(result));
    },
    onNext: (newListener) => {
      newListener = newListener.bind(null);
      newListener(observable.current);
      nextListeners.add(newListener);
      onNextListeners.forEach((listener) => listener(nextListeners.size));
      return () => {
        if (nextListeners.delete(newListener)) {
          onNextListeners.forEach((listener) => listener(nextListeners.size));
        }
      };
    },
    onSubscribe: (newListener) => {
      newListener = newListener.bind(null);
      newListener(onNextListeners.size);
      onNextListeners.add(newListener);
      return () => onNextListeners.delete(newListener);
    },
  };

  return observable;
};

const setObservableScope = (observable: Observable<any> | undefined) => {
  window[scope] = observable;
};

const getObservableScope = (): Observable<any> | undefined => {
  return window[scope];
};

export { type Observable, createObservable, getObservableScope, setObservableScope };
