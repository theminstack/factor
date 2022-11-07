type SelectorValue<TValue, TSelected> = (value: TValue) => TSelected;
type SelectorArray<TValue> = readonly [SelectorValue<TValue, unknown>] | readonly SelectorValue<TValue, unknown>[];
type SelectorObject<TValue> = Readonly<Record<string, SelectorValue<TValue, unknown>>>;
type Selector<TValue, TSelected> = SelectorArray<TValue> | SelectorObject<TValue> | SelectorValue<TValue, TSelected>;

type InferSelectedValue<TSelector extends SelectorValue<any, any>> = ReturnType<TSelector>;
type InferSelectedArray<TSelector extends SelectorArray<any>> = {
  [P in keyof TSelector]: TSelector[P] extends SelectorValue<any, any> ? ReturnType<TSelector[P]> : never;
};
type InferSelectedObject<TSelector extends SelectorObject<any>> = {
  [P in keyof TSelector]: ReturnType<TSelector[P]>;
};
type InferSelected<TValue, TSelector extends Selector<TValue, any> | undefined> = TSelector extends undefined
  ? TValue
  : TSelector extends SelectorValue<TValue, any>
  ? InferSelectedValue<TSelector>
  : TSelector extends SelectorArray<TValue>
  ? InferSelectedArray<TSelector>
  : TSelector extends SelectorObject<TValue>
  ? InferSelectedObject<TSelector>
  : never;

const getSelectorValue = <TValue, TSelector extends Selector<TValue, any> | undefined>(
  selectors: TSelector,
  value: TValue,
): InferSelected<TValue, TSelector> => {
  return !selectors
    ? value
    : typeof selectors === 'function'
    ? selectors(value)
    : Array.isArray(selectors)
    ? (selectors as SelectorArray<TValue>).map((selector) => selector(value))
    : (Object.entries(selectors).reduce<Record<string, any>>((object, [key, selector]) => {
        object[key] = selector(value);
        return object;
      }, Object.create(null)) as InferSelected<TValue, TSelector>);
};

export {
  type InferSelected,
  type InferSelectedArray,
  type InferSelectedObject,
  type InferSelectedValue,
  type Selector,
  type SelectorArray,
  type SelectorObject,
  type SelectorValue,
  getSelectorValue,
};
