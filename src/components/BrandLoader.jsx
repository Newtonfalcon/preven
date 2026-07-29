import { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// A shared, branded loading indicator: a continuously scrolling heartbeat
// pulse line, inspired by vital-sign scanners but deliberately restrained —
// a single smooth monochrome curve rather than a clinical ECG grid, so it
// reads as a calm, considered app rather than a hospital monitor.
//
// Usage:
//   <BrandLoader />                              full-screen, default message
//   <BrandLoader message="Loading your data…" />  full-screen, custom message
//   <BrandLoader fullScreen={false} size={64} />  compact, drops into a card
const UNIT_WIDTH = 220;
const HEIGHT = 64;

// One "heartbeat" unit: a long flat baseline, one smooth rise to a peak,
// one smooth fall to a trough, and a smooth return to baseline. Built with
// gentle cubic curves rather than sharp straight-line ECG segments.
const PULSE_UNIT = `M0,32 C34,32 46,32 58,32 C70,32 76,8 88,8 C100,8 104,58 116,58 C124,58 130,32 142,32 C170,32 190,32 ${UNIT_WIDTH},32`;

export default function BrandLoader({ message = 'Loading…', fullScreen = true, size = 96 }) {
  const scroll = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const scrolling = Animated.loop(
      Animated.timing(scroll, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const pulsing = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    scrolling.start();
    pulsing.start();
    return () => {
      scrolling.stop();
      pulsing.stop();
    };
  }, [scroll, pulse]);

  const translateX = scroll.interpolate({ inputRange: [0, 1], outputRange: [0, -UNIT_WIDTH] });
  const dotScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.25] });
  const dotOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });

  const viewportWidth = Math.min(UNIT_WIDTH, size * 1.9);
  const scale = viewportWidth / UNIT_WIDTH;
  const viewportHeight = HEIGHT * scale;

  const content = (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: viewportWidth,
          height: viewportHeight,
          overflow: 'hidden',
          justifyContent: 'center',
        }}
      >
        <Animated.View style={{ flexDirection: 'row', transform: [{ translateX }] }}>
          <Svg width={UNIT_WIDTH * scale} height={viewportHeight} viewBox={`0 0 ${UNIT_WIDTH} ${HEIGHT}`}>
            <Path d={PULSE_UNIT} stroke="#0F172A" strokeWidth={3} strokeLinecap="round" fill="none" />
          </Svg>
          <Svg width={UNIT_WIDTH * scale} height={viewportHeight} viewBox={`0 0 ${UNIT_WIDTH} ${HEIGHT}`}>
            <Path d={PULSE_UNIT} stroke="#0F172A" strokeWidth={3} strokeLinecap="round" fill="none" />
          </Svg>
        </Animated.View>

        {/* Live-reading marker at the trailing edge */}
        <Animated.View
          style={{
            position: 'absolute',
            right: 6,
            top: viewportHeight / 2 - 4,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#0F172A',
            opacity: dotOpacity,
            transform: [{ scale: dotScale }],
          }}
        />
      </View>

      {fullScreen ? (
        <Text
          style={{
            marginTop: 14,
            fontSize: 15,
            color: '#0F172A',
            fontWeight: '600',
            letterSpacing: -0.2,
          }}
        >
          Preven
        </Text>
      ) : null}

      {message ? (
        <Text style={{ marginTop: fullScreen ? 4 : 14, fontSize: 13, color: '#94A3B8' }}>{message}</Text>
      ) : null}
    </View>
  );

  if (!fullScreen) {
    return content;
  }

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
      {content}
    </View>
  );
}
