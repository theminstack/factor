# react-factor

Convert React hooks into shared dynamic state.

- Improve efficiency over simple hoisting.
- Compose state and behavior using any React hook.
- Leverage React hook testing tools.
- Detect idle status when there are no consumers.
- Inherit parent state through recursion.

## How does it work?

Let's say we have a `useNotifications` hook. It's a complex hook which makes fetch requests to create notifications, and also polls for new notifications.

```tsx
const { notifications, addNotification } = useNotifications({
  api: 'https://.../notifications',
});
```

For a simple app, that's fine. But, as the app gets bigger, the hook state will need to be hoisted so that many things can send notifications, and one central thing can display them. React Factor makes this a very small change.

Create a Factor from the `useNotifications` hook.

```tsx
const NotificationsFactor = createFactor(useNotifications);
```

The returned Factor is a context provider. The `useNotifications` hook options are now the props of the `NotificationsFactor` component.

**NOTE:** Factor hooks must only accept zero or one props-like object arguments.

```tsx
render(
  <NotificationsFactor api="https://.../notifications">
    <App />
  </NotificationsFactor>,
);
```

The Factor state (ie. the value returned by `useNotifications`) can be accessed with the `useFactor` hook in any child component. When transitioning from hook to factor, you can just replace hook calls with `useFactor` calls.

```tsx
const { notifications, addNotification } = useFactor(NotificationsFactor);
```

### Selectors

The `useFactor` hook also accepts a second selector function argument. The hook will only trigger a re-render when the selected value changes. The selector receives the full factor `value`, and the `previous` selected value as arguments.

```tsx
// Only rerender when "value.addNotifications" is updated.
const addNotification = useFactor(NotificationsFactor, (value, previous) => {
  return value.addNotification;
});
```

**NOTE:** A selector should be a [pure function](https://en.wikipedia.org/wiki/Pure_function) with an implementation that does not change during the lifetime of the component. A literal arrow function without any outer scope references is recommended.

### Tuple Selectors

You can select tuples (multiple values) from the factor by providing an array or object map of selector functions. When this pattern is used, only the tuple values are compared (not the parent array or object reference) when deciding if an update is required.

```tsx
// Array Tuple
const [addNotification, removeNotification] = useFactor(NotificationsFactor, [
  (value, previous) => value.addNotifications,
  (value, previous) => value.removeNotifications,
]);

// Object Tuple
const { addNotification, removeNotification } = useFactor(NotificationsFactor, {
  addNotification: (value, previous) => value.addNotifications,
  removeNotification: (value, previous) => value.removeNotifications,
});
```

### Optional Factors

The `useFactor(Factor)` hook throws an error if it does not have a `Factor` parent. If a component doesn't need the Factor to work correctly, the `useOptionalFactor` hook can be used to return `undefined` instead of throwing.

```tsx
const valueOrUndefined = useOptionalFactor(NotificationsFactor);
```

A selector can be used to provide a default value.

```tsx
const notifications = useOptionalFactor(NotificationsFactor, (value, previous) => {
  return value.notifications ?? [];
});
```

### Factor Status

A factor hook (ie. the hook passed to `createFactor`) can detect whether or not the factor has any consumers with the `useFactorStatus` hook. This hook returns `"idle"` when there are no consumers, or `"active"` when consumers exist.

```tsx
const NotificationsFactor = createFactor((options: Options) => {
  const factorStatus = useFactorStatus();

  return useNotifications({
    ...options,
    // Provide a default value for the hook "enabled" option.
    enabled: options.enabled ?? factorStatus === 'active',
  });
});
```

**NOTE:** The `useFactorStatus` hook returns `"active"` when used outside of a Factor. A hook used outside of a factor is its own consumer, and therefore always active.

### Nested Recursive Factors

A Factor hook can reference its own Factor, allowing it to inherit the state from a parent of the same Factor type.

A simple example would be counting how many Factor parents a component has.

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

---

## How does it compare to alternatives?

The shared state management problem has been solved and re-resolved many times. However, it still seems like a major pain point when developing an application.

I can't reasonably go over all the alternatives. So, here are some that are popular and demonstrate some of the difficulties involved.

### React Context

For constant values, a simple custom context is probably your best option. But, for dynamic values, there are usually two solutions.

1. Create a class and provide instances through a context provider.
2. Create a stateful custom component which renders a context provider.

**Solution 1** is the most common and efficient (eg. the Redux store). But, the class will need its own lifecycle management and subscription mechanism to let consumers know when the class state changes. It lives outside of the React tree and therefore can't use hooks.

**Solution 2** is easier to implement, but will cause extra renders starting at the provider (instead of the consumers) every time the context state changes.

A Factor is a combination of these two solutions providing the best of both worlds. It can leverage react hooks, but moves them to a leaf/worker component which doesn't have any children to rerender. What is provided through context is a subscribable class instance which takes care of efficiently notifying consumers about updates.

### Redux

Redux does solve the same problems, but it comes bundled with two other things that might not be needed or wanted.

1. The Flux pattern.
2. Centralized state.

The Flux pattern is neat. But, [YAGNI](https://en.wikipedia.org/wiki/You_aren%27t_gonna_need_it).

Centralized state is another way to say [globals](https://www.baeldung.com/cs/global-variables#what-are-the-problems-with-global-variables), which are an attractive nuisance.

### Others

These are less popular (but still common) choices, with a scope similar to this library.

- [Constate](https://www.npmjs.com/package/constate) (most similar to this library)
  - Triggers re-renders at the provider.
- [Recoil](https://www.npmjs.com/package/recoil), [Jotai](https://www.npmjs.com/package/jotai)
  - Behavior cannot be defined using hooks.
- [use-context-selector](https://www.npmjs.com/package/use-context-selector)
  - Uses unstable internals.
  - Uses render side-effects incorrectly.
- [react-hooks-global-state](https://www.npmjs.com/package/react-hooks-global-state)
  - Behavior cannot be defined using hooks.
  - Does not use the React context system.

The basic requirement for any shared state solution, is that it should be more efficient than using a vanilla React context. But, `Constate` **triggers re-renders at the provider** whenever the state changes. This is extremely puzzling given its recent popularity. Either I'm missing something, or very few people are looking at the code and using it in places where performance problems would be noticed. It has selectors, but these the don't prevent any re-renders, and even potentially _increased_ the overhead by generating extra stacked contexts. Please let me know if I'm wrong about this.

The `Recoil`, `Jotai`, and `react-hooks-global-state` state **behavior cannot be defined using hooks**. They can be used _by_ hooks, but cannot themselves _use_ hooks in the atom or context definitions. This adds the knowledge overhead of separate state and lifecycle patterns. It adds complexity when integrating with React components and existing hooks. And, it means that none of the React hook testing infrastructure can be leveraged.

The `react-hooks-global-state` library **does not use the React context system** at all. Instead, it creates new hooks which are tied to a _global_ state. This is simple, but makes scoping difficult, if not impossible. It can also cause problems if two versions of the library are ever used together.

And finally, the `use-context-selector` library **uses unstable internals**, and also **uses render side-effects incorrectly**. It's academically interesting as a proposal proof-of-concept. However, it will break in future versions of React, potentially even in minor or patch version changes.
