# GRN Construction Mobile App — Forensic Offline & Error Handling Audit

## 1. Executive Summary

This forensic audit evaluates the offline resilience, network awareness, account isolation, and error handling of the GRN Construction Mobile App (Expo SDK 57, React Native 0.86, Supabase PostgreSQL & Auth, Expo Router). 

Prior to this audit, the application assumed constant server connectivity. When network connectivity drops:
- Data fetching queries fail immediately, throwing technical PostgREST errors.
- Screens render raw or misleading error cards (e.g. "Database Setup Required" on the Home dashboard when simply disconnected).
- Forms lose input if unhandled failures occur, or trap users without local draft persistence.
- No network listener exists to warn users or auto-retry upon reconnection.
- Naive local caching in `siteLabor.ts` contained a critical security vulnerability: keys were shared across all accounts on the device (`@grn_labor_${siteId}_${date}` without user partitioning) and inverted error handling logic (only cached data on PGRST116 Not Found, throwing on actual network disconnects).

This document establishes the forensic findings across all codebase modules and outlines the production architecture to deliver reliable offline data viewing, account-partitioned local caching, safe offline draft mutation queueing, and enterprise error handling.

---

## 2. Dependency & Native Module Compatibility

| Package | Current Version | Status / Notes |
| :--- | :--- | :--- |
| `expo` | `~57.0.27` | Expo SDK 57 |
| `react-native` | `0.86.3` | React 19.2.3 |
| `@react-native-async-storage/async-storage` | `2.2.0` | Installed & compatible. Durable key-value storage. |
| `expo-secure-store` | `~57.0.4` | Installed. Used for sensitive tokens/keys only. |
| `@supabase/supabase-js` | `^2.117.0` | Uses AsyncStorage for auth session token persistence. |
| `@react-native-community/netinfo` | *Not installed* | Tested with `npx expo install @react-native-community/netinfo -- --dry-run`: resolves to `12.0.1`, confirmed 100% compatible with Expo SDK 57.0.0. |

**Decision**: Install `@react-native-community/netinfo` (`12.0.1`) using `npx expo install` for robust native network monitoring.

---

## 3. Forensic Codebase Audit

### 3.1 Authentication & Client Initialization (`src/lib/supabase.ts`, `src/providers/AuthProvider.tsx`)
- **Current State**: Supabase client uses `@react-native-async-storage/async-storage` for auth token storage. On `SIGNED_OUT`, `AuthProvider` triggers `dataSync.clearAll()`.
- **Gaps**: 
  - `dataSync.clearAll()` invalidates in-memory listeners, but does not purge any persisted offline disk caches.
  - No connectivity check before calling `supabase.auth.getSession()` or signing out.

### 3.2 Service Layer Audit (`src/services/`)

| Service File | Operations Audited | Current Offline Behavior | Gaps & Failure Modes |
| :--- | :--- | :--- | :--- |
| `sites.ts` | `getSites`, `getSiteById`, `createSite`, `updateSite`, `softDeleteSite` | Online-only. Throws `formatDatabaseError`. | No cached sites when offline. Fails completely on app launch without Wi-Fi. |
| `dashboard.ts` | `getDashboardMetrics`, `getRecentActivity` | Online-only (`Promise.all` across 4 tables). | If any core query fails, dashboard fails completely. Dashboard displays "Database Setup Required" error card. |
| `siteLabor.ts` | `getSiteLaborByDate`, `saveSiteLaborDaily`, `getSiteLaborHistory` | Partial naive `AsyncStorage` implementation. | **Critical Bug 1**: Key `@grn_labor_${siteId}_${date}` lacks user ID, exposing Labor data across logged-out accounts on the same device.<br>**Critical Bug 2**: Only returns local data if `error.code === 'PGRST116'` (Not Found). On network disconnect, it throws `error` and ignores local cache! |
| `materials.ts` | `getMaterials`, `getMaterialById`, `createMaterial`, `updateMaterial`, `deleteMaterial` | Online-only. Joins `sites(name)`. | Fails when offline. |
| `expenses.ts` | `getExpenses`, `getExpenseById`, `createExpense`, `updateExpense`, `deleteExpense` | Online-only. Joins `sites(name)`. | Fails when offline. No cached expense records. |
| `cashBook.ts` | `getCashTransactions`, `getCashBookSummary`, `createCashTransaction`, `updateCashTransaction`, `deleteCashTransaction` | Online-only. | Financial totals (`totalInward`, `totalOutward`, `cashOnHand`) fail offline. |
| `workers.ts` | `getWorkers`, `getWorkerById`, `createWorker`, `updateWorker`, `deleteWorker` | Online-only. | Fails offline. |
| `attendance.ts` | `getAttendanceForDate`, `markAttendance` | Online-only. | Fails offline. |
| `notifications.ts` | `getNotifications`, `getUnreadNotificationsCount`, `markNotificationAsRead` | Online-only. | Fails offline. |

