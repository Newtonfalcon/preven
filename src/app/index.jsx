import { Redirect } from 'expo-router';
import { useAuth } from '@clerk/expo';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' }}>
        <ActivityIndicator size="large" color="#111" />
      </View>
    );
  }

  // If signed in, route directly into the main application layout
  if (isSignedIn) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  // If not signed in, route to authentication screens (SignUp/SignIn)
  return <Redirect href="/(welcome)/welcome" />;
}
