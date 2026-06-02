// ============================================================
// HOME SCREEN - AsthmaScreen
// ============================================================
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, StatusBar, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { COLORS } from '../utils/constants';
import { checkServerHealth } from '../utils/api';

const BOTTOM_ITEMS = [
  { label: 'Skrining', icon: 'clipboard-pulse-outline', route: 'Home' },
  { label: 'Riwayat', icon: 'history', route: 'History' },
  { label: 'About', icon: 'information-outline', route: 'About' },
  { label: 'Profil', icon: 'account-circle-outline', route: 'Profile' },
];

const FEATURE_CARDS = [
  {
    icon: 'account-heart-outline',
    title: 'Data Pasien Lebih Terarah',
    desc: 'Form skrining membantu pengguna mengisi identitas, gejala, riwayat kesehatan, dan faktor pemicu secara runtut.',
  },
  {
    icon: 'stethoscope',
    title: 'Fokus pada Gejala Kunci',
    desc: 'Sistem menyoroti keluhan yang sering berkaitan dengan asma seperti batuk, mengi, sesak napas, dan dada terasa berat.',
  },
  {
    icon: 'chart-timeline-variant',
    title: 'Hasil Cepat dan Mudah Dibaca',
    desc: 'Setelah data dikirim, aplikasi menampilkan klasifikasi risiko dan ringkasan hasil untuk mendukung skrining awal.',
  },
];

const FLOW_STEPS = [
  'Isi identitas dan kondisi pasien sesuai form yang tersedia.',
  'Tambahkan gejala, riwayat penyakit, dan kebiasaan yang relevan.',
  'Kirim data untuk dianalisis model prediksi asma.',
  'Baca hasil skrining lalu lanjutkan konsultasi bila dibutuhkan.',
];

