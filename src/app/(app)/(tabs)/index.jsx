import { useUser } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const QUICK_TEST_STEPS = [
  {
    icon: 'sunny-outline',
    title: 'Bright, consistent lighting',
    description: 'Use daylight or clean white indoor light — avoid shadows and dim yellow lighting.',
  },
  {
    icon: 'scan-outline',
    title: 'Frame straight on',
    description: 'Hold the camera flat and parallel to the skin, kept steady so the shot is sharp.',
  },
  {
    icon: 'locate-outline',
    title: 'Add a reference anchor',
    description: 'Place a coin, sticker, or ruler edge beside the area — it\'s how we calculate real scale.',
  },
  {
    icon: 'create-outline',
    title: 'Add brief context notes',
    description: 'e.g. "Slight itching since yesterday" or "Routine 3-week check" — this sharpens insights.',
  },
  {
    icon: 'calendar-outline',
    title: 'Track at regular intervals',
    description: 'Space scans 2–4 weeks apart for clear, genuine trends rather than daily noise.',
  },
];

// Every route here is a real, registered screen — the previous version
// linked to "/(app)/summary", which doesn't exist as a route and would
// throw a navigation error if tapped.
const QUICK_LINKS = [
  { label: 'Progress Summary', description: 'Trends over time', route: '/(app)/(tabs)/visual-checkup', icon: 'bar-chart-sharp' },
  { label: 'Health Profile', description: 'Your scan history', route: '/(app)/(tabs)/health-profile', icon: 'person-sharp' },
  { label: 'Quick Test', description: 'Run a new scan', route: '/(app)/(tabs)/quick-test', icon: 'flask-sharp' },
  { label: 'Settings', description: 'Account & preferences', route: '/(app)/(tabs)/settings', icon: 'settings-sharp' },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const firstName = user?.firstName || user?.username || 'there';
  const avatarUrl = user?.imageUrl;
  const greeting = useMemo(() => getGreeting(), []);

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'left', 'right']}>
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 12, paddingBottom: insets.bottom + 130 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header — time-aware greeting, tap avatar to reach settings */}
        <View className="flex-row items-center justify-between mb-5">
          <View className="flex-1 pr-3">
            <Text className="text-slate-400 text-xs font-medium">{greeting}</Text>
            <Text className="text-slate-900 text-2xl font-black tracking-tight mt-0.5" numberOfLines={1}>
              {isLoaded ? firstName : '…'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/settings')} activeOpacity={0.8}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} className="w-12 h-12 rounded-full border border-slate-100" />
            ) : (
              <View className="w-12 h-12 rounded-full bg-white border border-slate-100 items-center justify-center">
                <Ionicons name="person" size={20} color="#94A3B8" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Primary CTA — the app's core action, given real visual weight */}
        <TouchableOpacity
          onPress={() => router.push('/(app)/(tabs)/quick-test')}
          activeOpacity={0.9}
          className="bg-black rounded-3xl p-6 mb-4 overflow-hidden"
        >
          <View className="w-11 h-11 rounded-2xl bg-white/10 items-center justify-center mb-4">
            <Ionicons name="flask-sharp" size={20} color="#FFFFFF" />
          </View>
          <Text className="text-white text-xl font-black tracking-tight">Run a Quick Test</Text>
          <Text className="text-slate-400 text-sm mt-1.5 leading-5" style={{ maxWidth: 260 }}>
            Photograph a spot and get a structural read-out — asymmetry, border, and size — in seconds.
          </Text>
          <View className="flex-row items-center mt-4">
            <Text className="text-white text-sm font-semibold">Get started</Text>
            <Ionicons name="arrow-forward" size={14} color="#FFFFFF" style={{ marginLeft: 6 }} />
          </View>
        </TouchableOpacity>

        {/* Clinical framing / trust banner — sets a healthcare tone, not a diagnosis */}
        <View className="bg-white border border-slate-100 rounded-3xl p-5 mb-4 flex-row items-start">
          <View className="w-9 h-9 rounded-full bg-emerald-50 items-center justify-center mr-3 mt-0.5">
            <Ionicons name="shield-checkmark" size={16} color="#10B981" />
          </View>
          <View className="flex-1">
            <Text className="text-slate-900 text-xs font-bold tracking-widest uppercase mb-1">
              Structured tracking, not a diagnosis
            </Text>
            <Text className="text-slate-500 text-sm leading-5">
              Preven records consistent, structured measurements over time so you and your doctor have a
              clear picture of change — it doesn't replace professional medical evaluation.
            </Text>
          </View>
        </View>

        {/* Explore — every destination is a real, valid route */}
        <Text className="text-slate-900 font-bold text-sm mb-3">Explore</Text>
        <View className="flex-row flex-wrap justify-between mb-4">
          {QUICK_LINKS.map((link) => (
            <TouchableOpacity
              key={link.route}
              onPress={() => router.push(link.route)}
              activeOpacity={0.8}
              className="w-[48%] bg-white border border-slate-100 rounded-2xl p-4 mb-3"
            >
              <View className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center mb-3">
                <Ionicons name={link.icon} size={18} color="#0F172A" />
              </View>
              <Text className="text-slate-900 text-sm font-semibold">{link.label}</Text>
              <Text className="text-slate-400 text-xs mt-0.5" numberOfLines={1}>{link.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* How to run a Quick Test */}
        <View className="bg-white border border-slate-100 rounded-3xl p-5 mb-4">
          <Text className="text-slate-900 font-bold text-sm mb-1">How to Get the Best Results</Text>
          <Text className="text-slate-400 text-xs mb-4">Five habits for accurate tracking and trend summaries</Text>

          {QUICK_TEST_STEPS.map((step, i) => (
            <View
              key={step.title}
              className={`flex-row items-start pb-3 mb-3 ${i === QUICK_TEST_STEPS.length - 1 ? '' : 'border-b border-slate-50'}`}
            >
              <View className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center mr-3 mt-0.5">
                <Ionicons name={step.icon} size={16} color="#0F172A" />
              </View>
              <View className="flex-1">
                <Text className="text-slate-900 text-sm font-semibold">{step.title}</Text>
                <Text className="text-slate-500 text-xs mt-0.5 leading-4">{step.description}</Text>
              </View>
            </View>
          ))}

          <TouchableOpacity
            onPress={() => router.push('/(app)/(tabs)/quick-test')}
            activeOpacity={0.85}
            className="mt-1 h-12 bg-black rounded-full items-center justify-center flex-row"
          >
            <Ionicons name="flask-sharp" size={16} color="white" style={{ marginRight: 8 }} />
            <Text className="text-white font-semibold text-sm">Start Quick Test</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
