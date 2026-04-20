---
name: cleanup-fe
description: "Post-feature frontend cleanup — enforce CLAUDE.md standards + RN performance, fintech data correctness, paywall/entitlement integrity, memory safety, accessibility, and platform consistency. Security concerns are handled by the security-audit skill."
disable-model-invocation: true
argument-hint: [scope e.g. src/features/analytics, or blank for changed files]
allowed-tools: Bash Grep Read Edit Glob Agent
effort: max
---

# Post-Feature Frontend Cleanup

Clean up frontend code after a feature push. Enforces CLAUDE.md project conventions AND industry best practices for React Native fintech apps.

**Scope:** If `$ARGUMENTS` is provided, focus on those paths under `frontend/`. Otherwise, detect changed frontend files by running `git diff --name-only main...HEAD -- frontend/`. If on `main`, default to `git diff --name-only HEAD~1 -- frontend/` (last commit only) and suggest the user pass an explicit scope via `$ARGUMENTS` if they want a wider sweep.

Work through each section in order. For every issue found, fix it — don't just report it.

> **Security scope:** Deep security review (auth flows, token storage, WebView origins, deep link validation, Stripe webhook integrity, etc.) is handled by the `security-audit` skill. This skill covers only the lightweight security sanity checks that are cheap to verify during routine cleanup. For anything beyond the basics here, run `security-audit`.

---

## P0 — Critical (always fix)

### 1. Financial Data Correctness
- **All currency amounts must go through a single formatting utility** (e.g. `formatCurrency` in `formatters.ts`) — never raw `toFixed(2)` in components
- Use `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })` — not string concatenation
- Never do floating-point arithmetic on currency without rounding at the final display step — `0.1 + 0.2 !== 0.3`
- Verify zero amounts render as `$0.00`, not `$0` or empty
- Verify negative amounts (refunds) display consistently across all screens — pick `($45.00)` or `-$45.00` and enforce one style
- Currency symbol must always be present — never display a bare number for financial amounts

### 2. Memory Leak Prevention
- Every `setTimeout` / `setInterval` must have `clearTimeout` / `clearInterval` in `useEffect` cleanup
- Every `addEventListener` (DOM or RN) must have a matching `removeEventListener` in cleanup — audit drag/drop hooks especially
- Async operations that set state must use `AbortController` signal or a mounted ref to prevent updates after unmount
- Supabase `onAuthStateChange` must return and call its unsubscribe function in cleanup
- `Dimensions.addEventListener` (if used) must be cleaned up

### 3. Security Sanity Checks (lightweight only)

These are cheap, grep-able checks worth doing on every cleanup pass. For a full security review, run the `security-audit` skill instead.

- No `console.log` / `console.warn` / `console.error` that outputs transaction data, amounts, emails, user IDs, or tokens
- No `any` in TypeScript — type safety holes compound into runtime bugs, especially around money
- No hardcoded secrets, API keys, or URLs — must come from `EXPO_PUBLIC_*` env vars
- Grep for `sk_live_`, `sk_test_`, `access-production-`, `whsec_` under `frontend/` — none should exist in frontend code
- No Plaid access tokens referenced in frontend at all — they are backend-only

If anything in this section fails, fix it AND recommend running `security-audit` before the next release.

### 3a. Entitlement & Paywall Integrity

With Stripe now connected and the freemium paywall live, paywall bypass is the #1 billing risk on the frontend.

- `isPro` / subscription state must come from the backend-verified user profile, never from local storage, URL params, or Stripe checkout success redirect params. A client-flipped flag is an open door to free Pro access.
- Paywall-gated features must check entitlement on BOTH the frontend (for UX) and the backend endpoint (for security). Frontend-only gating can be bypassed with dev tools. If this skill finds a Pro-gated UI element that doesn't have an obvious corresponding server-verified API call, note it in the summary so `security-audit` can verify the backend side — the backend check itself is out of scope for this skill.
- Stripe publishable key (`pk_live_`, `pk_test_`) is fine as `EXPO_PUBLIC_*`. Secret key (`sk_live_`, `sk_test_`) must never appear in frontend — grep to confirm.
- Checkout success/cancel deep link handlers only update UI state (e.g. show a "processing" spinner). They never flip `isPro` locally. Entitlement updates come from the backend after webhook processing.
- Stripe Checkout and Billing Portal URLs must be HTTPS and LedgerWise-controlled domains only — no open redirect surface.
- Blur overlays and locked-state UI must not leak Pro-only data into the DOM / component tree just because the blur hides it visually. If the data isn't available, don't render it — render a locked placeholder.

---

## P1 — High Priority

