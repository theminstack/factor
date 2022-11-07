import { type ComponentType, useEffect, useLayoutEffect, useMemo, useRef } from 'react';

import { withFactorStatus } from './factor-status.js';
import { type Observable, createObservable } from './observable.js';

type Props<TValue, TProps extends object> = {
  onObservable: (observable: Observable<TValue>) => void;
  useValueProps: TProps;
};

const useIsometricEffect =
  typeof window !== 'undefined' && Boolean(window.document?.createElement) ? useLayoutEffect : useEffect;

const useSingleton = <TValue,>(init: () => TValue): TValue => {
  const initRef = useRef(init);
  return useMemo(() => initRef.current(), []);
};

const createWorker = <TValue, TProps extends object>(
  useValue: (props: TProps) => TValue,
): ComponentType<Props<TValue, TProps>> => {
  const [useFactorValue, setFactorStatus] = withFactorStatus(useValue);
  const Worker = ({ onObservable, useValueProps }: Props<TValue, TProps>) => {
    const value = useFactorValue(useValueProps);
    const observable = useSingleton(() =>
      createObservable(value, (refCount) => setFactorStatus(refCount > 0 ? 'active' : 'idle')),
    );

    useIsometricEffect(() => {
      observable.next(value);
    }, [value, observable]);

    useIsometricEffect(() => {
      onObservable(observable);
    }, []);

    return null;
  };
  Worker.displayName = 'Factor.Worker';

  return Worker;
};

export { createWorker };
