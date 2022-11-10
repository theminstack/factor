import { useEffect, useRef, useState } from 'react';

import { getContext } from './context.js';

const useFactorMountEffect = (effect: () => void) => {
  const context = useRef(getContext());
  const countRef = useRef(context.current.refCount?.value ?? 1);
  const [signal, setSignal] = useState(countRef.current > 0 ? {} : null);
  const effectRef = useRef(effect);

  useEffect(() => {
    effectRef.current = effect;
  });

  useEffect(() => {
    context.current.refCount?.onNext((value) => {
      if (value > countRef.current) {
        setSignal({});
      }

      countRef.current = value;
    });
  }, []);

  useEffect(() => {
    if (signal) {
      effectRef.current();
    }
  }, [signal]);
};

export { useFactorMountEffect };
