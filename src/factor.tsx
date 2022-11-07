import { type ComponentType, type Context, type ReactNode, createContext, useContext, useState } from 'react';

import { type Observable, useObservable } from './observable.js';
import {
  type InferSelected,
  type InferSelectedArray,
  type InferSelectedObject,
  type InferSelectedValue,
  type Selector,
  type SelectorArray,
  type SelectorObject,
  type SelectorValue,
} from './selector.js';
import { createWorker } from './worker.js';

type Factor<TValue, TProps extends object> = ComponentType<TProps & { children?: ReactNode }> & {
  readonly Context: Context<Observable<TValue> | undefined>;
};

type FactorHook = {
  <TValue>(factor: Pick<Factor<TValue, any>, 'Context'>): TValue;
  <TValue, TSelector extends SelectorValue<TValue, any>>(
    factor: Pick<Factor<TValue, any>, 'Context'>,
    selector: TSelector,
    dependencies?: unknown[],
  ): InferSelectedValue<TSelector>;
  <TValue, TSelector extends SelectorArray<TValue>>(
    factor: Pick<Factor<TValue, any>, 'Context'>,
    selector: TSelector,
    dependencies?: unknown[],
  ): InferSelectedArray<TSelector>;
  <TValue, TSelector extends SelectorObject<TValue>>(
    factor: Pick<Factor<TValue, any>, 'Context'>,
    selector: TSelector,
    dependencies?: unknown[],
  ): InferSelectedObject<TSelector>;
};

type OptionalFactorHook = {
  <TValue>(factor: Pick<Factor<TValue, any>, 'Context'>): TValue | undefined;
  <TValue, TSelector extends SelectorValue<TValue | undefined, any>>(
    factor: Pick<Factor<TValue, any>, 'Context'>,
    selector: TSelector,
    dependencies?: unknown[],
  ): InferSelectedValue<TSelector>;
  <TValue, TSelector extends SelectorArray<TValue | undefined>>(
    factor: Pick<Factor<TValue, any>, 'Context'>,
    selector: TSelector,
    dependencies?: unknown[],
  ): InferSelectedArray<TSelector>;
  <TValue, TSelector extends SelectorObject<TValue | undefined>>(
    factor: Pick<Factor<TValue, any>, 'Context'>,
    selector: TSelector,
    dependencies?: unknown[],
  ): InferSelectedObject<TSelector>;
};

const createFactor = <TValue, TProps extends object>(
  useValue: (() => TValue) | ((props: TProps) => TValue),
): Factor<TValue, TProps> => {
  const Worker = createWorker(useValue);
  const Factor = ({ children, ...props }: TProps & { children?: ReactNode }): JSX.Element => {
    const [observable, onObservable] = useState<Observable<TValue>>();

    return (
      <>
        <Worker onObservable={onObservable} useValueProps={props as TProps} />
        <Factor.Context.Provider value={observable}>{observable && children}</Factor.Context.Provider>
      </>
    );
  };

  Factor.Context = createContext<Observable<TValue> | undefined>(undefined);
  Factor.Context.displayName = 'Factor';

  return Factor;
};

const useFactor: FactorHook = <TValue, TSelector extends Selector<TValue, any>>(
  factor: Pick<Factor<TValue, any>, 'Context'>,
  selector?: TSelector,
  dependencies?: unknown[],
): InferSelected<TValue, TSelector | undefined> => {
  const observable = useContext(factor.Context);

  if (!observable) {
    throw new Error('factor parent is required');
  }

  return useObservable(observable, selector, dependencies);
};

const useOptionalFactor: OptionalFactorHook = <TValue, TSelector extends Selector<TValue | undefined, any>>(
  factor: Pick<Factor<TValue, any>, 'Context'>,
  selector?: TSelector | undefined,
  dependencies?: unknown[],
): InferSelected<TValue | undefined, TSelector | undefined> => {
  const observable = useContext(factor.Context);

  return useObservable(observable, selector, dependencies);
};

export { type Factor, createFactor, useFactor, useOptionalFactor };
