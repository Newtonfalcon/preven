import { Tabs, usePathname, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Animated, Dimensions, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CLOSED_WIDTH = 64;       // Compact trigger pill width
const OPEN_WIDTH = width - 32; // Expanded widescreen navigation bar width

const ACTIVE_COLOR = '#000000';   // Black for active states
const INACTIVE_COLOR = '#666666'; // Muted dark slate for inactive states

export default function TabsLayout() {
  const router = useRouter();
  const currentPath = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const dockWidth = useRef(new Animated.Value(CLOSED_WIDTH)).current;

  const toggleDock = (expand) => {
    setIsExpanded(expand);
    Animated.spring(dockWidth, {
      toValue: expand ? OPEN_WIDTH : CLOSED_WIDTH,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
  };

  const handleNavigation = (route) => {
    const path = route === '/' ? '/' : `/(app)/(tabs)/${route}`;
    router.push(path);
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
      {/* Ensures status bar icons remain dark/black */}
      <StatusBar style="dark" />

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
      />

      {/* Floating Dynamic Dock with Pure White BG & Black Outline Border */}
      <Animated.View
        style={{ width: dockWidth }}
        className="absolute bottom-8 self-center h-16 bg-white border-[0.2px] border-black rounded-full flex-row items-center justify-between px-2 shadow-lg shadow-black/10 z-50 overflow-hidden"
      >
        {!isExpanded ? (
          /* Collapsed State: Black background with white icon */
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => toggleDock(true)}
            className="w-full h-12 bg-black rounded-full items-center justify-center self-center"
          >
            <Ionicons name="apps-sharp" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          /* Expanded State: Pure white background with black border & bold text */
          <View className="flex-1 flex-row justify-around items-center px-1">
            {navItems.map((item) => {
              const isActive =
                item.route === '/'
                  ? currentPath === '/' || currentPath.endsWith('(tabs)')
                  : currentPath.includes(item.route);

              const isHome = item.route === '/';

              return (
                <TouchableOpacity
                  key={item.route}
                  activeOpacity={0.7}
                  onPress={() => handleNavigation(item.route)}
                  onLongPress={isHome ? () => toggleDock(false) : undefined}
                  delayLongPress={300}
                  className="items-center justify-center px-2 py-1 rounded-xl"
                >
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color={isActive ? ACTIVE_COLOR : INACTIVE_COLOR}
                  />
                  <Text
                    className={`text-[10px] mt-1 tracking-tight ${
                      isActive ? 'text-black font-black' : 'text-zinc-600 font-bold'
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
  );
}