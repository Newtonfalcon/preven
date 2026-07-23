import { useUser } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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

const QUICK_LINKS = [
  { label: 'Visual Checkup', route: '/(app)/(tabs)/visual-checkup', icon: 'camera-sharp' },
  { label: 'Health Profile', route: '/(app)/(tabs)/health-profile', icon: 'person-sharp' },
  { label: 'Progress Summary', route: '/(app)/summary', icon: 'bar-chart-sharp' },
  { label: 'Settings', route: '/(app)/(tabs)/settings', icon: 'settings-sharp' },
];

export default function HomeScreen() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const firstName = user?.firstName || user?.username || 'there';
  const email = user?.primaryEmailAddress?.emailAddress;
  const avatarUrl = user?.imageUrl;

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'left', 'right']}>
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 8, paddingBottom: insets.bottom + 130 }}
      >
        {/* User data card */}
        <View className="bg-white border border-slate-100 rounded-3xl p-5 mb-4 flex-row items-center">
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} className="w-14 h-14 rounded-full mr-4" />
          ) : (
            <View className="w-14 h-14 rounded-full bg-slate-100 items-center justify-center mr-4">
              <Ionicons name="person" size={22} color="#94A3B8" />
            </View>
          )}
          <View className="flex-1">
            <Text className="text-slate-400 text-xs font-medium">Welcome back</Text>
            <Text className="text-slate-900 text-lg font-bold mt-0.5" numberOfLines={1}>
              {isLoaded ? firstName : '…'}
            </Text>
            {email ? (
              <Text className="text-slate-400 text-xs mt-0.5" numberOfLines={1}>
                {email}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Clinical framing / trust banner — sets a healthcare tone, not a diagnosis */}
        <View className="bg-black rounded-3xl p-5 mb-4">
          <View className="flex-row items-center mb-2">
            <Ionicons name="shield-checkmark" size={16} color="#34D399" />
            <Text className="text-white text-[11px] font-bold ml-2 tracking-widest">
              STRUCTURED TRACKING, NOT A DIAGNOSIS
            </Text>
          </View>
          <Text className="text-slate-300 text-sm leading-5">
            Preven records consistent, structured measurements over time so you and your doctor have a
            clear picture of change — it doesn't replace professional medical evaluation.
          </Text>
        </View>

        {/* How to run a Quick Test */}
        <View className="bg-white border border-slate-100 rounded-3xl p-5 mb-4">
          <Text className="text-slate-900 font-bold text-sm mb-1">How to Get the Best Results</Text>
          <Text className="text-slate-400 text-xs mb-4">Five habits for accurate tracking and trend summaries</Text>

          {QUICK_TEST_STEPS.map((step) => (
            <View key={step.title} className="flex-row items-start mb-3">
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
            className="mt-2 h-12 bg-black rounded-full items-center justify-center flex-row"
          >
            <Ionicons name="flask-sharp" size={16} color="white" style={{ marginRight: 8 }} />
            <Text className="text-white font-semibold text-sm">Start Quick Test</Text>
          </TouchableOpacity>
        </View>

        {/* Quick links to other screens */}
        <Text className="text-slate-900 font-bold text-sm mb-3">Explore</Text>
        <View className="flex-row flex-wrap justify-between">
          {QUICK_LINKS.map((link) => (
            <TouchableOpacity
              key={link.route}
              onPress={() => router.push(link.route)}
              className="w-[48%] bg-white border border-slate-100 rounded-2xl p-4 mb-3 items-start"
            >
              <View className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center mb-3">
                <Ionicons name={link.icon} size={18} color="#0F172A" />
              </View>
              <Text className="text-slate-900 text-sm font-semibold">{link.label}</Text>
              <View className="flex-row items-center mt-1">
                <Text className="text-slate-400 text-xs mr-1">Open</Text>
                <Ionicons name="arrow-forward" size={12} color="#94A3B8" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}