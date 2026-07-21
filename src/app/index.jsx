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
import Svg, { Defs, Path, Stop, LinearGradient as SvgGradient } from "react-native-svg";

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
  bg: "#040405",
  pulse: "#3DDC97",
  logoText: "#F5F3EF",
  muted: "#8B93A0",
};

const UNIT_WIDTH = 220;
const UNIT_HEIGHT = 100;
const UNIT_PATH =
  "L28,50 L36,50 L44,42 L52,58 L60,14 L68,86 L76,50 L84,50 L112,50 " +
  "L126,38 L140,50 L220,50";

const NUMBER_PAIR = /(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g;

function buildLoopPath(repeats) {
  let d = "M0,50 ";
  for (let i = 0; i < repeats; i++) {
    const shifted = UNIT_PATH.replace(NUMBER_PAIR, (_match, x, y) => {
      return `${parseFloat(x) + i * UNIT_WIDTH},${y}`;
    });
    d += shifted + " ";
  }
  return d.trim();
}

function HeartRateScanner({ height = 110, top = SCREEN_H * 0.28, opacity = 0.55 }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  const repeats = Math.ceil((SCREEN_W * 2) / UNIT_WIDTH) + 2;
  const totalWidth = UNIT_WIDTH * repeats;
  const fullPath = useMemo(() => buildLoopPath(repeats), [repeats]);

  useEffect(() => {
    const scrollLoop = Animated.loop(
      Animated.timing(translateX, {
        toValue: -UNIT_WIDTH,
        duration: 1300,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    scrollLoop.start();
    return () => scrollLoop.stop();
  }, [translateX]);

  useEffect(() => {
    const beatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 620,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 680,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    beatLoop.start();
    return () => beatLoop.stop();
  }, [pulse]);

  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.6] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.75] });
  const coreOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top,
        left: 0,
        right: 0,
        height,
        overflow: "hidden",
        opacity,
      }}
    >
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: height / 2,
          height: StyleSheet.hairlineWidth,
          backgroundColor: "rgba(61,220,151,0.15)",
        }}
      />

      <Animated.View style={{ flexDirection: "row", transform: [{ translateX }] }}>
        <Svg width={totalWidth} height={height} viewBox={`0 0 ${totalWidth} ${UNIT_HEIGHT}`}>
          <Defs>
            <SvgGradient id="pulseLine" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={RAW.pulse} stopOpacity="0" />
              <Stop offset="0.12" stopColor={RAW.pulse} stopOpacity="0.9" />
              <Stop offset="0.5" stopColor={RAW.pulse} stopOpacity="1" />
              <Stop offset="0.88" stopColor={RAW.pulse} stopOpacity="0.9" />
              <Stop offset="1" stopColor={RAW.pulse} stopOpacity="0" />
            </SvgGradient>
          </Defs>
          <Path
            d={fullPath}
            stroke="url(#pulseLine)"
            strokeWidth={1.75}
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: SCREEN_W / 2 - 14,
          top: height / 2 - 14,
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: RAW.pulse,
          opacity: glowOpacity,
          transform: [{ scale: glowScale }],
        }}
      />
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: SCREEN_W / 2 - 4,
          top: height / 2 - 4,
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: "#EAFBF3",
          opacity: coreOpacity,
        }}
      />
    </View>
  );
}

export default function Index() {
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

  const displayFont = fontsLoaded && Fraunces_500Medium ? "Fraunces_500Medium" : undefined;
  const taglineFontFamily =
    fontsLoaded && Fraunces_600SemiBold_Italic ? "Fraunces_600SemiBold_Italic" : undefined;
  const bodyFont = fontsLoaded && Manrope_500Medium ? "Manrope_500Medium" : undefined;
  const boldFont = fontsLoaded && Manrope_700Bold ? "Manrope_700Bold" : undefined;

  return (
    <View style={{ flex: 1, backgroundColor: RAW.bg }}>
      <HeartRateScanner />

      <SafeAreaView style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 32,
            paddingVertical: 40,
          }}
        >
          <View style={{ alignItems: "center", justifyContent: "center", marginTop: "auto", marginBottom: "auto" }}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={{ width: 112, height: 112, marginBottom: 20 }}
              resizeMode="contain"
            />
            <Text
              style={{
                fontSize: 30,
                letterSpacing: -0.5,
                color: RAW.logoText,
                fontFamily: displayFont,
              }}
            >
              Preven
            </Text>
            <Text
              style={{
                marginTop: 12,
                fontSize: 16,
                textAlign: "center",
                paddingHorizontal: 24,
                color: RAW.muted,
                fontFamily: taglineFontFamily,
                fontStyle: taglineFontFamily ? "normal" : "italic",
              }}
            >
              Quiet, early attention before it needs to be urgent.
            </Text>
          </View>

          <View style={{ width: "100%" }}>
            {/* FIXED: Using a nested View callback to handle background rendering flawlessly */}
            <Pressable onPress={() => router.push("/(auth)/sign-in")} style={{ width: "100%" }}>
              {({ pressed }) => (
                <View
                  style={[
                    styles.button,
                    { backgroundColor: pressed ? "#EAEAEA" : "#FFFFFF" }
                  ]}
                >
                  <Text
                    style={{
                      color: "#000000",
                      fontSize: 16,
                      textAlign: "center",
                      fontFamily: boldFont,
                      fontWeight: boldFont ? "normal" : "bold",
                    }}
                  >
                    Log in
                  </Text>
                </View>
              )}
            </Pressable>

            <Text
              style={{
                marginTop: 16,
                fontSize: 12,
                textAlign: "center",
                paddingHorizontal: 16,
                color: RAW.muted,
                fontFamily: bodyFont,
              }}
            >
              Every photo is analyzed on your device. Nothing is uploaded.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: "hidden", // Ensures background stays clipped inside borders
  },
});
