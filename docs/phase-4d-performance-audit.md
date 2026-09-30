# Phase 4D — Production Performance & Bundle Audit

**Project:** GRN Construction App
**Stack:** React Native + Expo SDK 57 + Expo Router + TypeScript + Supabase
**Date:** 2026-09-30
**Status:** AUDIT ONLY — no code changes made

---

## Executive Summary

The GRN Construction app is in a **solid, production-ready state** from an architectural standpoint. The existing code splitting (Phase 4A), dependency cleanup (4B/4C), dataSync optimistic-update bus, and `useFocusEffect` stale-revalidation patterns are well-designed. A small number of targeted improvements — primarily around a **duplicate initial fetch pattern in all hooks**, a **rotating glow animation that runs indefinitely for 4 minutes**, and **two oversized image assets** — represent the most impactful and lowest-risk next steps.

No critical (P0) issues were found. The app is ready to proceed to the next implementation phase with the P1 and P2 items logged for resolution.

---

## Startup Performance

### Startup Path
```
SplashScreen.preventAutoHideAsync()  [module scope, _layout.tsx:11]
  → RootLayout renders
  → SafeAreaProvider
  → AuthProvider (mounts, calls supabase.auth.getSession() → network)
  → ThemeProvider
  → Stack (Expo Router)
  → SplashScreen.hideAsync()  [useEffect, _layout.tsx:17]
```

### Observations

**GOOD:**
- `SplashScreen.preventAutoHideAsync()` is called at module scope (correct — prevents flash before JS loads).
- `SplashScreen.hideAsync()` fires unconditionally in the root `useEffect([])`, independent of auth state. Splash hides promptly and does not block on the auth network request.
- `AuthProvider` correctly fires `supabase.auth.getSession()` and does NOT block rendering — children render with `loading: true` immediately.
- `index.tsx` redirects to `/(auth)` or `/(app)` based on `loading` state, returning `null` while loading — clean and correct.
- Auth subscription (`onAuthStateChange`) is properly cleaned up in the `useEffect` return.

---

## Bundle / Route Performance

### Phase 4A Splitting — Verified Intact

| Route | Form | Lazy | Suspense | LoadingSkeleton |
|---|---|---|---|---|
| sites/add.tsx | SiteForm | YES | YES | YES |
| sites/edit.tsx | SiteForm | YES | YES | YES |
| materials/add.tsx | MaterialForm | YES | YES | YES |
| materials/edit.tsx | MaterialForm | YES | YES | YES |
| labor/add.tsx | WorkerForm | YES | YES | YES |
| labor/edit.tsx | WorkerForm | YES | YES | YES |
| expenses/add.tsx | ExpenseForm | YES | YES | YES |
| expenses/edit.tsx | ExpenseForm | YES | YES | YES |

### Web Bundle Chunks Confirmed (from npx expo export)
- entry.js:              4.3 MB (full app entry — expected for Expo web)
- SiteForm.js:           8.4 KB (deferred chunk)
- MaterialForm.js:       9.7 KB (deferred chunk)
- WorkerForm.js:         7.5 KB (deferred chunk)
- ExpenseForm.js:        8.6 KB (deferred chunk)

---

## Component Rendering

### Dashboard (src/app/(app)/index.tsx)
- `onRefresh` correctly wrapped in `useCallback` with stable deps.
- `ProfileModal` is always mounted, even when invisible. Lazy-mounting on first open would defer its subtree instantiation. (See P3-001)
- `showToast` creates a `setTimeout` without a cleanup ref. If the component unmounts within 2800ms, `setToastMessage` is called on a stale closure. Benign in React 18 but a correctness smell. (See P3-002)

### Labor Screen (src/app/(app)/labor/index.tsx)
- `mergedWorkers`, `filteredWorkers`, and `stats` all use `useMemo` with correct deps — good.
- `handleStatusChange` and `handleRefresh` use `useCallback` — good.
- `renderWorker` is defined at component scope but not memoized. At expected scale (< 30 workers) this is not impactful. (See INFO-001)

### App Layout (src/app/(app)/_layout.tsx)
- `isFormScreen` is computed from `useSegments()` and `usePathname()` on every navigation.
- `tabBarStyle` object is re-created inline on every render. Negligible for 5 tabs. (See P3-003)

---

## List Performance

All list screens use FlatList. Assessment for GRN scale (~3–4 users, small company):
- Typical record counts: < 20 sites, < 100 materials, < 30 workers, < 200 expenses.
- FlatList defaults (initialNumToRender=10, windowSize=21) are adequate for this scale.
- `getItemLayout` is not warranted — card heights are variable (different text lengths).
- `removeClippedSubviews` is a micro-optimization relevant only for 100+ item lists.

**Verdict: Current list configuration is sufficient for the expected scale.**

---

## Supabase Query Performance

