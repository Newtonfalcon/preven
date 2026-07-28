import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Text, View } from 'react-native';

// A shared, branded loading indicator used across the app in place of a
// bare ActivityIndicator: a slowly rotating ring around a gently breathing
// logo badge — literally echoing what the app does (scanning), rather than
// a generic system spinner.
//
// Usage:
//   <BrandLoader />                              full-screen, default message
//   <BrandLoader message="Loading your data…" />  full-screen, custom message
//   <BrandLoader fullScreen={false} size={72} />  compact, drops into a card
export default function BrandLoader({ message = 'Loading…', fullScreen = true, size = 96 }) {
  const rotation = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1600,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const breathing = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    spin.start();
    breathing.start();
    return () => {
      spin.stop();
      breathing.stop();
    };
  }, [rotation, breathe]);

  const spinDeg = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const scale = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.02] });

  const ringSize = size;
  const badgeSize = Math.round(size * 0.62);
  const logoSize = Math.round(badgeSize * 0.5);

  const content = (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: ringSize, height: ringSize, alignItems: 'center', justifyContent: 'center' }}>
        {/* Rotating ring track — one bright quadrant standing in for a spinner */}
        <Animated.View
          style={{
            position: 'absolute',
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
            borderWidth: 3,
            borderColor: '#E2E8F0',
            borderTopColor: '#0F172A',
            transform: [{ rotate: spinDeg }],
          }}
        />
        {/* Breathing logo badge */}
        <Animated.View style={{ transform: [{ scale }] }}>
          <LinearGradient
            colors={['#1F2937', '#000000']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Image
              source={require('../../assets/images/logo.png')}
              style={{ width: logoSize, height: logoSize }}
              resizeMode="contain"
            />
          </LinearGradient>
        </Animated.View>
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
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
      {content}
    </View>
  );
}
