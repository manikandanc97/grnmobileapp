# GRN App Branding

This document describes the updated app branding configuration for the GRN app.

## Identifiers
- **App Display Name:** GRN
- **Android Package:** com.grnconstruction.app
- **iOS Bundle Identifier:** com.grnconstruction.app

## Assets
- **Official Logo Asset:** `assets/images/logo.jpg`
- **App Icon:** `assets/images/grn-icon.png` (Derived from the official logo with proper transparent padding to 1024x1024).
- **Android Adaptive Icon Foreground:** `assets/images/grn-adaptive-foreground.png`
- **Splash Screen Image:** `assets/images/logo.jpg`

## App Configuration Changes
- `app.json` has been updated to use the display name "GRN".
- Splash screen configuration uses the original logo with a background color `#C9863F` matching the logo's top-left corner to integrate seamlessly without altering the logo.
- The Adaptive Android Icon uses `#C9863F` as its background color to match the splash branding.
- All occurrences of "GRN Construction", "GRN Construction App", and "grnmobileapp" that were intended as app names in the source code have been replaced with "GRN", while preserving company references like "GRN Constructions team" intact.
