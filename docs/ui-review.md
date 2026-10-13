# UI and flow review

Reviewed the route structure, sign-in/OTP, dashboard, site list/details, materials, attendance, expenses, cash book, profile, notifications, settings and their shared form components. Existing workspace changes were retained.

## Updated experience

- Home shows a compact overview and up to three active sites. Materials, attendance, expenses and cash entries are added within a selected site. New sites are created from Sites. Removed Home entry actions, repeated expenses, decorative chart bars and the extra profile modal entry point.
- Sites start with all projects. Visible filters are All, Active, On Hold and Completed; search still finds project types. Active counts/list filters now consistently exclude projects on hold. Empty searches have a clear-filters action.
- Site details show one Daily entries card for the selected date, with attendance, materials, expenses and a single daily total. Add/Edit actions sit with their section. Populated entries show their amount and quantity or shifts underneath the name, with a shared Edit/Delete menu for materials and expenses. Removed the duplicate summary/table, column headings, coloured count pills, repeated subtotals and the separate overview Add hub. Completion remains in the site action menu; wage rates remain accessible.
- Material and expense forms keep secondary information under “More details (optional).” Expense categories use a selector instead of a long grid. New entries use the site they were opened from, displayed as a read-only field. Opening an add route without a site redirects to Sites, including single-site accounts.
- Materials use a short stock summary. Expense filters sit side by side. Add actions require a site context and preserve it; global empty states open Sites. Materials and expenses have back buttons when opened from More.
- More contains account controls: Profile, Notifications and Settings. Site-record shortcuts are removed. Materials, expenses, attendance and cash-book lists require a site context; legacy global record and summaries links open Sites before any record list is fetched. Home spending/worker metric links also open Sites. Switching sites remounts the list so the previous site's filters and rows do not carry over.
- Settings retain security, About and sign out. Removed local-only appearance/language/notification switches and empty policy links. About no longer offers nonfunctional support/website/legal actions or an invented build number.
- Shared buttons have a solid teal fill, quieter styling and accessibility states. Back/search controls have larger touch targets; selectors identify the selected option and handle empty lists.

## Corrected behavior

- Attendance editing restores stored wage rates, including zero values. Counts must be nonnegative whole numbers and wages must be finite and nonnegative.
- Obsolete attendance fetches and wage-prefill responses cannot overwrite a later site/date selection. Reopening attendance for another site updates the selected site.
- Expense save availability uses the effective selected site and a finite positive amount. Site/material/cash amounts reject nonfinite values; cash forms prevent repeat saves while saving.
- Dashboard metric query errors use the existing cache/error path instead of silently displaying zero expenses or workers.
- FormScreen now forwards its custom back handler.
- Completed/available, on-hold and out-of-stock badges have appropriate status colors.

## Verification

Expo SDK 57 documentation and current routing/accessibility documentation were checked before editing. No new dependencies or native project directories were added.

- `npx.cmd expo lint`
- `npx.cmd tsc --noEmit`
- `npx.cmd expo export --platform all --output-dir .expo/ui-review-export`
- `git diff --check`

The `.cmd` launcher avoids this machine's PowerShell script execution restriction. Bundle export checks Android, iOS and web compilation; it does not verify native runtime behavior.

## Device acceptance checks still needed

Use an authenticated development build to check sign-in/OTP, biometric lock, keyboard behavior on a small phone, one-site/multi-site selection, attendance rate preservation, add/edit/delete records, offline save/reconnect, and large system text. No authenticated device session or emulator was available for this review; live database writes, SMS delivery and biometrics were not exercised.
