import { useEffect, useRef, useState } from 'react';

import { getObservableScope } from './observable.js';

const useFactorRefCount = () => {
  const observable = getObservableScope();
  const [count, setCount] = useState(observable?.count ?? -1);
  const countRef = useRef(count);

  useEffect(() => {
    return observable?.onSubscribe((newCount) => {
      if (countRef.current !== newCount) {
        countRef.current = newCount;
        setCount(newCount);
      }
    });
  }, [observable]);

  return count;
};

export { useFactorRefCount };
