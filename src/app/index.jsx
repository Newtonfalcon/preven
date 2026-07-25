import { Fraunces_500Medium, Fraunces_600SemiBold } from "@expo-google-fonts/fraunces";
import { Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold } from "@expo-google-fonts/manrope";
import { Feather } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ---- Design tokens -----------------------------------------------------
// Pure black & white, matching the rest of the app's black-CTA / white-page
// convention (sign-in, sign-up) — no color accent.
const COLORS = {
  bg: "#FFFFFF",
  ink: "#0F172A",
  sub: "#475569",
  muted: "#94A3B8",
  cardBg: "#F8FAFC",
  cardBorder: "#E2E8F0",
  accent: "#000000",
  accentDeep: "#1F2937",
  accentSoft: "#F1F5F9",
};

const STEPS = [
  {
    icon: "camera",
    title: "Photograph",
    body: "A guided photo, under a minute.",
  },
  {
    icon: "trending-up",
    title: "Track",
    body: "Asymmetry, border & size, side by side.",
  },
  {
    icon: "shield",
    title: "Stay informed",
    body: "Plain-language notes, never a diagnosis.",
  },
];

// Ambient floating shapes behind the content — soft, slow, low-opacity.
// Gives the screen life without competing with the text.
function FloatingField() {
  const a = useRef(new Animated.Value(0)).current;
  const b = useRef(new Animated.Value(0)).current;
  const c = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const drift = (val, duration, delay = 0) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
    const loops = [drift(a, 5200), drift(b, 6400, 400), drift(c, 7100, 900)];
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [a, b, c]);

  const t = (val, range) => val.interpolate({ inputRange: [0, 1], outputRange: range });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <Animated.View
        style={[
          styles.blob,
          {
            width: 260,
            height: 260,
            top: -60,
            right: -70,
            backgroundColor: COLORS.accentSoft,
            transform: [{ translateY: t(a, [0, 22]) }, { translateX: t(a, [0, -14]) }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.blob,
          {
            width: 200,
            height: 200,
            bottom: 90,
            left: -80,
            backgroundColor: "#F8FAFC",
            transform: [{ translateY: t(b, [0, -18]) }, { translateX: t(b, [0, 12]) }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.blob,
          {
            width: 150,
            height: 150,
            top: "38%",
            right: -50,
            backgroundColor: "#EEF1F4",
            transform: [{ translateY: t(c, [0, 16]) }, { translateX: t(c, [0, -10]) }],
          },
        ]}
      />
    </View>
  );
}

function StepCard({ icon, title, body, width, bodyFont, boldFont }) {
  return (
    <View style={[styles.card, { width }]}>
      <View style={styles.cardIcon}>
        <Feather name={icon} size={18} color={COLORS.accent} />
      </View>
      <Text style={{ marginTop: 12, fontSize: 15, color: COLORS.ink, fontFamily: boldFont }}>{title}</Text>
      <Text style={{ marginTop: 4, fontSize: 12.5, lineHeight: 18, color: COLORS.sub, fontFamily: bodyFont }}>
        {body}
      </Text>
    </View>
  );
}

export default function Index() {
  const router = useRouter();
  const { height, width } = useWindowDimensions();
  const compact = height < 700;

  const [fontsLoaded] = useFonts({
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  const displayFont = fontsLoaded ? "Fraunces_500Medium" : undefined;
  const displaySemiFont = fontsLoaded ? "Fraunces_600SemiBold" : undefined;
  const bodyFont = fontsLoaded ? "Manrope_500Medium" : undefined;
  const semiFont = fontsLoaded ? "Manrope_600SemiBold" : undefined;
  const boldFont = fontsLoaded ? "Manrope_700Bold" : undefined;

  const cardWidth = Math.min(190, width * 0.5);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <FloatingField />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: "space-between", paddingBottom: 10 }}>
          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: compact ? 4 : 10 }}>
            <LinearGradient
              colors={[COLORS.accent, COLORS.accentDeep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoBadge}
            >
              <Image
                source={require("../../assets/images/logo.png")}
                style={{ width: 22, height: 22 }}
                resizeMode="contain"
              />
            </LinearGradient>
            <Text style={{ marginLeft: 10, fontSize: 17, color: COLORS.ink, fontFamily: displayFont }}>Preven</Text>
          </View>

          {/* Hero */}
          <View style={{ marginTop: compact ? 12 : 20 }}>
            <Text
              style={{
                fontSize: compact ? 26 : 30,
                lineHeight: compact ? 32 : 37,
                color: COLORS.ink,
                fontFamily: displaySemiFont,
              }}
            >
              Quiet, early attention{"\n"}before it needs to be urgent.
            </Text>
            <Text
              style={{
                marginTop: 12,
                fontSize: 14.5,
                lineHeight: 21,
                color: COLORS.sub,
                fontFamily: bodyFont,
                maxWidth: 340,
              }}
            >
              A calm, structured way to notice real skin change early — without turning every mole into a
              crisis.
            </Text>
          </View>

          {/* How it works — horizontal cards */}
          <View style={{ marginTop: compact ? 14 : 22 }}>
            <Text
              style={{
                fontSize: 11,
                letterSpacing: 1.4,
                textTransform: "uppercase",
                color: COLORS.muted,
                fontFamily: semiFont,
                marginBottom: 10,
              }}
            >
              How it works
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={cardWidth + 12}
              decelerationRate="fast"
              contentContainerStyle={{ paddingRight: 24 }}
            >
              {STEPS.map((step, i) => (
                <View key={step.title} style={{ marginRight: i === STEPS.length - 1 ? 0 : 12 }}>
                  <StepCard {...step} width={cardWidth} bodyFont={bodyFont} boldFont={semiFont} />
                </View>
              ))}
            </ScrollView>
          </View>

          {/* CTA */}
          <View style={{ marginTop: compact ? 14 : 22 }}>
            <Pressable onPress={() => router.push("/(auth)/sign-up")}>
              {({ pressed }) => (
                <View
                  style={[
                    styles.button,
                    { backgroundColor: pressed ? COLORS.accentDeep : COLORS.accent },
                  ]}
                >
                  <Text style={{ fontSize: 16, color: "#FFFFFF", fontFamily: boldFont }}>Get started</Text>
                </View>
              )}
            </Pressable>

            <Pressable
              onPress={() => router.push("/(auth)/sign-in")}
              style={{ marginTop: 14, alignItems: "center" }}
              hitSlop={8}
            >
              <Text style={{ fontSize: 13.5, color: COLORS.sub, fontFamily: bodyFont }}>
                Already using Preven?{" "}
                <Text style={{ color: COLORS.ink, fontFamily: boldFont }}>Log in</Text>
              </Text>
            </Pressable>

            <Text
              style={{
                marginTop: compact ? 10 : 16,
                textAlign: "center",
                fontSize: 10.5,
                letterSpacing: 1.3,
                textTransform: "uppercase",
                color: COLORS.muted,
                fontFamily: semiFont,
              }}
            >
              Powered by Netech
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.9,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    height: 140,
  },
  cardIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    width: "100%",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 3,
  },
});
