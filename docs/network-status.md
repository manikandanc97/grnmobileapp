# Network status and older development builds

`RNCNetInfo is null` means the installed native application does not expose the NetInfo module expected by its JavaScript bundle. A Metro restart does not add native modules to an installed APK. Expo development builds must be rebuilt when their native dependencies change: https://docs.expo.dev/develop/development-builds/introduction/

`src/services/networkStatus.ts` now checks native availability before loading NetInfo. Its type imports do not execute the package. Available NetInfo builds keep native connection events; builds without it use an HTTP connectivity check against the configured Supabase `/auth/v1/health` endpoint, without authentication headers or record writes. Any HTTP response confirms connectivity; a failed or timed-out request reports offline. Until the first check finishes, reachability is unknown.

The fallback checks every 60 seconds while online and every 15 seconds while offline, pauses its timer in the background, and refreshes when the app returns to the foreground. Manual retry also refreshes it. Concurrent refreshes share one request, with an eight-second timeout. Wi-Fi/cellular type remains unknown in fallback mode. Browser fallback uses online/offline events; static rendering makes no connectivity requests.

To load the JavaScript fix, restart Metro and reload the installed development app:

```powershell
npx.cmd expo start --dev-client --clear
```

To restore native NetInfo events in an older APK, build and install a fresh Android development client using the existing EAS profile:

```powershell
npx.cmd eas-cli@latest build --platform android --profile development
```

Regression checks: `node --test tests/networkStatus.test.cjs tests/laborShifts.test.cjs`, `npx.cmd expo lint`, and `npx.cmd tsc --noEmit`. Native device behavior still needs verification in the installed app.
