import { Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-lg font-semibold text-slate-900">Home</Text>
      <Text className="mt-2 text-sm text-slate-500">Welcome to the Preven home tab.</Text>
    </View>
  );
}
