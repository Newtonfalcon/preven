import { makeRedirectUri } from 'expo-auth-session';

// A single, explicit redirect URI shared by every OAuth entry point (Google
// sign-in, Google sign-up, and any future provider).
//
// Why this matters: `makeRedirectUri()` called with no arguments builds a
// different URI depending on context (bare "scheme:///" vs "scheme://path"),
// and on native Clerk will only send the user back to a URL that's been
// explicitly whitelisted in the Dashboard. If the generated URI doesn't
// match what's whitelisted, the system browser opens, the user completes
// Google's login, and the app is simply never handed control back — which
// looks like "Google sign-in is broken" even though nothing throws an error.
//
// Passing an explicit scheme + path keeps the value 100% predictable across
// dev client, EAS builds, and Expo Go:
//   - Dev / production build:  preven://oauth-native-callback
//   - Expo Go:                 exp://<host>/--/oauth-native-callback
//   - Web:                     <origin>/oauth-native-callback
//
// ACTION REQUIRED: add this exact value as a Redirect URL in the Clerk
// Dashboard -> Configure -> SSO Connections -> (Google) -> Redirect URLs,
// and also under "Native applications" if that section exists for your
// Clerk instance. Without that whitelist entry, native Google auth will
// still fail even with this fix in place.
export const oauthRedirectUrl = makeRedirectUri({
  scheme: 'preven',
  path: 'oauth-native-callback',
});