### 4. Performance — Lists & Memoization
- **Any list that could exceed ~20 items must use `FlatList`**, not `ScrollView` with `.map()` — transaction lists are the primary target
- `FlatList` must have: `keyExtractor` with stable unique keys (not array index), `getItemLayout` when row heights are fixed
- Tune `FlatList` props for long lists: `maxToRenderPerBatch={15}`, `windowSize={5}`, `initialNumToRender={10}`
- Wrap expensive child components in `React.memo()` — especially list item renderers
- `useMemo` for derived/computed data (filtered lists, spending aggregations, chart data)
- `useCallback` for all callbacks passed as props to memoized children
- Never create new object/array literals in render (`style={[styles.x, { marginTop: 10 }]}` creates a new ref every render)
- Never use anonymous arrow functions as props to list items — extract to memoized callbacks
- Heavy computations (`computeSpendingSummary`, analytics aggregation) must run in `useMemo`, not during render
- List keys must be stable backend IDs (UUIDs, transaction IDs) — never derived composites like `merchant + date` that can change when data updates. A changed key forces full remount, loses animation state, and causes visible flashing when the user edits a row.

### 5. Error Handling & Resilience
- Every data-driven screen must handle all three states: **loading** (skeleton/spinner), **empty** (helpful message), **error** (message + retry action)
- API calls must handle: network error, 401 (expired session → redirect to login), 429 (rate limited → user-friendly "please wait"), 500 (generic error)
- Read operations: safe to retry with exponential backoff (max 3 retries)
- Write operations (PATCH category): show retry button, never silent auto-retry
- Feature-level error boundaries — a crash in analytics should not take down spending
- `ErrorBoundary` does not catch async/event handler errors — those need try/catch
- 401 handling must distinguish between "token expired, try refresh" and "refresh failed, redirect to login". Flag any 401 handler that redirects immediately without attempting a Supabase session refresh first.
- After a successful token refresh, the in-flight request that got the 401 should be retried once — never silently fail user actions due to a transient expiry.
- Data-dependent screens should detect offline state (via `@react-native-community/netinfo` or equivalent) and show a clear offline banner — not an endless loading spinner.
- Mutations attempted offline must queue or fail with a clear message, never vanish into a rejected Promise.

### 6. File Size & Extraction
- Flag any component file over ~150 lines
- Extract per CLAUDE.md rules:
  - Screen-level components → `src/features/<feature>/`
  - Sub-components → `src/features/<feature>/components/`
  - Feature styles → `src/features/<feature>/styles/`
  - Feature utils → `src/features/<feature>/utils/`
  - Shared components → `src/components/`, hooks → `src/hooks/`, utils → `src/utils/`

### 7. Component Structure
- **One component per file** — split files with multiple component definitions
- **Components render ONE thing** — extract single-item components, parent creates N instances
- **No HTML elements** — only React Native primitives (`View`, `Text`, `Pressable`, `ScrollView`, etc.)
- **Composition at parent level** — sub-components must not import sibling sub-components

### 7a. Performance & Optimization

Cross-cutting optimization review for every cleanup pass. React Native on mobile has a tight frame budget (16ms for 60fps) and startup time matters especially on lower-end devices.

This section assumes sections 4 (list-specific memoization) and 11 (animation-specific perf) have already passed. Focus here on cross-cutting concerns — re-render cascades, bundle size, caching, module-level perf, and asset handling — not list or animation fundamentals. Flag each issue once, in the section where it most naturally belongs.

**Re-render audit:**
- Any component that re-renders more than necessary under normal interaction (typing, scrolling, navigating) is a bug. Use React DevTools Profiler or `why-did-you-render` mentally when reviewing: does this component re-render when props it doesn't care about change?
- Context consumers re-render on every context value change. Split large contexts into smaller ones scoped by update frequency — a context that holds both `session` (rare) and `hoverIndex` (every frame) should be two contexts.
- `Provider value={{ ... }}` without `useMemo` creates a new object every render and breaks all child memoization. Flag any context provider whose value is a literal object or array.
- Components that take callbacks as props require those callbacks to be `useCallback`-wrapped at the parent. Flag inline arrow functions passed to memoized children.

**Startup & bundle size:**
- Heavy imports should be lazy-loaded where possible. Reanimated, date libraries, chart libraries, and PDF/image libraries are the usual offenders — flag any top-level import in a rarely-used screen that forces the bundle to include a large dep on app start.
- Use `import('...')` dynamic imports for screens behind rare flows (settings, account deletion, Stripe billing portal webview).
- Avoid importing the entire `lodash` — use `lodash/<function>` or native JS equivalents. Same for `date-fns`, `@expo/vector-icons` (import specific icon sets, not the full bundle).
- On web, tree-shaking depends on named imports — flag `import * as X from ...` patterns in non-type contexts.

