import { Stack, useRouter, useSegments } from 'expo-router';
import { ClerkProvider, useAuth } from '@clerk/expo';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
//import { tokenCache } from '../utils/cache'; // Import your secure cache adapter
import {tokenCache} from '@clerk/expo/token-cache'
import {ApiProvider} from '../context/ApiContext'
import '../../global.css'; // Required once at the app root for NativeWind styles to apply

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable.');
}

// All routing decisions live here: while Clerk is booting we show a
// spinner (never a blank screen - see below), and once it's loaded we
// steer signed-in users into the app and signed-out users back to the
// welcome/auth screens. Individual screens (index, sign-in, sign-up) no
// longer need any redirect logic of their own.
function AppShell() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    console.log('[auth guard]', { isLoaded, isSignedIn, segments });
    if (!isLoaded) return;

    const inAppGroup = segments[0] === '(app)';

    if (isSignedIn && !inAppGroup) {
      router.replace('/(app)/(tabs)');
    } else if (!isSignedIn && inAppGroup) {
      router.replace('/');
    }
  }, [isSignedIn, isLoaded, segments]);

  // `<ClerkLoaded>` renders nothing at all while Clerk is booting up, which
  // used to leave the app stuck on a blank white screen on launch. This
  // explicit isLoaded check keeps something visible on screen at all times.
  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' }}>
        <ActivityIndicator size="large" color="#111" />
      </View>
    );
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
