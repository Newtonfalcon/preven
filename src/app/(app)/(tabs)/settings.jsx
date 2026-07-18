import { Text, View } from 'react-native';

export default function SettingsScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-lg font-semibold text-slate-900">Settings</Text>
      <Text className="mt-2 text-sm text-slate-500">Adjust app preferences and account settings.</Text>
    </View>
  );
}
