# MinStack Factor

Minimal shared dynamic states by hoisting [React Hooks](https://reactjs.org/docs/hooks-intro.html) up to [React Contexts](https://reactjs.org/docs/context.html).

[![build](https://github.com/theminstack/factor/actions/workflows/build.yml/badge.svg)](https://github.com/theminstack/factor/actions/workflows/build.yml)
[![codecov](https://codecov.io/gh/theminstack/factor/branch/main/graph/badge.svg?token=JDXG5NL0L6)](https://codecov.io/gh/theminstack/factor)

**Goals and Features:**

- Improve efficiency over custom dynamic contexts or simple hoisting.
- Compose state and behavior using any React hook.
- Leverage React hook testing tools.
- Reference parent state when nested.
- Change behavior based on idle or active status.
- Update when new consumers are mounted.

**Table of Contents:**

- [Get Started](#get-started)
  - [Select Single Values](#select-single-values)
  - [Select Tuples](#select-tuples)
  - [Use Optional Factors](#use-optional-factors)
  - [Reference Parent State](#reference-parent-state)
- [Use Consumer Information](#use-consumer-information)
  - [Handle Factor Idle or Active](#handle-factor-idle-or-active)
  - [Handle Factor Mounted](#handle-factor-mounted)
- [Compare Alternatives](#compare-alternatives)
  - [React Context](#react-context)
  - [Redux](#redux)
  - [Others](#others)

## Get Started

Let's say we have a `useAlerts` hook. This is something that might be used to show banners at the top of a page, or with an inbox icon in the app header.

```tsx
const { alerts, addAlert, removeAlert } = useAlerts({ expire: 5000 });
```

As an app grows, the places that generate alerts will become more widely separated from the alerts display, resulting in more "property drilling". React Factor makes it easy to hoist the alerts hook and then access the state in children, without having to pass down properties through parent components.

Create a factor from the `useAlerts` hook.

```tsx
import { createFactor } from '@minstack/factor';

const AlertsFactor = createFactor(useAlerts);
```

The returned factor is a context provider. The `useAlerts` hook _options_ are now the _props_ of the `AlertsFactor` component.

> **Note:** Factor hooks may only accept one props-like object argument.

```tsx
<AlertsFactor expire={5000}>{children}</AlertsFactor>
```

The factor state (ie. the value returned by `useAlerts`) can be accessed with the `useFactor` hook in any child component. When transitioning from hook to factor, hook calls can be swapped 1:1 with `useFactor` calls.

```tsx
// Before
const { alerts, addAlert, removeAlert } = useAlerts({ expire: 5000 });
// After
const { alerts, addAlert, removeAlert } = useFactor(AlertsFactor);
```

### Select Single Values

The `useFactor` hook also accepts a second selector function argument. The hook will only trigger a re-render when the selected value changes.

```tsx
// Only rerender when "value.addAlert" is updated.
const addAlert = useFactor(AlertsFactor, (value) => {
  return value.addAlert;
});
```

Ideally, selectors should be [pure functions](https://en.wikipedia.org/wiki/Pure_function) with implementations that do not change during the lifetime of a component. A literal arrow function without any outer scope references is recommended.

However, if you need to reference values from the component scope, the `useFactor` hook accepts a third dependency array argument (much like React's `useCallback` hook) which will trigger reselection when dependencies change.

```tsx
const { alertId } = props;
// Rerenders when the alertId or the selected alert are updated.
const alert = useFactor(AlertsFactor, (value) => value.alerts[alertId], [alertId]);
```

### Select Tuples

Tuples (multiple values) can be selected from a factor by providing an array or object map of selector functions. When this pattern is used, only tuple _values_ are compared (not the containing array or object reference) when deciding if an update is required.

```tsx
// Array Tuple
const [addAlert, removeAlert] = useFactor(AlertsFactor, [(value) => value.addAlert, (value) => value.removeAlert]);

// Object Tuple
const { addAlert, removeAlert } = useFactor(AlertsFactor, {
  addAlert: (value) => value.addAlert,
  removeAlert: (value) => value.removeAlert,
});
```

### Use Optional Factors

The `useFactor(Factor)` hook throws an error if it does not have a `Factor` parent. If a component doesn't need the factor to work correctly, the `useOptionalFactor` hook can be used to return `undefined` instead of throwing.

```tsx
const valueOrUndefined = useOptionalFactor(AlertsFactor);
```

When an optional factor hook has no factor parent, the selector is still called with an undefined `value`. Therefore, selectors can be used to provide default values when used with optional factors.

```tsx
const alerts = useOptionalFactor(AlertsFactor, (value) => {
  return value ? value.alerts : [];
});
```

### Reference Parent State

A factor hook can reference its own factor, allowing it to inherit the state from a parent of the same factor type.

A simple example would be counting how many factor parents a component has.

```tsx
const NestingFactor = createFactor(() => {
  return useOptionalFactor(NestingFactor, (value = 0) => value + 1);
});

const NestingCount = () => {
  const count = useOptionalFactor(NestingFactor, (value = 0) => value);
  return <div>{count}</div>;
};

render(
  <NestingFactor>
    <NestingFactor>
      <NestingCount />
    </NestingFactor>
  </NestingFactor>,
);

// Rendered: <div>2</div>
```

## Use Consumer Information

A factor can react to consumers (ie. components which use the factor) in the following ways.

- Change behavior based on whether or not consumers exist.
- Take action when a consumer is mounted.

### Handle Factor Idle or Active

The `useFactorStatus` hook returns `"idle"` when there are no consumers, or `"active"` when consumers exist.

```tsx
const AlertsFactor = createFactor((options: Options) => {
  const factorStatus = useFactorStatus();

  return useAlerts({
    ...options,
    // Provide a default value for the hook "enabled" option.
    enabled: options.enabled ?? factorStatus === 'active',
  });
});
```

The `useFactorStatus` hook also returns `"active"` when used outside of a factor. A hook used outside of a factor is its own consumer, and therefore always active.

### Handle Factor Mounted

The `useFactorMountEffect` performs a side-effect when a consumer is mounted.

> **Note:** Detecting individual consumer unmounts is not supported. See [useFactorStatus](#handle-factor-idle-or-active) to detect no consumers.

```tsx
const AlertsFactor = createFactor((options: Options) => {
  const value = useAlerts(options);

  useFactorMountEffect(() => {
    value.update();
  });

  return value;
});
```

When used outside of a factor, the effect will be run once on mount. A hook used outside of a factor is its own consumer, and therefore a consumer is mounted when the hook is mounted.

## Compare Alternatives

The shared state management problem has been solved and re-resolved many times. However, it still seems like a major pain point when developing an application.

I can't reasonably go over all the alternatives. So, here are some that are popular and demonstrate some of the difficulties involved.

### React Context

For constant values, a simple custom context is probably the best option. But, for dynamic values, there are usually two solutions.

1. Create a class and provide instances through a context provider.
2. Create a stateful custom component which renders a context provider.

**Solution 1** is the most common and efficient (eg. the Redux store). But, the class will need its own lifecycle management and subscription mechanism to let consumers know when the class state changes. It lives outside of the React tree and therefore can't use hooks.

**Solution 2** is easier to implement, but will cause extra renders starting at the provider (instead of the consumers) every time the context state changes.

A factor is a combination of these two solutions providing the best of both worlds. It can leverage react hooks, but moves them to a leaf/worker component which doesn't have any children to rerender. What is provided through context is a subscribable class instance which takes care of efficiently notifying consumers about updates.

### Redux

Redux does solve the same problems, but it comes bundled with two other things that might not be needed or wanted.

1. The Flux pattern.
2. Centralized state.

The Flux pattern is neat. But, [YAGNI](https://en.wikipedia.org/wiki/You_aren%27t_gonna_need_it).

Centralized state is another way to say [globals](https://www.baeldung.com/cs/global-variables#what-are-the-problems-with-global-variables), which are an attractive nuisance.

### Others

These are less popular (but still common) choices, with a scope similar to this library.

- [Constate](https://www.npmjs.com/package/constate) (most similar to this library)
  - Triggers rerenders at the provider.
- [Recoil](https://www.npmjs.com/package/recoil), [Jotai](https://www.npmjs.com/package/jotai), [Zustand](https://www.npmjs.com/package/zustand)
  - Behavior cannot be defined using hooks.
- [use-context-selector](https://www.npmjs.com/package/use-context-selector)
  - Uses unstable internals.
  - Uses render side-effects incorrectly.
- [react-hooks-global-state](https://www.npmjs.com/package/react-hooks-global-state)
  - Behavior cannot be defined using hooks.
  - Does not use the React context system.

The basic requirement for any shared state solution, is that it should be more efficient than using a vanilla React context. But, `Constate` **triggers rerenders at the provider** whenever the state changes. This is extremely puzzling given its recent popularity. Either I'm missing something, or very few people are looking at the code and using it in places where performance problems would be noticed. It has selectors, but these the don't prevent any rerenders, and even potentially _increased_ the overhead by generating extra stacked contexts. Please let me know if I'm wrong about this.

The `Recoil`, `Jotai`, `Zustand`, and `react-hooks-global-state` state **behavior cannot be defined using hooks**. They can be used _by_ hooks, but cannot themselves _use_ hooks in the atom or context definitions. This means that you can't easily uplift or reuse any of your existing hooks. It adds knowledge overhead for the patterns specific to a library. And, the React hooks testing infrastructure can't be leveraged directly.

The `react-hooks-global-state` library **does not use the React context system** at all. Instead, it creates new hooks which are tied to a _global_ state. This is simple, but makes scoping difficult, if not impossible. It can also cause problems if two versions of the library are ever used together.

And finally, the `use-context-selector` library **uses unstable internals**, and also **uses render side-effects incorrectly**. It's academically interesting as a proposal proof-of-concept. However, it will break in future versions of React, potentially even in minor or patch version changes.
