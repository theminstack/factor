# react-factor

Convert React hooks into shared dynamic state.

## How does it work?

Let's say we have a `useNotifications` hook. It's a complex hook which makes fetch requests to create notifications, and also polls for new notifications.

```tsx
const {
  notifications,
  addNotification
} = useNotifications({ api: "https://.../notifications" });
```

If the app is simple, and notifications are created and consumed in close proximity, then that hook might be all that is needed.

As an app gets more complex, notifications might be generated and consumed in widely separated app components. React Factor makes it simple to hoist the hook that was already working, turning it into a shared dynamic state.

Create a Factor from the `useNotifications` hook.

```tsx
const NotificationsFactor = createFactor(useNotifications);
```

The returned Factor is a context provider, which is a _required_ parent for any component which uses the Factor. The `useNotification` hook options are now the props of the `NotificationsFactor` component.

```tsx
render(
  <NotificationsFactor api="https://.../notifications">
    <App />
  </NotificationsFactor>
)
```

Now the app can use the Factor instead of the original hook.

```tsx
const {
  notifications,
  addNotification
} = useFactor(NotificationsFactor);
```

To avoid even more unnecessary renders, consumers can subscribe to only part of the Factor's state by passing a "selector" function to the `useFactor` hook.

```tsx
// This will only rerender if result.addNotifications changes.
const addNotification = useFactor(NotificationsFactory, (result) => {
  return result.addNotification;
});
```

## Why not just create a custom context?

For constant values, a simple custom context is probably your best option. But, for dynamic values, there are usually two solutions.

1. Create a class and provide instances through a context provider.
2. Create a stateful custom component which renders a context provider.

**Solution 1** is the most common and efficient (eg. the Redux store). But, the class will need its own lifecycle management and subscription mechanism to let consumers know when the class state changes. It lives outside of the React tree and therefore can't use hooks.

**Solution 2** is easier to implement, but will cause extra renders starting at the provider (instead of the consumers) every time the context state changes.

A Factor is a combination of these two solutions giving you the best of both worlds. It lets you leverage react hooks, but moves them to a leaf/worker component which doesn't have any children to rerender. What is provided through context is a subscribable class instance which takes care of efficiently notifying consumers about updates.

## Why not Redux?

Redux does solve the same problems, but it comes bundled with two other things you might not need or want.

1. The Flux pattern.
2. Centralized state.

The Flux pattern is neat. But, [YAGNI](https://en.wikipedia.org/wiki/You_aren%27t_gonna_need_it).

Centralized state is another way to say [globals](https://www.baeldung.com/cs/global-variables#what-are-the-problems-with-global-variables), which are an attractive nuisance.
