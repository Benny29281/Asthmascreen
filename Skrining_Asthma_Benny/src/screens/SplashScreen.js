import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../utils/constants';
import BreathPulseIcon from '../components/BreathPulseIcon';

export default function SplashScreen() {
  // Fade dan lift dipakai untuk animasi kemunculan konten splash.
  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    // Jalankan animasi masuk satu kali saat splash screen dirender.
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(lift, {
        toValue: 0,
        duration: 900,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, lift]);

  return (
    <LinearGradient colors={['#DDF3FF', '#F4FBFF', '#FFFFFF']} style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fade, transform: [{ translateY: lift }] }]}>
        <BreathPulseIcon />
        <Text style={styles.title}>AsthmaScreen</Text>
        <Text style={styles.subtitle}>Menyiapkan sistem skrining dan pemeriksaan koneksi aplikasi</Text>
        <View style={styles.loaderTrack}>
          <View style={styles.loaderBar} />
        </View>
        <Text style={styles.caption}>Loading aplikasi...</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  content: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 34,
    fontWeight: '900',
    marginTop: 24,
    letterSpacing: 0.4,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 290,
  },
  loaderTrack: {
    width: '100%',
    height: 10,
    borderRadius: 999,
    backgroundColor: COLORS.bgInput,
    marginTop: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loaderBar: {
    width: '68%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: COLORS.primaryLight,
  },
  caption: {
    color: COLORS.warning,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 14,
  },
});
