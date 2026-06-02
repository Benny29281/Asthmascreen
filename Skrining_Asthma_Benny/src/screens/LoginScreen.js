import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import BreathPulseIcon from '../components/BreathPulseIcon';
import { COLORS } from '../utils/constants';
import { loginUser } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  // Fungsi login dari context akan menyimpan user dan token ke state global.
  const { login } = useAuth();
  // Form lokal hanya menyimpan input email dan password halaman ini.
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleLogin = async () => {
    // Validasi sederhana dilakukan di sisi client sebelum request dikirim.
    if (!form.email.trim() || !form.password) {
      Alert.alert('Data belum lengkap', 'Masukkan email dan password terlebih dahulu.');
      return;
    }

    setSubmitting(true);
    const result = await loginUser({
      email: form.email.trim(),
      password: form.password,
    });
    setSubmitting(false);

    if (!result.success) {
      Alert.alert('Login gagal', result.error);
      return;
    }

    // Kirim user data DAN token ke AuthContext
    login(result.data.user, result.data.token);
  };

  return (
    <LinearGradient colors={['#E0F4FF', '#F4FBFF', '#FFFFFF']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <View style={styles.hero}>
          <BreathPulseIcon size={96} />
          <Text style={styles.eyebrow}>AsthmaScreen</Text>
          <Text style={styles.title}>Masuk ke aplikasi</Text>
          <Text style={styles.subtitle}>
            Login terlebih dahulu untuk melanjutkan ke dashboard skrining asma.
          </Text>
        </View>

        <View style={styles.card}>
          <InputField
            label="Email"
            value={form.email}
            onChangeText={(value) => updateField('email', value)}
            placeholder="nama@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            icon="email-outline"
          />
          <InputField
            label="Password"
            value={form.password}
            onChangeText={(value) => updateField('password', value)}
            placeholder="Masukkan password"
            secureTextEntry
            icon="lock-outline"
          />

          <Pressable style={styles.primaryButton} onPress={handleLogin} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>Login</Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color={COLORS.white} />
              </>
            )}
          </Pressable>

          <Pressable style={styles.linkButton} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkLabel}>Belum punya akun? Register sekarang</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function InputField({ label, icon, secureTextEntry, ...props }) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPasswordField = Boolean(secureTextEntry);

  return (
    // Komponen input kecil ini dipakai ulang agar field login tetap konsisten.
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputShell}>
        <MaterialCommunityIcons name={icon} size={20} color={COLORS.primaryLight} />
        <TextInput
          placeholderTextColor={COLORS.textMuted}
          style={styles.input}
          secureTextEntry={isPasswordField ? !passwordVisible : false}
          {...props}
        />
        {isPasswordField ? (
          <Pressable
            onPress={() => setPasswordVisible((current) => !current)}
            hitSlop={8}
            style={styles.toggleButton}
          >
            <MaterialCommunityIcons
              name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={COLORS.primaryLight}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 28,
  },
  eyebrow: {
    color: COLORS.primaryLight,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 18,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 30,
    fontWeight: '900',
    marginTop: 8,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 300,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  fieldWrap: {
    marginBottom: 16,
  },
  fieldLabel: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.bgInput,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    minHeight: 54,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  toggleButton: {
    padding: 2,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 18,
  },
  linkLabel: {
    color: COLORS.primaryLight,
    fontSize: 13,
    fontWeight: '700',
  },
});
