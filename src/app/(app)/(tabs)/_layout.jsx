import { Tabs, usePathname, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Animated, Dimensions, Text, TouchableOpacity, View } from 'react-native';
// High-grade native vector icons from the built-in Expo suite
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CLOSED_WIDTH = 70;      // Compact resting pill width
const OPEN_WIDTH = width - 32; // Full premium widescreen navigation bar width

export default function TabsLayout() {
  const router = useRouter();
  const currentPath = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const dockWidth = useRef(new Animated.Value(CLOSED_WIDTH)).current;

  const expandDock = () => {
    if (isExpanded) return; // Prevent double trigger actions
    setIsExpanded(true);

    Animated.spring(dockWidth, {
      toValue: OPEN_WIDTH,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
  };


  const navItems = [
    { name: 'Home', route: '/', icon: 'home-sharp' },
    { name: 'Test', route: 'quick-test', icon: 'flask-sharp' },
    { name: 'Checkup', route: 'visual-checkup', icon: 'camera-sharp' },
    
    { name: 'Profile', route: 'health-profile', icon: 'person-sharp' },
    { name: 'Settings', route: 'settings', icon: 'settings-sharp' },
  ];

  return (
    <View className="flex-1 bg-slate-50">
      
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' }, // Keeps default system bar invisible
        }}
      />

      {/* 🔮 Premium Floating Dynamic Dock */}
      <View className="absolute bottom-6 left-0 right-0 items-center justify-center z-50 px-4">
        <Animated.View
          style={{ width: dockWidth }}
          className="h-16 bg-white border border-slate-100/80 rounded-full flex-row items-center justify-between px-2 shadow-xl shadow-slate-200/60"
        >
          {!isExpanded ? (
            /* 🧭 Compact Trigger Pill (Touch to Unlock App Context) */
            <TouchableOpacity
              onPress={expandDock}
              className="w-full h-full flex-row items-center justify-center bg-indigo-600 rounded-full"
            >
              <Ionicons name="apps-sharp" size={20} color="white" />
            </TouchableOpacity>
          ) : (
            /* 🗺️ Expanded Permanent Nav Ribbon Grid System */
            <View className="flex-1 flex-row justify-around items-center px-2">
              {navItems.map((item) => {
                const isActive = currentPath.endsWith(item.route);
                return (
                  <TouchableOpacity
                    key={item.route}
                    onPress={() => {
                      router.push(`/(app)/(tabs)/${item.route}`);
                    }}
                    className="items-center justify-center p-2 rounded-xl"
                  >
                    <Ionicons 
                      name={item.icon} 
                      size={22} 
                      color={isActive ? '#4F46E5' : '#94A3B8'} // Indigo-600 active vs Slate-400 inactive
                    />
                    <Text
                      className={`text-[10px] mt-1 tracking-tight font-medium ${
                        isActive ? 'text-indigo-600 font-bold' : 'text-slate-400'
                      }`}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </Animated.View>
      </View>
    </View>
  );
}