### 3.3 Data Hooks Layer Audit (`src/hooks/`)
All existing hooks (`useSites`, `useSiteDetails`, `useMaterials`, `useExpenses`, `useCashBook`, `useSiteLabor`, `useDashboard`, `useWorkers`, `useAttendance`) follow an identical pattern:
- Maintain React state (`data`, `loading`, `error`, `refreshing`).
- Subscribe to `dataSync` pub-sub events.
- On mount, run `loadData()` against Supabase.
- **Problem**: When opened offline without a prior active session in memory, `loading` starts `true`, query fails, `data` remains empty `[]`, and `error` is populated. No local persistence fallback is queried.

### 3.4 Screen-Level Behavior When Offline

| Screen / Route | Current Offline Result | Required Offline Experience |
| :--- | :--- | :--- |
| `(app)/index` (Home Dashboard) | Red error box "Database Setup Required". Zero totals. | Show cached dashboard metrics + cached active sites + "Offline — last updated" header chip. |
| `(app)/sites/index` | Center error state "Unable to load sites" with retry. | Show cached sites list + search/filter over cached items + offline banner. |
| `(app)/sites/[id]` | Error state "Unable to load site details". | Show cached site detail fields, progress, budget. |
| `(app)/materials/index` | Red error box or infinite spinner. | Show cached materials with stock levels. |
| `(app)/expenses/index` | Error state. | Show cached expenses list and total spent. |
| `(app)/cash-book/index` | Error state. | Show cached transaction ledger with offline indicator. |
| `(app)/labor/index` | Throws error despite partial cache. | Show cached labor numbers for selected date with offline badge. |
| `(app)/*/add` forms | Crash/fail on submit; user input remains in form state but cannot be saved locally. | Save durable local draft, queue for sync, notify user "Saved offline — will sync once online". |

---

## 4. Operation Classification (Mutation Strategy)

To prevent financial corruption, duplicate ledger entries, and RLS violations, every application mutation is categorized into three strict classes:

### Category A: Safe to Queue Offline (Client-Generated UUID + Idempotency)
1. **Create Draft Site**: Client generates UUID `id`. Safe to queue.
2. **Update Site Draft/Details**: Queued with entity ID and timestamp.
3. **Record Daily Site Labor**: Upsert keyed by `(site_id, work_date)`. Safe to queue with client timestamp.
4. **Create Draft Material**: Client generates UUID `id`. Safe to queue.
5. **Update Material**: Queued with entity ID and timestamp.
6. **Record Draft Expense**: Client generates UUID `id`. Safe to queue.
7. **Record Draft Cash Book Transaction**: Client generates UUID `id`, sets `owner_id = user.id`. Queueable with explicit offline warning: user is notified that the running balance is projected until server synchronization.

### Category B: Requires Server Validation / Conflict Detection
1. **Update Financial Transactions (Cash Book / Expenses)**: If server `updated_at` is newer than the client's base snapshot, flag as conflict. Do not overwrite blindly.
2. **Site Labor Updates for Historical Dates**: Compare server revision before applying.

### Category C: Strictly Online-Only
1. **Google Sign-In & OTP Authentication**: Requires Supabase auth backend.
2. **Account Deletion / Session Revocation**: Requires authoritative Supabase Auth state.
3. **Permanent Entity Hard Deletion**: Irreversible destructive actions must verify live server state.

---

## 5. Security & Multi-Account Isolation Architecture

### 5.1 Storage Partitioning
All persistent cache keys and queue keys MUST incorporate the authenticated user's ID (`owner_id`):
```ts
// Cache key pattern
`@grn_${userId}_cache_${entity}` // e.g. @grn_usr123_cache_sites
`@grn_${userId}_cache_labor_${siteId}_${date}`
`@grn_${userId}_queue` // Pending mutations queue for this exact user
```