export default function HomeScreen({ navigation }) {
  // Status backend dipakai untuk menentukan apakah tombol skrining siap dipakai.
  const [serverOk, setServerOk] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    // Panggil endpoint health untuk mengecek apakah server Flask aktif.
    setChecking(true);
    const health = await checkServerHealth();
    const isReady = health.success && health.data?.status === 'ok';
    setServerOk(isReady);
    setChecking(false);
  };

  const statusLabel = checking
    ? 'Memeriksa koneksi ke backend...'
    : serverOk
      ? 'Sistem analisis siap digunakan'
      : 'Backend belum aktif, nyalakan server terlebih dahulu';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <LinearGradient colors={['#EAF7FF', '#F8FDFF']} style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.headerEyebrow}>AsthmaScreen</Text>
          <Text style={styles.headerTitle}>Skrining awal gejala dan risiko asma</Text>
          <Text style={styles.headerSub}>
            Bantu pengguna membaca kondisi pasien melalui alur skrining yang sederhana dan informatif.
          </Text>
        </View>
        <TouchableOpacity onPress={checkStatus} style={styles.headerAction}>
          {checking ? (
            <ActivityIndicator color={COLORS.primaryLight} size="small" />
          ) : (
            <MaterialCommunityIcons name="refresh" size={22} color={COLORS.primaryLight} />
          )}
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <LinearGradient colors={['#1E88C8', '#55B6E8', '#DFF5FF']} style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroBadge}>
              <MaterialCommunityIcons name="lungs" size={18} color={COLORS.white} />
              <Text style={styles.heroBadgeText}>AsthmaScreen</Text>
            </View>
            <View style={styles.heroPulse}>
              <MaterialCommunityIcons name="pulse" size={18} color={COLORS.primaryDark} />
            </View>
          </View>

          <Text style={styles.heroTitle}>Skrining data pasien dalam satu alur yang jelas</Text>
          <Text style={styles.heroDesc}>
            Mulai dari identitas pasien, gejala, riwayat keluarga, hingga faktor pemicu lingkungan, semuanya dikemas dalam alur yang rapi untuk mendukung deteksi awal.
          </Text>

          <View style={styles.heroActionRow}>
            <TouchableOpacity
              style={[styles.primaryAction, !serverOk && styles.primaryActionDisabled]}
              onPress={() => serverOk && navigation.navigate('Screening', {
                datasetMode: 'local',
                screenTitle: 'Skrining Asthma',
                screenSub: 'Form skrining model terbaik',
              })}
              activeOpacity={0.86}
            >
              <Text style={styles.primaryActionText}>Mulai Skrining</Text>
              <MaterialCommunityIcons name="arrow-right" size={18} color={COLORS.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={() => navigation.navigate('About')}
              activeOpacity={0.86}
            >
              <Text style={styles.secondaryActionText}>Pelajari Aplikasi</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.statusCard}>
          <View style={styles.statusIconWrap}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: serverOk ? COLORS.sehat : serverOk === false ? COLORS.asma : COLORS.warning },
              ]}
            />
            <MaterialCommunityIcons
              name={serverOk ? 'server' : 'server-network-off'}
              size={18}
              color={COLORS.textPrimary}
            />
          </View>
          <View style={styles.statusCopy}>
            <Text style={styles.statusTitle}>Status sistem</Text>
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Area utama skrining pasien</Text>
        {FEATURE_CARDS.map((item) => (
          <View key={item.title} style={styles.featureCard}>
            <View style={styles.featureIconWrap}>
              <MaterialCommunityIcons name={item.icon} size={26} color={COLORS.primaryDark} />
            </View>
            <View style={styles.featureCopy}>
              <Text style={styles.featureTitle}>{item.title}</Text>
              <Text style={styles.featureDesc}>{item.desc}</Text>
            </View>
          </View>
        ))}

        <View style={styles.flowCard}>
          <Text style={styles.flowTitle}>Alur singkat skrining data pasien</Text>
          {FLOW_STEPS.map((step, index) => (
            <View key={step} style={styles.flowRow}>
              <View style={styles.flowIndex}>
                <Text style={styles.flowIndexText}>{index + 1}</Text>
              </View>
              <Text style={styles.flowText}>{step}</Text>
            </View>
          ))}
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Catatan penting</Text>
          <Text style={styles.noteText}>
            Aplikasi ini membantu skrining awal dan bukan pengganti diagnosis dokter. Bila pasien menunjukkan gejala berat atau hasil skrining berisiko, segera arahkan ke tenaga kesehatan.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        {/* Bottom navigation dibuat dari array agar definisinya tidak berulang. */}
        {BOTTOM_ITEMS.map((item) => {
          const active = item.route === 'Home';
          return (
            <TouchableOpacity
              key={item.route}
              style={styles.bottomItem}
              onPress={() => navigation.navigate(item.route)}
              disabled={active}
            >
              <MaterialCommunityIcons
                name={item.icon}
                size={23}
                color={active ? COLORS.primaryLight : COLORS.textMuted}
              />
              <Text style={[styles.bottomLabel, active && styles.bottomActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 54,
    paddingBottom: 18,
    paddingHorizontal: 18,
    gap: 12,
  },
  headerCopy: { flex: 1 },
  headerEyebrow: {
    fontSize: 12,
    color: COLORS.primaryLight,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  headerTitle: { fontSize: 28, fontWeight: '900', color: COLORS.textPrimary, marginTop: 6, lineHeight: 34 },
  headerSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 8, lineHeight: 19 },
  headerAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 4,
  },
  scroll: { padding: 16, paddingBottom: 112 },
  heroCard: {
    borderRadius: 28,
    padding: 22,
    marginBottom: 16,
    overflow: 'hidden',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  heroBadgeText: { color: COLORS.white, fontSize: 12, fontWeight: '800' },
  heroPulse: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { color: COLORS.white, fontSize: 28, fontWeight: '900', lineHeight: 34, maxWidth: '92%' },
  heroDesc: { color: 'rgba(255,255,255,0.9)', fontSize: 13, lineHeight: 20, marginTop: 12 },
  heroActionRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  primaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.textPrimary,
    borderRadius: 14,
    paddingVertical: 14,
  },
  primaryActionDisabled: { opacity: 0.55 },
  primaryActionText: { color: COLORS.white, fontSize: 14, fontWeight: '900' },
  secondaryAction: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.88)',
  },
  secondaryActionText: { color: COLORS.primaryDark, fontSize: 13, fontWeight: '800' },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
    gap: 12,
  },
  statusIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: COLORS.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusCopy: { flex: 1 },
  statusTitle: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '800' },
  statusText: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 4 },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
  },
  featureCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: COLORS.bgCard,
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  featureIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureCopy: { flex: 1 },
  featureTitle: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '900' },
  featureDesc: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 5 },
  flowCard: {
    backgroundColor: '#12324A',
    borderRadius: 22,
    padding: 18,
    marginTop: 10,
  },
  flowTitle: { color: COLORS.white, fontSize: 18, fontWeight: '900', marginBottom: 14 },
  flowRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  flowIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  flowIndexText: { color: COLORS.white, fontSize: 13, fontWeight: '900' },
  flowText: { flex: 1, color: 'rgba(255,255,255,0.88)', fontSize: 12, lineHeight: 19 },
  noteCard: {
    backgroundColor: '#FFF8E8',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F6DE9F',
    marginTop: 16,
  },
  noteTitle: { color: '#8A5B00', fontSize: 14, fontWeight: '900' },
  noteText: { color: '#7A6233', fontSize: 12, lineHeight: 18, marginTop: 6 },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
    paddingBottom: 14,
    paddingHorizontal: 8,
  },
  bottomItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  bottomLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '700' },
  bottomActive: { color: COLORS.primaryLight },
});
