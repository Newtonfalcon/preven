import { Redirect, Stack, useSegments } from 'expo-router';
import { ClerkProvider, useAuth } from '@clerk/expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
//import { tokenCache } from '../utils/cache'; // Import your secure cache adapter
import { tokenCache } from '@clerk/expo/token-cache';
import { ApiProvider } from '../context/ApiContext';
import BrandLoader from '../components/BrandLoader';
import '../../global.css'; // Required once at the app root for NativeWind styles to apply

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable.');
}

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
