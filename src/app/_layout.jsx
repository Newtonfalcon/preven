import { Stack } from 'expo-router';
import { ClerkProvider, ClerkLoaded } from '@clerk/expo';
import { tokenCache } from '../utils/cache'; // Import your secure cache adapter

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable.');
}

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ClerkLoaded>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name='(welcome)' />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)/(tabs)" />
        </Stack>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