### 5.2 Logout & Account Switching
When User A logs out:
- In-memory caches and `dataSync` event listeners are cleared.
- User A's pending queue remains persisted on device under `@grn_usrA_queue` (never deleted unless explicitly cleared, protecting against data loss).
- When User B logs in, the storage engine binds exclusively to `@grn_usrB_*`. User B cannot read or sync User A's data.
- The sync engine validates that the currently active session user ID matches `operation.owner_id`. Any mismatch aborts synchronization immediately.

---

## 6. Durable Offline Queue & Safe Sync Engine Specifications

### 6.1 Queued Operation Schema
```typescript
export interface QueuedOperation {
  operation_id: string;        // Client UUID v4
  owner_id: string;            // Authenticated Supabase user ID
  entity_type: 'sites' | 'materials' | 'expenses' | 'site_labor' | 'site_cash';
  entity_id: string;           // Entity UUID
  operation_type: 'create' | 'update' | 'delete';
  payload: any;                // Complete record data
  created_at: string;          // ISO timestamp (Asia/Kolkata aware)
  status: 'pending' | 'syncing' | 'failed';
  retry_count: number;
  last_error?: string | null;
  idempotency_key: string;     // Unique deduplication token
  parent_id?: string;          // e.g. site_id for dependency resolution
}
```

### 6.2 Dependency-Ordered Sync
When connectivity returns:
1. Operations are sorted by dependency graph:
   - Level 1: `sites` (parents)
   - Level 2: `materials`, `expenses`, `site_labor`, `site_cash` (children referencing `site_id`)
2. Synchronous execution in order within dependency tiers.
3. Bounded exponential backoff (e.g. 1s, 2s, 4s, max 30s) for transient network timeouts.
4. Permanent HTTP 4xx / RLS / schema errors mark the operation as `failed` without continuous retry, storing `last_error` for user review.
5. On successful sync, dispatch `dataSync.notify(...)` to update all active hooks and screens in real time.

---

## 7. Error Classification & UI System

Technical errors must be mapped cleanly through a centralized error mapper:

| Error Category | Technical Indicators | User-Facing Title | User-Facing Message |
| :--- | :--- | :--- | :--- |
| **No Internet** | `NetInfo.isConnected === false`, `TypeError: Network request failed`, `Failed to fetch` | You're Offline | Please check your internet connection. Saved data is available. |
| **Backend Unavailable** | HTTP 500, 502, 503, 504, Timeout | Server Temporarily Unavailable | Unable to reach GRN servers. Please try again shortly. |
| **Session Expired** | JWT expired, 401, `PGRST301`, auth token invalid | Session Expired | Your session has ended. Please sign in again. |
| **Permission Denied** | RLS violation, 403, `42501` | Access Denied | You don't have permission to perform this action. |
| **Record Not Found** | `PGRST116` (except intentional single lookups), 404 | Record Not Found | This item may have been removed or relocated. |
| **Conflict / Duplicate** | `23505` (unique violation), version mismatch | Sync Conflict | This record was modified elsewhere. Please refresh and review. |
| **Validation Error** | Missing required fields, invalid format | Form Validation | Please review and correct the highlighted fields. |
| **General Unknown** | Uncategorized errors | Something Went Wrong | An unexpected error occurred. Please try again. |

---

## 8. Implementation Plan

1. **Phase 2**: Install `@react-native-community/netinfo` and build `src/services/networkStatus.ts` & `src/hooks/useNetworkStatus.ts`.
2. **Phase 3**: Implement `src/components/ui/OfflineBanner.tsx` and integrate it into root layout.
3. **Phase 4**: Implement `src/components/ui/NoInternetScreen.tsx` for un-cached views.
4. **Phase 5 & 8**: Create account-isolated storage manager `src/services/offlineStorage.ts`.
5. **Phase 6 & 7**: Create durable mutation queue `src/services/offlineQueue.ts`.
6. **Phase 9 & 10**: Build `src/services/offlineSync.ts` with dependency ordering and conflict protection.
7. **Phase 11-14**: Wire offline caching & fallback into hooks (`useSites`, `useDashboard`, `useExpenses`, `useMaterials`, `useCashBook`, `useSiteLabor`), standardize error messages, and safeguard financial calculations.
8. **Phase 15-18**: Execute validation (`tsc --noEmit`, `eslint`, web export, config verification) and author `docs/offline-error-handling-implementation.md`.
