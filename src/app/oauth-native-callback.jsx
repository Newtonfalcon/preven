import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Expo Router treats every file under src/app/ as a route. The Google OAuth
// redirect URI used by sign-in/sign-up (src/utils/oauth.js) is
// "preven://oauth-native-callback" — without a matching file here, Expo
// Router has nothing to render for that path and shows its "page not
// found" / unmatched-route screen instead, which is what was happening.
//
// No navigation logic is needed for the success path: WebBrowser
// .maybeCompleteAuthSession() (called in sign-in.jsx / sign-up.jsx) already
// intercepts this redirect to resolve the pending SSO promise. Once that
// resolves, Clerk's isSignedIn flips to true and the root AppShell
// (src/app/_layout.jsx) redirects into the app on its own — this screen
// just needs to exist and show something reasonable while that happens.
//
// The fallback button below only covers the edge case where something
// hangs (e.g. the SSO promise never resolves) so the user isn't stranded.
export default function OAuthNativeCallback() {
  const router = useRouter();
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowFallback(true), 6000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <ActivityIndicator size="large" color="#0F172A" />
        <Text style={{ marginTop: 16, fontSize: 14, color: '#64748B', textAlign: 'center' }}>
          Completing sign-in…
        </Text>

        {showFallback ? (
          <Pressable
            onPress={() => router.replace('/')}
            hitSlop={12}
            style={{ marginTop: 24 }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#0F172A' }}>
              Taking a while — tap to return
            </Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
