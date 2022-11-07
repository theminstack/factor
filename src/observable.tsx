import { useCallback, useEffect, useRef, useState } from 'react';

import { type InferSelected, type Selector, getSelectorValue } from './selector.js';

type Observable<TValue> = {
  readonly next: (value: TValue) => void;
  readonly onNext: (listener: (value: TValue) => void) => () => void;
  readonly value: TValue;
};

const isPlainObject = (value: any): value is Record<string, any> => {
  return Boolean(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
};

const isTupleChanged = (a: any, b: any): boolean => {
  const aType = typeof a;
  const bType = typeof b;

  if (aType !== bType) return true;

  if (aType === 'object') {
    if (Array.isArray(a)) {
      if (!Array.isArray(b)) return true;
      if (a.length !== b.length) return true;

      for (let i = a.length - 1; i >= 0; i--) {
        if (a[i] !== b[i]) return true;
      }

      return false;
    }

    if (isPlainObject(a)) {
      if (!isPlainObject(b)) return true;

      const keys = Object.keys(a);

      if (keys.length !== Object.keys(b).length) return true;

      for (const key of keys) {
        if (a[key] !== b[key]) return true;
      }

      return false;
    }
  }

  return a !== b;
};

const createObservable = <TValue,>(initialValue: TValue, onRefCount?: (value: number) => void): Observable<TValue> => {
  const onNextCallbacks = new Set<(value: TValue) => void>();
  const observable = {
    next: (newValue: TValue): void => {
      observable.value = newValue;
      onNextCallbacks.forEach((callback) => callback(observable.value));
    },
    onNext: (listener: (value: TValue) => void): (() => void) => {
      listener = listener.bind(null);
      onNextCallbacks.add(listener);
      onRefCount?.(onNextCallbacks.size);

      return () => {
        if (onNextCallbacks.delete(listener)) {
          onRefCount?.(onNextCallbacks.size);
        }
      };
    },
    value: initialValue,
  };

  return observable;
};

const useObservable = <
  TObservable extends Observable<any> | undefined,
  TValue extends TObservable extends Observable<infer TObservableValue> ? TObservableValue : undefined,
  TSelector extends Selector<TValue, any> | undefined,
>(
  observable: TObservable,
  selector: TSelector,
  dependencies: unknown[] = [],
): InferSelected<TValue, TSelector> => {
  const selectorRef = useRef(selector);
  const [value, setValue] = useState(() => getSelectorValue(selectorRef.current, observable?.value));
  const valueRef = useRef(value);

  const update = useCallback((newValue: TValue): void => {
    const selected = getSelectorValue(selectorRef.current, newValue);
    const isUpdated =
      typeof selectorRef.current === 'function' ? newValue !== selected : isTupleChanged(valueRef.current, selected);

    if (isUpdated) {
      valueRef.current = selected;
      setValue(() => selected);
    }
  }, []);

  useEffect(() => {
    selectorRef.current = selector;
  });

  useEffect(() => {
    return observable?.onNext(update);
  }, [observable, update]);

  useEffect(() => {
    update(observable?.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [observable, update, ...dependencies]);

  return value;
};

export { type Observable, createObservable, useObservable };
