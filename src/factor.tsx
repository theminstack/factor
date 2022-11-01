import { type ComponentType, type Context, type ReactNode, createContext, useMemo } from 'react';

import { type Observable, createObservable } from './observable.js';
import { Renderer } from './renderer.js';
import { Worker } from './worker.js';

type Factor<TResult, TProps extends object> = ComponentType<TProps & { children?: ReactNode }> & {
  readonly Context: Context<Observable<TResult> | undefined>;
};

const createFactor = <TResult, TProps extends object>(
  hook: (() => TResult) | ((props: TProps) => TResult),
): Factor<TResult, TProps> => {
  const Factor = ({ children, ...props }: TProps & { children?: ReactNode }): JSX.Element => {
    const observable = useMemo(() => createObservable<TResult>(), []);

    return (
      <>
        <Worker observable={observable} hook={hook} hookProps={props as TProps} />
        <Renderer observable={observable}>
          <Factor.Context.Provider value={observable}>{children}</Factor.Context.Provider>
        </Renderer>
      </>
    );
  };
  Factor.Context = createContext<Observable<TResult> | undefined>(undefined);

  return Factor;
};

export { type Factor, createFactor };