**Image & asset handling:**
- Remote images must use `expo-image` (or equivalent with caching), not bare `Image` — bare `Image` refetches on every mount.
- Always provide explicit `width` / `height` on images to avoid layout thrashing.
- Large local assets (institution logos, onboarding illustrations) should be compressed and served at multiple resolutions (`@2x`, `@3x`).
- SVG icons preferred over PNG where possible — smaller and resolution-independent.

**Expensive computation:**
- Aggregations, sorts, filters, and date math over large transaction lists must run inside `useMemo` with a precise dependency array — never in render body, never in `useEffect` that sets state (causes double render).
- Computations that don't depend on React state should live at module scope or in a pure helper — never recomputed inside a component.
- Date formatting inside a list item (for 100+ rows) is a common hot path — memoize per-row or pre-compute in the list's parent before passing down.
- Chart data transformations should be memoized and should not recalculate on unrelated state changes.

**Network & data:**
- API response caching (the in-memory cache in `api/client.ts`) should be used for reads that tolerate staleness — flag GET endpoints called directly via `fetch` that bypass `cachedGet`.
- `clearApiCache()` must be called after mutations that invalidate the cache — flag mutation handlers that update local state without clearing the relevant cached read.
- Polling intervals on screens (if any) must pause when the screen is unfocused — use `useFocusEffect` or equivalent. Background polling drains battery.
- Pagination: list endpoints must not refetch from page 1 on every scroll — verify incremental loading with `onEndReached` / cursor.

**Mobile-specific:**
- Modal mount cost — modals that are always mounted (even when closed) add to initial render. Prefer conditionally rendering heavy modals (`{isOpen && <HeavyModal />}`) unless animation requires pre-mount.
- `KeyboardAvoidingView` should wrap only the minimum subtree needed — wrapping the whole screen is expensive.
- `useEffect` with an empty dep array running on every mount is fine; one that runs on every render (missing deps) is not — audit for missing dependency warnings.

**Measurement:**
- Any screen touched in this cleanup pass that has obvious perf cost (many list items, multiple API calls on mount, complex animation) should have a comment documenting the target frame rate or render budget.
- If a component is memoized but the profiler still shows re-renders, the memo is lying — check for prop identity issues (new object/array/function every render).

Do NOT optimize prematurely. Only flag and fix where:
- The code is on a user-facing hot path (transaction list, dashboard, drag/drop interactions)
- The cost is concrete (re-render cascade measured or obvious from code shape, >1MB bundle impact, >16ms frame on scroll)
- The fix is low-risk and doesn't rearchitect the component

---

## P2 — Medium Priority

### 8. Accessibility (WCAG 2.1 AA — fintech minimum)
- All `Pressable` / interactive elements: `accessibilityRole`, `accessibilityLabel`, `accessibilityState`
- Color contrast: 4.5:1 for normal text, 3:1 for large text — audit both light and dark themes
- **Never convey meaning through color alone** — refunds vs charges need text labels or icons in addition to color
- Currency amounts must have readable `accessibilityLabel` (`"negative forty five dollars"` not `"$-45.00"`)
- Charts/graphs (`BarChart`) must have `accessibilityLabel` with data summary text
- Drag-and-drop must have an accessible alternative (button-based assignment) for screen reader users
- Minimum 44x44pt touch targets — audit filter pills, tab items, small buttons
- Loading states: `accessibilityLiveRegion="polite"` on containers that update asynchronously
- Transaction rows: announce merchant, amount, date, and category as a single accessible unit
- Screen reader order for transaction rows must be deterministic: merchant, then amount, then date, then category. Don't let layout changes reshuffle the a11y tree as a side effect.

### 9. State Management
- Context value objects must be wrapped in `useMemo` to prevent unnecessary consumer re-renders
- If a context provides both data and actions, consider splitting by update frequency
- Callbacks stored in refs or passed to gesture/animation handlers may capture stale state — use `useRef` for values needed inside callbacks without re-render triggers
- Props passing through 3+ components unchanged → extract to context or hook
- Optimistic updates: verify full revert on failure, including rapid re-assignment edge cases

