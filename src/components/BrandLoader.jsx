import { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// A branded loading indicator styled after a clinical heart-rate monitor —
// a dark scope with a continuously sweeping ECG trace — which reads as
// "actively scanning" rather than a generic system spinner. Fits the app's
// existing visual language (the same near-black used for the home screen's
// trust banner, the same emerald used for its "verified" accents).
//
// Usage (unchanged from the previous version, existing call sites keep working):
//   <BrandLoader />                              full-screen, default message
//   <BrandLoader message="Loading your data…" />  full-screen, custom message
//   <BrandLoader fullScreen={false} size={72} />  compact, drops into a card
const VIEWBOX_W = 300;
const VIEWBOX_H = 100;

// One QRS-like complex, repeated across the width so the trace reads as a
// continuous rhythm rather than a single blip. Flat baseline, small P wave,
// sharp spike, flat again.
const ECG_PATH =
  'M0,50 L28,50 L38,42 L48,50 L66,50 L74,20 L82,86 L90,8 L98,50 L116,50 ' +
  'L126,42 L136,50 L154,50 L162,20 L170,86 L178,8 L186,50 L204,50 ' +
  'L214,42 L224,50 L242,50 L250,20 L258,86 L266,8 L274,50 L300,50';

// Rough total path length — doesn't need to be pixel-exact, it only sets the
// scale of the dash pattern used to fake a segment traveling along the path.
const PATH_LENGTH = 620;
const SWEEP_LENGTH = 90;

export default function BrandLoader({ message = 'Loading…', fullScreen = true, size = 96 }) {
  const sweep = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const sweeping = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    // A soft "heartbeat" thump on the live indicator dot — two quick beats
    // then a rest, closer to an actual pulse rhythm than a steady blink.
    const beating = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 160, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 460, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ])
    );
    sweeping.start();
    beating.start();
    return () => {
      sweeping.stop();
      beating.stop();
    };
  }, [sweep, pulse]);

  // Animate dashoffset through a full path-length cycle so the highlighted
  // "gap" in an otherwise-invisible dash pattern continuously travels along
  // the trace and wraps seamlessly — a lightweight way to fake a scanning
  // segment without per-frame path-point math.
  const dashOffset = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -PATH_LENGTH],
  });
  const dotScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] });
  const dotOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });

  const width = size * 2.4;
  const height = size * 0.8;

  const content = (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width,
          height,
          borderRadius: 18,
          backgroundColor: '#0B0F19',
          borderWidth: 1,
          borderColor: '#1F2937',
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Svg width="100%" height="100%" viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}>
          {/* Faint baseline trace — always visible, gives the scope structure */}
          <Path d={ECG_PATH} stroke="#1E293B" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          {/* Bright segment that appears to travel continuously along the trace */}
          <AnimatedPath
            d={ECG_PATH}
            stroke="#34D399"
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={`${SWEEP_LENGTH} ${PATH_LENGTH}`}
            strokeDashoffset={dashOffset}
          />
        </Svg>

        {/* Live indicator, top-left of the scope — a small "recording" cue */}
        <View style={{ position: 'absolute', top: 10, left: 12, flexDirection: 'row', alignItems: 'center' }}>
          <Animated.View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: '#34D399',
              marginRight: 5,
              opacity: dotOpacity,
              transform: [{ scale: dotScale }],
            }}
          />
          <Text style={{ fontSize: 9, color: '#64748B', fontWeight: '700', letterSpacing: 1 }}>SCANNING</Text>
        </View>
      </View>

      {message ? (
        <Text style={{ marginTop: 18, fontSize: 13.5, color: '#64748B', fontWeight: '500' }}>{message}</Text>
      ) : null}
    </View>
  );

  if (!fullScreen) {
    return content;
  }

  return (
    // Matches BRAND_BG in _layout.jsx / app.json's splash backgroundColor —
    // keep these in sync if the brand background ever changes.
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
      {content}
    </View>
  );
}
