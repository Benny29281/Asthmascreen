import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { COLORS } from '../utils/constants';
import { registerUser } from '../utils/api';

export default function RegisterScreen({ navigation }) {
  // Form register memisahkan password dan konfirmasi untuk validasi lokal.
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleRegister = async () => {
    // Validasi dasar dilakukan lebih dulu agar backend hanya menerima data yang layak.
    if (!form.full_name.trim() || !form.email.trim() || !form.password || !form.confirmPassword) {
      Alert.alert('Data belum lengkap', 'Lengkapi semua field untuk membuat akun.');
      return;
    }

    if (form.password.length < 6) {
      Alert.alert('Password terlalu pendek', 'Gunakan minimal 6 karakter.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      Alert.alert('Password tidak sama', 'Pastikan konfirmasi password sesuai.');
      return;
    }

    setSubmitting(true);
    const result = await registerUser({
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      password: form.password,
    });
    setSubmitting(false);

    if (!result.success) {
      Alert.alert('Register gagal', result.error);
      return;
    }

    Alert.alert('Register berhasil', 'Akun berhasil dibuat. Silakan login.', [
      { text: 'OK', onPress: () => navigation.replace('Login') },
    ]);
  };

  return (
    <LinearGradient colors={['#E0F4FF', '#F4FBFF', '#FFFFFF']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={COLORS.textPrimary} />
            <Text style={styles.backLabel}>Kembali ke login</Text>
          </Pressable>

          <Text style={styles.title}>Buat akun baru</Text>
          <Text style={styles.subtitle}>
            Registrasi user aplikasi agar bisa masuk ke halaman utama dan menggunakan fitur skrining.
          </Text>

          <View style={styles.card}>
            <InputField
              label="Nama Lengkap"
              icon="account-outline"
              value={form.full_name}
              onChangeText={(value) => updateField('full_name', value)}
              placeholder="Masukkan nama lengkap"
            />
            <InputField
              label="Email"
              icon="email-outline"
              value={form.email}
              onChangeText={(value) => updateField('email', value)}
              placeholder="nama@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <InputField
              label="Password"
              icon="lock-outline"
              value={form.password}
              onChangeText={(value) => updateField('password', value)}
              placeholder="Minimal 6 karakter"
              secureTextEntry
            />
            <InputField
              label="Konfirmasi Password"
              icon="shield-lock-outline"
              value={form.confirmPassword}
              onChangeText={(value) => updateField('confirmPassword', value)}
              placeholder="Ulangi password"
              secureTextEntry
            />

            <Pressable style={styles.primaryButton} onPress={handleRegister} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.primaryButtonText}>Register</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function InputField({ label, icon, ...props }) {
  return (
    // Dipisahkan sebagai komponen helper agar struktur tiap field tetap seragam.
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputShell}>
        <MaterialCommunityIcons name={icon} size={20} color={COLORS.primaryLight} />
        <TextInput
          placeholderTextColor={COLORS.textMuted}
          style={styles.input}
          {...props}
        />
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
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    marginBottom: 18,
  },
  backLabel: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 20,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
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
  primaryButton: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: COLORS.sehat,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
});
