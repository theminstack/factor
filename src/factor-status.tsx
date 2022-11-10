import { useEffect, useRef, useState } from 'react';

import { getContext } from './context.js';

type FactorStatus = 'active' | 'idle';

const useFactorStatus = (): FactorStatus => {
  const context = useRef(getContext());
  const [status, setStatus] = useState(context.current.status?.value ?? 'active');
  const statusRef = useRef(status);

  useEffect(() => {
    const update = (newStatus: FactorStatus = 'active') => {
      if (statusRef.current !== newStatus) {
        statusRef.current = newStatus;
        setStatus(newStatus);
      }
    };

    context.current.status?.onNext(update);
    update(context.current.status?.value);
  }, []);

  return status;
};

export { type FactorStatus, useFactorStatus };
