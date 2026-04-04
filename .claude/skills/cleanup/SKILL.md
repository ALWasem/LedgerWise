---
name: cleanup
description: Post-feature frontend cleanup — enforce CLAUDE.md standards + RN performance, fintech data correctness, memory safety, accessibility, and security
disable-model-invocation: true
argument-hint: [scope e.g. src/features/analytics, or blank for changed files]
allowed-tools: Bash Grep Read Edit Glob Agent
effort: max
---

# Post-Feature Frontend Cleanup

Clean up frontend code after a feature push. Enforces CLAUDE.md project conventions AND industry best practices for React Native fintech apps.

**Scope:** If `$ARGUMENTS` is provided, focus on those paths under `frontend/`. Otherwise, detect changed frontend files by running `git diff --name-only main...HEAD -- frontend/` (or `git diff --name-only HEAD~5 -- frontend/` if on main) and clean those up.

Work through each section in order. For every issue found, fix it — don't just report it.

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

### 3. Sensitive Data Handling
- No `console.log` / `console.warn` / `console.error` that outputs transaction data, amounts, user info, or tokens
- Auth tokens must never exist in React state or context — Supabase session only
- Teller access tokens must never appear in frontend code — backend only
- No hardcoded secrets, API keys, or URLs — must come from env vars
- `EXPO_PUBLIC_API_URL` in production must be HTTPS
- Sensitive text (`Text` components showing account numbers) should use `selectable={false}`
- No `any` in TypeScript — type safety holes are security holes in fintech

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

### 5. Error Handling & Resilience
- Every data-driven screen must handle all three states: **loading** (skeleton/spinner), **empty** (helpful message), **error** (message + retry action)
- API calls must handle: network error, 401 (expired session → redirect to login), 429 (rate limited → user-friendly "please wait"), 500 (generic error)
- Read operations: safe to retry with exponential backoff (max 3 retries)
- Write operations (PATCH category): show retry button, never silent auto-retry
- Feature-level error boundaries — a crash in analytics should not take down spending
- `ErrorBoundary` does not catch async/event handler errors — those need try/catch

### 6. God File Detection & Extraction
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
- Web-only code (HTML5 drag/drop, Teller script injection) must not load on native
- `ScrollView` `contentContainerStyle` flexGrow differs between web and native
- Use `Platform.select()` for platform-specific workarounds, not runtime `if (Platform.OS)` checks

### 11. Animation Performance
- `Animated` API: use `useNativeDriver: true` where possible (transform, opacity — not layout props)
- Reanimated: all position tracking on UI thread via `useSharedValue` + `useAnimatedStyle` — never read shared values in JS render
- `runOnJS` sparingly — only for callbacks that must touch React state
- No heavy computation in gesture event handlers — use pre-computed layout measurements
- `LayoutAnimation` does not work on web — use Reanimated layout transitions instead

### 12. Style Hygiene
- **No inline style objects** — extract to `StyleSheet.create()` in the appropriate styles file
- Theme-aware styles use factory functions: `createXStyles(colors)` consumed by `useThemeStyles()`
- Shared styles → `src/styles/`, feature styles → `src/features/<feature>/styles/`
- Consolidate duplicate style definitions across files

---

## P3 — Maintenance

### 13. Type & Interface Cleanup
- All shared interfaces → `src/types/` (one file per domain). Never in feature folders.
- Single-use types stay in the component file
- Prefer `interface` over `type`. Remove unused type imports.

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
3. **Fix by priority** — P0 first (financial correctness, memory leaks, sensitive data), then P1, P2, P3
4. **Verify after extraction** — grep for old import paths and update them
5. **Summarize changes** — brief summary organized by priority level of what was found and fixed

## Rules

- Follow existing codebase patterns — don't invent new structures
- Don't add features, docstrings, or type annotations to code you didn't change
- Comments explain WHY, not WHAT
- Prefer readable functions with clear names over clever one-liners
- When extracting, update all import paths across the codebase
- If unsure whether something is intentional, ask before removing
