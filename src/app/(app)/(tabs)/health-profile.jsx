import { Text, View } from 'react-native';

export default function HealthProfileScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-lg font-semibold text-slate-900">Health Profile</Text>
      <Text className="mt-2 text-sm text-slate-500">View and manage your health profile.</Text>
    </View>
  );
}
