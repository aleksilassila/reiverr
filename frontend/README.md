# Frontend

Here you can find an overview of the most important internal components and practices that are used in the frontend.

## Important Components

<!-- src/**App.svelte**

--- -->

[src/lib/components/**Container.svelte**](src/lib/components/Container.svelte)

A component that can be navigated to with dpad/keyboard, backbone of the dpad navigation system.

## Important Contexts and Stores

[src/lib/components/StackRouter/**stack-router.store.ts**](src/lib/components/StackRouter/stack-router.store.ts)

Provides access to the stack router, which is used for client side navigation and routing, as well as passing context between stack pages. Important functions:

- useComponentStack: provides access to the stack router component stack
- navigate: navigate to a url
- getContext, setContext, hasContext: custom context implementation, is used the same as svelte's context

---

[src/lib/stores/**data**/](src/lib/stores/data/)

Data fetching stores and utilities.

---

[src/lib/components/GlobalBackground/**background-stack.store.ts**](src/lib/components/GlobalBackground/background-stack.store.ts)

Provides access to the global background stack, which allows reusing backgrounds between pages.

<!-- ---

- breadcrumbsContext -->

## Notes & Tips

**backface-visibility: hidden**: Add to scroll containers to fix repaint issues on old browsers.

<!-- TODO: verify
**Prefer padding over margin**: Spacing should be done by parents. -->
