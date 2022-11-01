import { useContext, useEffect, useRef, useState } from 'react';

import { type Factor } from './factor.js';

const identity = (value: any) => value;

const useFactor = <TResult, TSelected = TResult>(
  factor: Pick<Factor<TResult, any>, 'Context'>,
  selector: (result: TResult) => TSelected = identity,
): TSelected => {
  const observable = useContext(factor.Context);

  if (!observable) {
    throw new Error('factor parent is required');
  }

  const [result, setResult] = useState(() => selector(observable.current));
  const resultRef = useRef(result);
  const selectorRef = useRef(selector);

  useEffect(() => {
    selectorRef.current = selector;
  });

  useEffect(() => {
    return observable.onNext((newResult) => {
      const selectedResult = selectorRef.current(newResult);

      if (resultRef.current !== selectedResult) {
        resultRef.current = selectedResult;
        setResult(selectedResult);
      }
    });
  }, [observable]);

  return result;
};

export { useFactor };
