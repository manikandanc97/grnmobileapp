# GRN Construction - Database Schema Plan

## 1. Architecture Overview
The application will use Supabase as the backend, relying on PostgreSQL for the core database and Supabase Auth for user authentication. The architecture is designed to support a small private construction team, meaning that data is generally shared among authenticated team members, but securely protected from public access via Row Level Security (RLS). 

## 2. Entity Relationship Overview
The data model revolves around the **Site** as the primary organizational unit. Most other entities are directly linked to a specific site.

- **Profile** -> Maps 1:1 with Supabase Auth users.
- **Site** -> Central entity representing a construction project.
- **Site** -> 1:N -> **Materials** (Material inventory tracked per site)
- **Site** -> 1:N -> **Workers** (Workers assigned to a site)
- **Site** -> 1:N -> **Expenses** (Expenses incurred at a site)
- **Worker** -> 1:N -> **Attendance** (Daily attendance records for workers)
- **Profile** -> 1:N -> **Notifications** (System notifications delivered to specific users)

## 3. Final Proposed Tables
Based on the current UI and mock data, the following tables are required:
1. `profiles`
2. `sites`
3. `materials`
4. `workers`
5. `attendance`
6. `expenses`
7. `notifications`

## 4. Columns for Every Table

### `profiles`
- `id` (uuid, PK)
- `full_name` (text, nullable)
- `email` (text, nullable)
- `created_at` (timestamptz, not null, default `now()`)
- `updated_at` (timestamptz, not null, default `now()`)

### `sites`
- `id` (uuid, PK, default `uuid_generate_v4()`)
- `name` (text, not null)
- `location` (text, not null)
- `type` (text, not null) - e.g., 'Residential', 'Commercial', 'Renovation'
- `progress` (numeric, not null, default `0`)
- `status` (text, not null) - e.g., 'On Track', 'In Progress', 'Finishing', 'Delayed'
- `start_date` (date, nullable)
- `expected_completion` (date, nullable)
- `budget` (numeric, nullable)
- `created_at` (timestamptz, not null, default `now()`)
- `updated_at` (timestamptz, not null, default `now()`)
- `deleted_at` (timestamptz, nullable) - *Using Soft Delete*

### `materials`
- `id` (uuid, PK, default `uuid_generate_v4()`)
- `site_id` (uuid, not null)
- `name` (text, not null)
- `category` (text, not null) - e.g., 'Cement', 'Sand', 'Bricks', 'Steel', 'Other'
- `quantity` (numeric, not null, default `0`)
- `unit` (text, not null) - e.g., 'Bags', 'Loads', 'Nos', 'Tons'
- `status` (text, not null) - e.g., 'Available', 'Low Stock', 'Pending'
- `used` (numeric, not null, default `0`)
- `received` (numeric, not null, default `0`)
- `last_updated` (timestamptz, not null, default `now()`)
- `created_at` (timestamptz, not null, default `now()`)
- `updated_at` (timestamptz, not null, default `now()`)
- `deleted_at` (timestamptz, nullable)

### `workers`
- `id` (uuid, PK, default `uuid_generate_v4()`)
- `site_id` (uuid, not null)
- `name` (text, not null)
- `role` (text, not null) - e.g., 'Mason', 'Painter', 'Electrician', 'Plumber', 'Carpenter'
- `phone` (text, nullable)
- `joining_date` (date, nullable)
- `created_at` (timestamptz, not null, default `now()`)
- `updated_at` (timestamptz, not null, default `now()`)
- `deleted_at` (timestamptz, nullable)

### `attendance`
- `id` (uuid, PK, default `uuid_generate_v4()`)
- `worker_id` (uuid, not null)
- `site_id` (uuid, not null)
- `date` (date, not null, default `CURRENT_DATE`)
- `status` (text, not null) - e.g., 'Present', 'Absent', 'Not Marked', 'Half Day'
- `created_at` (timestamptz, not null, default `now()`)
- `updated_at` (timestamptz, not null, default `now()`)

### `expenses`
- `id` (uuid, PK, default `uuid_generate_v4()`)
- `site_id` (uuid, not null)
- `title` (text, not null)
- `amount` (numeric, not null)
- `category` (text, not null) - e.g., 'Materials', 'Labor', 'Transport', 'Equipment', 'Other'
- `date` (date, not null)
- `vendor` (text, nullable)
- `payment_method` (text, not null) - e.g., 'Cash', 'UPI', 'Bank Transfer', 'Card'
- `payment_status` (text, not null) - e.g., 'Paid', 'Pending'
- `notes` (text, nullable)
- `created_at` (timestamptz, not null, default `now()`)
- `updated_at` (timestamptz, not null, default `now()`)
- `deleted_at` (timestamptz, nullable)

