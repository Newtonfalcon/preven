import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from "../context/Authcontext";

import "../../global.css";



function Navigation() {

   const {user, loading} = useAuth();
  const segments = useSegments();
  const router = useRouter();


  useEffect(()=>{
    if(loading) return;
    const inAppGroups = segments[0] === "(app)";
    if(user && !inAppGroups) {
      router.replace("/(app)/(tabs)");
    } else if(!user && inAppGroups) {
      router.replace("/(auth)/sign-in");
    }
  }, [user, loading, segments]);

  if(loading) {
    return (
      <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return <Slot />;
}


export default function RootLayout() {


  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Navigation />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
