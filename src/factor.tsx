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

const $CONTEXT = Symbol.for('$$FactorContext');

type Factor<TValue, TProps extends object> = ComponentType<TProps & { children?: ReactNode }> & {
  readonly [$CONTEXT]: Context<Observable<TValue> | undefined>;
};

type FactorHook = {
  <TValue>(factor: Pick<Factor<TValue, any>, typeof $CONTEXT>): TValue;
  <TValue, TSelector extends SelectorValue<TValue, any>>(
    factor: Pick<Factor<TValue, any>, typeof $CONTEXT>,
    selector: TSelector,
    dependencies?: unknown[],
  ): InferSelectedValue<TSelector>;
  <TValue, TSelector extends SelectorArray<TValue>>(
    factor: Pick<Factor<TValue, any>, typeof $CONTEXT>,
    selector: TSelector,
    dependencies?: unknown[],
  ): InferSelectedArray<TSelector>;
  <TValue, TSelector extends SelectorObject<TValue>>(
    factor: Pick<Factor<TValue, any>, typeof $CONTEXT>,
    selector: TSelector,
    dependencies?: unknown[],
  ): InferSelectedObject<TSelector>;
};

type OptionalFactorHook = {
  <TValue>(factor: Pick<Factor<TValue, any>, typeof $CONTEXT>): TValue | undefined;
  <TValue, TSelector extends SelectorValue<TValue | undefined, any>>(
    factor: Pick<Factor<TValue, any>, typeof $CONTEXT>,
    selector: TSelector,
    dependencies?: unknown[],
  ): InferSelectedValue<TSelector>;
  <TValue, TSelector extends SelectorArray<TValue | undefined>>(
    factor: Pick<Factor<TValue, any>, typeof $CONTEXT>,
    selector: TSelector,
    dependencies?: unknown[],
  ): InferSelectedArray<TSelector>;
  <TValue, TSelector extends SelectorObject<TValue | undefined>>(
    factor: Pick<Factor<TValue, any>, typeof $CONTEXT>,
    selector: TSelector,
    dependencies?: unknown[],
  ): InferSelectedObject<TSelector>;
};

const createFactor = <TValue, TProps extends object>(
  useValue: (() => TValue) | ((props: TProps) => TValue),
): Factor<TValue, TProps> => {
  const Worker = createWorker(useValue);
  const Context = createContext<Observable<TValue> | undefined>(undefined);
  const Factor = ({ children, ...props }: TProps & { children?: ReactNode }): JSX.Element => {
    const [observable, onObservable] = useState<Observable<TValue>>();

    return (
      <>
        <Worker onObservable={onObservable} useValueProps={props as TProps} />
        <Context.Provider value={observable}>{observable && children}</Context.Provider>
      </>
    );
  };

  Factor.displayName = 'Factor';
  Context.displayName = 'Factor';

  return Object.assign(Factor, { [$CONTEXT]: Context });
};

const useFactor: FactorHook = <TValue, TSelector extends Selector<TValue, any>>(
  factor: Pick<Factor<TValue, any>, typeof $CONTEXT>,
  selector?: TSelector,
  dependencies?: unknown[],
): InferSelected<TValue, TSelector | undefined> => {
  const observable = useContext(factor[$CONTEXT]);

  if (!observable) {
    throw new Error('factor parent is required');
  }

  return useObservable(observable, selector, dependencies);
};

const useOptionalFactor: OptionalFactorHook = <TValue, TSelector extends Selector<TValue | undefined, any>>(
  factor: Pick<Factor<TValue, any>, typeof $CONTEXT>,
  selector?: TSelector | undefined,
  dependencies?: unknown[],
): InferSelected<TValue | undefined, TSelector | undefined> => {
  const observable = useContext(factor[$CONTEXT]);

  return useObservable(observable, selector, dependencies);
};

export { type Factor, createFactor, useFactor, useOptionalFactor };