### `notifications`
- `id` (uuid, PK, default `uuid_generate_v4()`)
- `user_id` (uuid, nullable) - If null, broadcasts to all users.
- `site_id` (uuid, nullable)
- `title` (text, not null)
- `message` (text, not null)
- `type` (text, not null) - e.g., 'material', 'attendance', 'expense'
- `read` (boolean, not null, default `false`)
- `created_at` (timestamptz, not null, default `now()`)

*Decision on Soft Deletion:*
Soft deletion (`deleted_at` column) is highly recommended for `sites`, `materials`, `workers`, and `expenses`. This prevents orphaned financial/historical records and allows recovering data in case of accidental deletions.

## 5. Relationships / Foreign Keys
- `profiles.id` -> `auth.users(id)` (ON DELETE CASCADE)
- `materials.site_id` -> `sites(id)` (ON DELETE RESTRICT - prevent deleting site if materials exist, or handle gracefully with soft delete)
- `workers.site_id` -> `sites(id)` (ON DELETE RESTRICT)
- `attendance.worker_id` -> `workers(id)` (ON DELETE CASCADE)
- `attendance.site_id` -> `sites(id)` (ON DELETE CASCADE)
- `expenses.site_id` -> `sites(id)` (ON DELETE RESTRICT)
- `notifications.user_id` -> `profiles(id)` (ON DELETE CASCADE)
- `notifications.site_id` -> `sites(id)` (ON DELETE CASCADE)

## 6. Required Indexes
To optimize standard queries used by the dashboard and list views:
- `idx_materials_site_id` on `materials(site_id)`
- `idx_workers_site_id` on `workers(site_id)`
- `idx_attendance_worker_date` on `attendance(worker_id, date)` (Also enforce UNIQUE constraint here to prevent duplicate daily records)
- `idx_expenses_site_id` on `expenses(site_id)`
- `idx_notifications_user_id_read` on `notifications(user_id, read)`

## 7. Future RLS Policy Requirements
RLS (Row Level Security) should be enabled on all tables. Since this is a small private team:
- **`profiles`**: 
  - Users can view all profiles (to see other team members).
  - Users can only update their own profile (`auth.uid() = id`).
- **`sites`, `materials`, `workers`, `attendance`, `expenses`**:
  - Requires standard `authenticated` role to select, insert, update, or soft-delete.
  - A policy like `auth.role() = 'authenticated'` ensures no public access.
- **`notifications`**:
  - Users can view notifications where `user_id = auth.uid()` or `user_id IS NULL`.
  - Users can update `read` status on their own notifications.

## 8. Data Flow from Supabase Auth -> Profiles -> App Data
1. User signs in via Supabase Auth (Google/Email).
2. A database trigger automatically inserts a record into the `profiles` table capturing their `id`, `full_name`, and `email`.
3. The UI queries the `profiles` table alongside `session.user` to display team member details.
4. When users create records (e.g., Expenses), they don't necessarily need to attach their `profile.id` as the "creator" unless we want audit logs, but all data stays within the authenticated RLS bounds.

## 9. Migration Implementation Order
1. **001_initial_schema**: Create standard tables (`profiles`, `sites`, `workers`, `materials`, `expenses`, `attendance`, `notifications`) with their columns and constraints.
2. **002_rls_policies**: Enable RLS on all tables and apply authentication-based policies.
3. **003_auth_triggers**: Add trigger function to create `profiles` when a new `auth.users` is registered.
4. **004_indexes**: Add necessary indexes and unique constraints for optimized querying.

## 10. Issues or Ambiguities Found in Current UI Data Model
1. **Workers tied directly to Sites**: In the mock data, `WorkerItem` has a single `siteId`. In reality, a worker might shift between sites over months. A simple FK `site_id` in `workers` is fine for now, but a many-to-many `site_workers` table might be needed later if they move frequently. We'll stick to 1:N for the MVP to keep it simple.
2. **Materials tracked as flat state**: `MaterialItem` tracks `quantity`, `used`, and `received` statically. In a real-world scenario, we might want a `material_transactions` table to track *when* materials were added or used. For now, tracking them as simple updatable columns on the `materials` table reflects the mock UI.
3. **Global Expenses vs Site Expenses**: All mock expenses are tied to a `siteId`. If there are overhead expenses (e.g. office rent), the schema might need `site_id` to be nullable.
4. **Attendance daily generation**: The mock data has `todayStatus`. In a real DB, we need an `attendance` table storing history for each day. The UI will need logic to fetch the latest date's record for "today".
