import { Redirect, Stack, useSegments } from 'expo-router';
import { ClerkProvider, useAuth } from '@clerk/expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
//import { tokenCache } from '../utils/cache'; // Import your secure cache adapter
import { tokenCache } from '@clerk/expo/token-cache';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { ApiProvider } from '../context/ApiContext';
import BrandLoader from '../components/BrandLoader';
import '../../global.css'; // Required once at the app root for NativeWind styles to apply

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable.');
}

// Matches app.json's expo-splash-screen "backgroundColor". Single source of
// truth so the native splash, the root native view, and BrandLoader's own
// full-screen background can never drift apart again.
export const BRAND_BG = '#FFFFFF';

// Without this, the instant the native splash hides it exposes the default
// OS window background (often black on Android) for a frame or two before
// React paints anything — a second, smaller flash stacked on the one we
// just fixed in app.json.
SystemUI.setBackgroundColorAsync(BRAND_BG);

// Keep the native splash on screen past its default auto-hide point. We hide
// it ourselves in AppShell, in the same render pass where real content is
// first ready, so it's one clean swap instead of splash -> blank frame ->
// BrandLoader.
SplashScreen.preventAutoHideAsync().catch(() => {
  // Only throws if called after the splash already hid (e.g. fast refresh
  // during development) — safe to ignore.
});

// All routing decisions live here: while Clerk is booting we show a
// branded loading state (never a blank screen), and once it's loaded we
// steer signed-in users into the app and signed-out users back to the
// welcome/auth screens. Individual screens (index, sign-in, sign-up) no
// longer need any redirect logic of their own.
//
// Using <Redirect> here (rather than calling router.replace() inside a
// useEffect) is what actually stops the flicker: an effect-based redirect
// still renders the *wrong* screen's full content for at least one frame
// before the effect fires and swaps it out, which is what caused the
// visible flash. <Redirect> resolves the correct destination before the
// mismatched screen ever gets painted.
function AppShell() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();

  // Fires once, the first moment Clerk has resolved — this is what actually
  // dismisses the native splash. Doing it here (rather than a fixed timer or
  // on mount) means the splash never disappears before there's something
  // real, same-colored content ready to receive it.
  useEffect(() => {
    if (isLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoaded]);

  // `<ClerkLoaded>` renders nothing at all while Clerk is booting up, which
  // used to leave the app stuck on a blank white screen on launch. This
  // explicit isLoaded check keeps something visible on screen at all times.
  if (!isLoaded) {
    return <BrandLoader message="Preparing your session…" />;
  }

  const inAppGroup = segments[0] === '(app)';

  if (isSignedIn && !inAppGroup) {
    return <Redirect href="/(app)/(tabs)" />;
  }
  if (!isSignedIn && inAppGroup) {
    return <Redirect href="/" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)/(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
        <ApiProvider>
          <AppShell />
        </ApiProvider>
      </ClerkProvider>
    </SafeAreaProvider>
  );
}
