import { useEffect, useRef, useState } from 'react';

import { type Observable, setObservableScope } from './observable.js';

type Props<TResult, TProps extends object> = {
  readonly hook: (props: TProps) => TResult;
  readonly hookProps: TProps;
  readonly observable: Observable<TResult>;
};

const Worker = <TResult, TProps extends object>({ observable, hook, hookProps }: Props<TResult, TProps>): null => {
  let result: TResult;

  try {
    setObservableScope(observable);
    result = hook(hookProps);
  } finally {
    setObservableScope(undefined);
  }

  const resultRef = useRef(result);

  // Initialize the observable on first render to avoid a delay in rendering
  // consumer children. This borders on breaking the React side effects
  // contract. However, if the consumer children were rendered by this Worker
  // component instead of the sibling Renderer component, they would receive
  // this initial state on first render. The "observable.initialized" flag is
  // there to guard against changes in the React rendering order which might
  // cause the observable to be uninitialized when the Renderer children are
  // mounted.
  useState(() => {
    observable.current = result;
    observable.initialized = true;
  });

  useEffect(() => {
    if (resultRef.current !== result) {
      resultRef.current = result;
      observable.next(result);
    }
  }, [observable, result]);

  return null;
};
Worker.displayName = 'ReactFactorWorker';

export { Worker };