### Dashboard (services/dashboard.ts)
- 4 queries run in `Promise.all()` — correctly parallelized.
- Uses `count: exact, head: true` for counter queries — avoids fetching full rows.
- Monthly expenses fetches only `amount` column — good column selectivity.
- `getRecentActivity()` fetches only `id, name/title, created_at, sites(name)` — good.

### Attendance (services/attendance.ts)
- `markAttendance()` makes 3 sequential network calls: upsert → getWorkerById → syncPayroll.
- These are logically sequential (payroll depends on worker data), but `getWorkerById` could potentially be parallelized with the upsert. See P2-001.

### Sites (services/sites.ts)
- `getSites()` and `getSiteById()` use `SELECT *`. Sites table is small; no immediate impact.
- See P3-004 for future column selectivity.

### P1: Duplicate Initial Fetch Pattern
Every hook (useSites, useDashboard, useAttendance, useExpenses, useMaterials, useWorkers) has:
1. An initial IIFE `useEffect` with `isMounted` guard that fetches data.
2. A `loadData` callback that performs the same fetch.
3. A dataSync subscription that calls `loadData`.
4. A `useFocusEffect` that calls `loadData` if stale.

On cold mount, the IIFE fires. The IIFE does NOT use `isFetchingRef`, meaning theoretically both could fire simultaneously under React Strict Mode double-invoke. Error handling is duplicated verbatim across all 6 hook files.

**This is a P1 maintainability and potential correctness issue.** See P1-001.

---

## Image / Asset Performance

| Asset | Size | Status |
|---|---|---|
| icon.png | 799 KB | OVERSIZED — app icon source should be optimized PNG |
| logo-glow.png | 332 KB | OVERSIZED — displayed at 201x201, should be <= 80 KB |
| android-icon-foreground.png | 77 KB | Acceptable |
| logo.jpg | 69 KB | Acceptable |
| tutorial-web.png | 59 KB | Possibly unused — no src/ import found |
| react-logo.png / @2x / @3x | 6–21 KB | Unused Expo template assets |

---

## Animation Performance

### AnimatedIcon (src/components/animated-icon.tsx)
**P1 — Glow animation runs for 4 minutes:**
```
<Animated.View entering={glowKeyframe.duration(60 * 1000 * 4)} ...>
```
Duration = 240,000ms. This is a one-shot Reanimated Keyframe (not looping), but running for 4 minutes on a decorative glow ring is unnecessary GPU work on the auth/splash screen.

All other animations (splashKeyframe, keyframe, logoKeyframe) are 600ms — appropriate.
All Reanimated animations correctly use the native thread via Reanimated v4.
`scheduleOnRN` from `react-native-worklets` is correctly used for thread handoff.

---

## Memory / Resource Safety

### DataSync (src/lib/dataSync.ts)
- Uses `Map<SyncEntity, Set<SyncListener>>` — listeners scoped per entity.
- All hooks return the unsubscribe function from their `useEffect` cleanup — correct.
- Singleton at module scope — no re-instantiation risk.

### AuthProvider (src/providers/AuthProvider.tsx)
- `supabase.auth.onAuthStateChange` subscription correctly cleaned up:
  `return () => subscription.unsubscribe();`
- No memory leak risk.

### useAttendance mark() closure
- `mark` callback depends on `[dateStr, attendanceMap]`.
- `attendanceMap` is replaced by reference on every update, causing `mark` to be re-created frequently.
- This means WorkerCard receives a new `onStatusChange` prop on every attendance change.
- At small scale (< 30 workers), this is not impactful. (See INFO-002)

---

## Native Configuration

| Config | Value | Status |
|---|---|---|
| android.package | com.grnconstruction.app | OK |
| ios.bundleIdentifier | com.grnconstruction.app | OK |
| expo-router plugin | present | OK |
| expo-splash-screen plugin | present | OK |
| expo-secure-store plugin | present | OK |
| @react-native-google-signin/google-signin plugin | present | OK |
| @react-native-community/datetimepicker plugin | present | OK |
| typedRoutes | true | OK |
| reactCompiler | true | OK |
| web.output | static | OK |
| sdkVersion | 57.0.0 | OK |

Phase 4C dependency cleanup did NOT affect any app.json plugin entries — confirmed.

---

## Build Verification

| Command | Result |
|---|---|
| npx tsc --noEmit | 0 errors |
| npx expo lint | 0 warnings / 0 errors |
| npx expo config --type public | sdkVersion 57.0.0, both identifiers correct |
| npx expo export --platform web | 8 bundles, 51 static routes, 4 form chunks present |
| EAS development build (Android) | Succeeded (per user confirmation) |
| Physical device testing | PENDING — not performed in this audit |

---

## Findings

