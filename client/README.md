## issues fix

```JS
// Issue fix 1

attachTokenInterceptor adds a new interceptor every time it's called. If you're calling it inside a component or hook that re-renders, you'll end up with multiple interceptors stacking up, each calling getToken() — meaning one request could be waiting for multiple token fetches serially

getToken from Clerk has an unstable reference
— it may change on every render,

causing useEffect to run repeatedly,
briefly leaving a window where no interceptor is attached (ejected old, not yet attached new).

Any request fired in that gap goes out without a token.
Fix — stabilize with useCallback or use a ref:
```

---

```JS
requestLock ref removed — Zustand's get().loading check inside the store action does the same job without needing a ref.
useState calls removed — displayTitle, data, and loading all live in the store now, so the component has zero local state.
Auth/nav logic stays in the component — Zustand stores shouldn't import Clerk or router hooks; those are React-context-dependent and belong at the component layer.
Error handling stays in the component — Toasts are UI side-effects, so the store just throws and lets the component catch and display them.
```

---

```JS
 // if (Array.isArray((data as any)?.links)) return (data as any).links;
  // if (Array.isArray((data as any)?.data)) return (data as any).data;
  const obj = data as { links?: unknown; data?: unknown };
```

```
VITE_BACKEND=http://localhost:5000/api
VITE_SERVER=https://link.onrender.com/api
VITE_CLERK_PUBLISHABLE_KEY=
```
