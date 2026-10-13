# GRN application design

The application now uses a consistent light design built around the supplied GRN Constructions logo. The original logo is reused unchanged through `BrandMark` on Home, sign-in, OTP, About and the app lock/loading screens.

## Foundation

| Use | Token | Colour |
| --- | --- | --- |
| Primary actions, navigation, brand surfaces | `brand` / `primary` | `#07566A` |
| Logo accent and small brand details | `accent` | `#C9863F` |
| Accent text | `accentInk` | `#865320` |
| Screen background | `background` | `#F5F4EF` |
| Cards and fields | `surface` | `#FFFFFF` |
| Main text | `text` | `#173C43` |
| Secondary text | `textSecondary` | `#607376` |
| Dividers and card borders | `border` | `#DFE7E3` |

Colours, radii, spacing and typography live in `src/constants/theme.ts`; shared card, field, icon and chip treatments live in `src/constants/uiStyles.ts`. Status colours are reserved for meaningful success, pending, errors and cash movement. New UI should use these tokens instead of local hex values.

The interface intentionally uses one light palette. Theme-aware text, auth controls and navigation now agree with the main light surfaces when the device uses dark mode. No new fonts, dependencies, icon assets or native configuration changes were introduced.

## Updated experience

- Home has a teal active-site summary, two supporting metrics and a short site list. Entry actions are inside the selected site; new sites are created from Sites. The logo's bronze appears as a small accent rather than competing with primary actions.
- Sign-in and OTP share the GRN wordmark, clear title hierarchy, a white form panel and consistent controls. Startup and session-loading states show the brand and a progress indicator.
- Headers, primary/secondary/danger buttons, inputs, selectors, date fields, section headings, optional details, status badges, settings groups and dialogs share a common visual language.
- Site, material, expense and cash-book cards use the same action menu for Edit/Delete. Opening that menu stops the parent card press from navigating away.
- Site/material/expense forms group related fields in bordered panels. Larger controls, restrained font weights and consistent gutters improve readability.
- Account, notifications, attendance, cash book and site inline editors use the same palette and surface treatments. The half/extra-shift controls remain available with the previous calculation behavior.
- Material details no longer show invented received/used/stock-check events. Profile no longer displays the SDK number as an app build number.

## Verification

Visual review used a temporary local route composed of actual shared components with sample records. Home, expense-field layout, attendance controls and More were inspected in a browser at 390px. Home and forms were also checked at 320px; measured document width matched viewport width. The narrow Home expense metric was adjusted after inspecting the preview. The temporary route and editing/capture scripts were removed.

Development browser checks do not verify an authenticated account or native runtime. Native keyboard behavior, real sign-in/OTP, biometric unlock, large system text and live record writes still require a development build on a device. Some headless auth navigation and image captures did not finish in this environment; they are not counted as passed visual checks.

Final automated verification: Expo lint, TypeScript, the existing labor-shift regression suite and an Android/iOS/Web export. See the completion message for results.
