import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Defs, Line, Stop, LinearGradient as SvgGradient } from "react-native-svg";

let useFonts, Fraunces_500Medium, Fraunces_600SemiBold_Italic, Manrope_500Medium, Manrope_700Bold;
try {
  ({ useFonts } = require("expo-font"));
  ({ Fraunces_500Medium, Fraunces_600SemiBold_Italic } = require("@expo-google-fonts/fraunces"));
  ({ Manrope_500Medium, Manrope_700Bold } = require("@expo-google-fonts/manrope"));
} catch (e) {
  useFonts = null;
}

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");

const RAW = {
  black: "#000000",
  black2: "#040405",
  line: "#FFFFFF",
};

function ShootingStreak({ x, delay, duration, angle, streakHeight, width }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const run = () => {
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => run());
    };
    run();
  }, [progress, delay, duration]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-streakHeight, SCREEN_H + streakHeight],
  });

  const drift = SCREEN_H * 0.06 * (angle > 0 ? 1 : -1) * (Math.abs(angle) / 6);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, drift],
  });

  return (
    <Animated.View
      pointerEvents="none"
      className="absolute top-0"
      style={{
        left: x,
        transform: [{ translateX }, { translateY }, { rotate: `${angle}deg` }],
      }}
    >
      <Svg width={width} height={streakHeight} viewBox={`0 0 ${width} ${streakHeight}`}>
        <Defs>
          <SvgGradient id="tail" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={RAW.line} stopOpacity="0" />
            <Stop offset="1" stopColor={RAW.line} stopOpacity="0.85" />
          </SvgGradient>
        </Defs>
        <Line
          x1={width / 2}
          y1={0}
          x2={width / 2}
          y2={streakHeight}
          stroke="url(#tail)"
          strokeWidth={1}
          strokeLinecap="round"
        />
        <Circle cx={width / 2} cy={streakHeight} r={1.3} fill={RAW.line} opacity={0.9} />
      </Svg>
    </Animated.View>
  );
}

function FallingLines({ count = 16 }) {
  const streaks = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => {
        const streakHeight = 90 + Math.random() * 70;
        const angle = (Math.random() > 0.5 ? 1 : -1) * (15 + Math.random() * 15);
        return {
          key: i,
          x: Math.random() * SCREEN_W,
          delay: Math.random() * 4500,
          duration: 3200 + Math.random() * 2800,
          angle,
          streakHeight,
          width: 14,
        };
      }),
    [count]
  );

  return (
    <View className="absolute inset-0">
      {streaks.map((s) => (
        <ShootingStreak key={s.key} {...s} />
      ))}
    </View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();

  let fontsLoaded = true;
  if (useFonts) {
    [fontsLoaded] = useFonts({
      Fraunces_500Medium,
      Fraunces_600SemiBold_Italic,
      Manrope_500Medium,
      Manrope_700Bold,
    });
  }

  const displayFont = fontsLoaded && Fraunces_500Medium ? "font-[Fraunces_500Medium]" : "font-serif";
  const taglineFont =
    fontsLoaded && Fraunces_600SemiBold_Italic ? "font-[Fraunces_600SemiBold_Italic]" : "italic";
  const bodyFont = fontsLoaded && Manrope_500Medium ? "font-[Manrope_500Medium]" : "";
  const boldFont = fontsLoaded && Manrope_700Bold ? "font-[Manrope_700Bold]" : "font-bold";

  return (
    <View className="flex-1 bg-black">
      <LinearGradient
        colors={[RAW.black, RAW.black2, RAW.black]}
        style={StyleSheet.absoluteFill}
      />

      <FallingLines count={16} />

      <SafeAreaView className="flex-1">
        <View className="flex-1 items-center justify-between px-8 py-10">
          <View className="flex-1 items-center justify-center">
            <Image
              source={require("../../assets/images/logo.png")}
              className="w-28 h-28 mb-5"
              resizeMode="contain"
            />
            <Text className={`${displayFont} text-3xl tracking-tight text-[#F5F3EF]`}>
              Preven
            </Text>
            <Text className={`${taglineFont} mt-3 text-base text-center px-6 text-[#8B93A0]`}>
              Quiet, early attention  before it needs to be urgent.
            </Text>
          </View>

          <View className="w-full">
            <Pressable
              onPress={() => router.push("/(auth)/sign-up")}
              className="w-full rounded-2xl py-4 items-center mb-3 bg-white active:opacity-80"
            >
              <Text className={`${boldFont} text-base text-black`}>Create account</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/(auth)/sign-in")}
              className="w-full rounded-2xl py-4 items-center mb-6 bg-white active:opacity-80"
            >
              <Text className={`${bodyFont} text-base text-black`}>Sign in</Text>
            </Pressable>

            <Text className={`${bodyFont} text-xs text-center px-4 text-[#8B93A0]`}>
              Every photo is analyzed on your device. Nothing is uploaded.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}