| Priority | Area | File | Finding | Evidence | Impact | Recommendation | Fix Now? |
|---|---|---|---|---|---|---|---|
| P1 | Data Fetching | All hooks | Duplicate initial fetch: IIFE useEffect + loadData callback perform identical fetch; error handling duplicated across 6 files | Code inspection: useDashboard.ts lines 52-88 vs 15-49 pattern | Maintainability risk; divergence risk | Replace IIFE with call to loadData(); add isMounted guard inside loadData | Phase 4E |
| P1 | Animation | animated-icon.tsx | Glow animation runs for 4 minutes (240,000ms) on every mount | Line 101: glowKeyframe.duration(60 * 1000 * 4) | Unnecessary sustained GPU work on auth/splash screen | Reduce to <= 3000ms | Phase 4E |
| P2 | Supabase | attendance.ts | markAttendance makes 3 sequential network calls: upsert → getWorkerById → syncPayroll | Lines 64-101 | ~100-300ms added latency per attendance tap | Evaluate parallelizing getWorkerById with upsert | Deferred |
| P2 | Assets | assets/images/icon.png | App icon source at 799 KB | File system: 799,005 bytes | Repo and build input bloat | Optimize to <= 150 KB PNG | Deferred |
| P2 | Assets | assets/images/logo-glow.png | Glow decoration at 332 KB displayed at 201x201 | File system: 331,624 bytes | Asset weight | Convert to WebP or optimize PNG; target <= 80 KB | Deferred |
| P3 | Rendering | index.tsx (dashboard) | ProfileModal always mounted regardless of visibility | Lines 180-184: always rendered | Mounts modal subtree on initial dashboard render | Mount conditionally: {profileVisible && <ProfileModal />} | Phase 4E |
| P3 | Memory | index.tsx (dashboard) | showToast has no timer cleanup ref | Lines 37-42 | Stale closure call on unmount; benign in React 18 | Store timer in useRef, clear on unmount | Deferred |
| P3 | Rendering | _layout.tsx | tabBarStyle object re-created inline on every render | Lines 54-68 | Negligible for 5-tab layout | Memoize with useMemo | Deferred |
| P3 | Queries | services/sites.ts | getSites() and getSiteById() use SELECT * | Lines 120, 137 | No current impact; forward-compatibility risk | Enumerate required columns explicitly | Deferred |
| P3 | Assets | assets/images/ | react-logo.png / @2x / @3x / tutorial-web.png appear unused | No src/ import found | ~100 KB repo bloat | Remove after confirming non-usage | Deferred |
| INFO | List | labor/index.tsx | renderWorker not memoized; new ref on re-render | Lines 154-160 | Negligible at expected scale < 30 workers | Wrap in useCallback if worker count grows | No action |
| INFO | Memory | useAttendance.ts | mark() re-created on every attendanceMap change; WorkerCard re-renders | Line 156: [dateStr, attendanceMap] dep | Negligible at small scale | No action at current scale | No action |

---

## Safe Immediate Optimizations (Phase 4E)

1. **Hook initial fetch refactor (P1-001):** Replace IIFE useEffect with call to existing loadData callback. Zero behavior change. Eliminates ~50 lines of duplicated code across 6 hooks.
2. **Glow animation duration (P1-002):** Change 60 * 1000 * 4 to 3000. Zero business logic impact.
3. **Conditional ProfileModal mount (P3-001):** `{profileVisible && <ProfileModal />}`. Defers modal subtree instantiation until first open.

## Deferred Optimizations

- markAttendance sequential queries — correct as-is; evaluate if payroll latency becomes user-visible
- Asset optimization (icon.png, logo-glow.png)
- Remove stale Expo template assets
- tabBarStyle memoization
- getSites explicit column selection

## No-Action Areas

- FlatList virtualization props — dataset scale makes defaults sufficient
- Supabase Promise.all in dashboard — already correct
- dataSync memory management — subscriptions properly cleaned up
- date-fns / dayjs dual usage — both justified
- Auth subscription cleanup — correct
- Code splitting boundaries — all 8 routes verified intact
- Tab icon rendering — Lucide named imports, negligible cost
- useCallback/useMemo coverage — appropriately applied

---

## Final Assessment

**Critical Findings (P0):** None.

**High Findings (P1):**
- P1-001: Duplicate initial fetch pattern in all 6 data hooks
- P1-002: 4-minute glow animation on AnimatedIcon

**Medium Findings (P2):**
- P2-001: Sequential network calls in markAttendance
- P2-002: icon.png source at 799 KB
- P2-003: logo-glow.png at 332 KB

**Low Findings (P3):**
- ProfileModal always mounted
- showToast timer without cleanup
- tabBarStyle inline object recreation
- SELECT * in site queries
- Stale Expo template assets

**The app is ready to proceed to the next implementation phase.**
P1 items (hook refactor, glow animation) are safe to address in Phase 4E without touching business logic, authentication, or the database layer.
Native build succeeded (EAS development build confirmed). Physical-device validation remains pending.