### 10. Platform Consistency (Web vs iOS)
- `shadow*` props are iOS-only; web needs `boxShadow` — theme tokens in `shadows.ts` should provide both
- `overflow: 'hidden'` with `borderRadius` behaves differently — test both platforms
- `Pressable` hover is web-only — verify graceful degradation on mobile
- `window` / `document` references must be guarded with `Platform.OS === 'web'`
- Web-only code (HTML5 drag/drop) must not load on native
- `ScrollView` `contentContainerStyle` flexGrow differs between web and native
- Use `Platform.select()` for platform-specific workarounds, not runtime `if (Platform.OS)` checks
- `localStorage` / `sessionStorage` on web are for non-sensitive UI preferences only (theme, sidebar collapsed, last-viewed filter). Never store tokens, user data, transaction data, Stripe customer IDs, or anything that would leak cross-user on a shared device. Grep `localStorage.setItem` under `frontend/` and flag any call that stores non-trivial data.

### 11. Animation Performance
- `Animated` API: use `useNativeDriver: true` where possible (transform, opacity — not layout props)
- Reanimated: all position tracking on UI thread via `useSharedValue` + `useAnimatedStyle` — never read shared values in JS render
- `runOnJS` sparingly — only for callbacks that must touch React state
- No heavy computation in gesture event handlers — use pre-computed layout measurements
- `LayoutAnimation` does not work on web — use Reanimated layout transitions instead
- **Never use React `setState` for values that change during gestures** (hover target, drag position, active index). Every `setState` during a pan/drag causes a full re-render cycle on the JS thread, competing with the gesture for frame time and causing visible jank. Use `useSharedValue` for any state that changes on every frame or on hover transitions, and derive all visual changes via `useAnimatedStyle` / `useAnimatedReaction` / `interpolateColor`. Reserve `setState` for discrete, non-frame-critical events only (drag start/end, overlay mount/unmount).
- When converting `isActive`-style boolean props to shared values: use a single `activeTileSV: SharedValue<number>` (index, -1 = none) at the parent, pass it to each child, and let each child derive `active = activeTileSV.value === myIndex` inside `useAnimatedStyle`. This eliminates re-renders of all siblings when only one tile's hover state changes.

### 12. Style Hygiene
- **No inline style objects** — extract to `StyleSheet.create()` in the appropriate styles file
- Theme-aware styles use factory functions: `createXStyles(colors)` consumed by `useThemeStyles()`
- Shared styles → `src/styles/`, feature styles → `src/features/<feature>/styles/`
- Consolidate duplicate style definitions across files
- **Page layout consistency** — all dashboard pages must use matching `paddingHorizontal` (`isNarrow ? 16 : 24`), `paddingTop` (`isNarrow ? 16 : 24`), and `pageHeader` margin values. When a page has alternate layouts (e.g. empty state vs data-loaded), verify both paths apply the same container padding. Compare against the shared `pageHeaderDefs` in `src/styles/shared.styles.ts` as the source of truth.

---

## P3 — Maintenance

### 13. Type & Interface Cleanup
- All shared interfaces → `src/types/` (one file per domain). Never in feature folders.
- Single-use types stay in the component file
- Prefer `interface` over `type` for object shapes. Use `type` for unions, intersections, and mapped types where `interface` doesn't apply. Remove unused type imports.

### 14. Hook Hygiene
- One responsibility per hook
- Shared hooks → `src/hooks/`, feature hooks → feature root
- Pure helpers at module scope (not recreated inside components)
- Render callbacks depending on component scope wrapped in `useCallback`

### 15. Dead Code & Imports
- Remove unused imports, variables, functions
- Remove commented-out code blocks (unless they explain WHY)
- Remove unused style definitions from StyleSheet objects

### 16. Barrel Exports & Module Boundaries
- Each feature module: `index.ts` barrel export with named exports (not default)
- Feature internals are private — only barrel is public API
- No imports that bypass the barrel (e.g. `features/x/components/Y`)

### 17. Utility Deduplication
- Repeated logic across files → extract to single source of truth
- Name by domain (`categoryColors.ts`), not generic (`helpers.ts`)

---

## Process

1. **Identify scope** — determine which frontend files to review
2. **Read each file** — understand before changing
3. **Fix by priority** — P0 first (financial correctness, memory leaks, security sanity, entitlement integrity), then P1, P2, P3
4. **Verify after extraction** — grep for old import paths and update them
5. **Summarize changes** — brief summary organized by priority level of what was found and fixed

## Rules

- Follow existing codebase patterns — don't invent new structures
- Don't add features, docstrings, or type annotations to code you didn't change, UNLESS the addition is trivial (one line, no behavior change) and directly adjacent to code you're already editing
- Comments explain WHY, not WHAT
- Prefer readable functions with clear names over clever one-liners
- When extracting, update all import paths across the codebase
- If unsure whether something is intentional, ask before removing
