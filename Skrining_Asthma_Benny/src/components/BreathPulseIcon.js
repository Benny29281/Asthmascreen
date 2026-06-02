import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { COLORS } from '../utils/constants';

export default function BreathPulseIcon({ size = 118 }) {
  // Dua animasi ini mengatur pembesaran ikon dan tingkat cahaya luarnya.
  const pulse = useRef(new Animated.Value(0.84)).current;
  const glow = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Loop animasi membuat ikon terasa "bernapas" di splash dan auth screen.
    const animation = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.08,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0.84,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(glow, {
            toValue: 0.85,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glow, {
            toValue: 0.3,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [glow, pulse]);

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      {/* Lapisan luar dipakai sebagai efek glow. */}
      <Animated.View
        style={[
          styles.outerGlow,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            opacity: glow,
            transform: [{ scale: pulse }],
          },
        ]}
      />
      {/* Lapisan inti berisi ikon paru dan gelombang indikator. */}
      <View
        style={[
          styles.core,
          {
            width: size * 0.78,
            height: size * 0.78,
            borderRadius: (size * 0.78) / 2,
          },
        ]}
      >
        <MaterialCommunityIcons name="lungs" size={size * 0.4} color={COLORS.primaryLight} />
        <View style={styles.waveRow}>
          <View style={[styles.wave, styles.waveTall]} />
          <View style={[styles.wave, styles.waveShort]} />
          <View style={[styles.wave, styles.waveTall]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(91, 188, 235, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(91, 188, 235, 0.38)',
  },
  core: {
    backgroundColor: COLORS.bgCardLight,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveRow: {
    position: 'absolute',
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
  },
  wave: {
    width: 5,
    borderRadius: 999,
    backgroundColor: COLORS.warning,
  },
  waveTall: {
    height: 18,
  },
  waveShort: {
    height: 10,
  },
});
