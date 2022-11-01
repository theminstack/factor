import { type ReactNode } from 'react';

import { type Observable } from './observable.js';

type Props<TResult> = {
  readonly children?: ReactNode;
  readonly observable: Observable<TResult>;
};

const Renderer = <TResult,>({ observable, children }: Props<TResult>): JSX.Element | null => {
  return observable.initialized ? <>{children}</> : null;
};
Renderer.displayName = 'ReactFactorRenderer';

export { Renderer };
