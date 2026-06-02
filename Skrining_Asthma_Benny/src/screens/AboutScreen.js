// ============================================================
// ABOUT SCREEN - AsthmaScreen
// ============================================================
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { COLORS } from '../utils/constants';

const PURPOSE_ITEMS = [
  {
    icon: 'target',
    title: 'Tujuan utama',
    desc: 'Membantu pengguna melakukan skrining awal untuk melihat kemungkinan risiko asma berdasarkan data pasien dan gejala yang diisi.',
  },
  {
    icon: 'account-group-outline',
    title: 'Untuk pengguna awam',
    desc: 'Informasi ditulis dengan bahasa yang lebih sederhana agar orang awam tetap bisa menggunakan aplikasi tanpa harus memahami istilah medis secara mendalam.',
  },
  {
    icon: 'clipboard-text-clock-outline',
    title: 'Pendukung keputusan awal',
    desc: 'Hasil aplikasi ditujukan sebagai alat bantu pembacaan awal sebelum pengguna melanjutkan pemeriksaan ke tenaga kesehatan.',
  },
];

const TECHNOLOGY_ITEMS = [
  {
    icon: 'cellphone',
    title: 'Frontend mobile',
    desc: 'Aplikasi dibangun dengan React Native dan Expo agar antarmuka bisa berjalan secara fleksibel pada perangkat mobile dengan pengalaman yang ringan.',
  },
  {
    icon: 'api',
    title: 'Backend dan API',
    desc: 'Backend menerima data skrining, memproses permintaan analisis, lalu mengembalikan hasil prediksi ke aplikasi secara terstruktur.',
  },
  {
    icon: 'brain',
    title: 'Model machine learning',
    desc: 'Model klasifikasi digunakan untuk membaca pola data pasien dan memberikan gambaran risiko asma berdasarkan fitur yang tersedia.',
  },
  {
    icon: 'database-outline',
    title: 'Penyimpanan data',
    desc: 'Riwayat hasil skrining disimpan agar pengguna dapat melihat kembali hasil pemeriksaan pasien yang pernah dilakukan.',
  },
];

const WORKFLOW_ITEMS = [
  'Pengguna membuka menu skrining dan mengisi data pasien seperti usia, jenis kelamin, gejala, riwayat penyakit, serta faktor pemicu.',
  'Setelah form lengkap, data dikirim ke server untuk diproses oleh model prediksi.',
  'Model melakukan analisis terhadap kombinasi gejala dan data pasien yang telah diinput.',
  'Aplikasi menampilkan hasil skrining berupa tingkat risiko atau indikasi gejala asma yang perlu diperhatikan.',
  'Hasil dapat disimpan dalam riwayat agar mudah ditinjau kembali sebagai bahan evaluasi awal.',
];

export default function AboutScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <LinearGradient colors={['#EAF7FF', '#F4FBFF']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>About</Text>
          <Text style={styles.headerSub}>Mengenal aplikasi AsthmaScreen</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#D9F3FF', '#FFFFFF']} style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="information-outline" size={30} color={COLORS.primaryDark} />
          </View>
          <Text style={styles.appName}>AsthmaScreen</Text>
          <Text style={styles.appDesc}>
            AsthmaScreen adalah aplikasi skrining awal yang dibuat untuk membantu orang awam melihat risiko asma atau mengenali gejala yang mengarah ke gangguan pernapasan asma secara lebih mudah.
          </Text>
        </LinearGradient>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Tentang aplikasi</Text>
          <Text style={styles.paragraph}>
            Aplikasi ini dirancang agar pengguna tidak merasa rumit saat membaca kondisi pasien. Dengan tampilan yang sederhana dan alur pengisian yang terarah, pengguna dapat memasukkan data pasien lalu memperoleh gambaran awal mengenai risiko asma atau gejala yang perlu diwaspadai.
          </Text>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Tujuan aplikasi</Text>
          {/* Daftar tujuan dirender dari data statis agar isi lebih mudah dikelola. */}
          {PURPOSE_ITEMS.map((item) => (
            <View key={item.title} style={styles.infoCard}>
              <View style={styles.infoIcon}>
                <MaterialCommunityIcons name={item.icon} size={24} color={COLORS.primaryDark} />
              </View>
              <View style={styles.infoCopy}>
                <Text style={styles.infoTitle}>{item.title}</Text>
                <Text style={styles.infoDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Perancangan aplikasi</Text>
          <Text style={styles.paragraph}>
            Perancangan AsthmaScreen berfokus pada kemudahan penggunaan, terutama untuk pengguna non-medis. Struktur layar dibuat bertahap mulai dari dashboard, form input pasien, hasil analisis, hingga riwayat skrining. Dengan pendekatan ini, pengguna dapat memahami proses aplikasi tanpa harus berpindah dalam alur yang membingungkan.
          </Text>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Teknologi yang digunakan</Text>
          {/* Bagian teknologi memakai pola yang sama agar tampilan kartu konsisten. */}
          {TECHNOLOGY_ITEMS.map((item) => (
            <View key={item.title} style={styles.techCard}>
              <MaterialCommunityIcons name={item.icon} size={22} color={COLORS.white} />
              <View style={styles.techCopy}>
                <Text style={styles.techTitle}>{item.title}</Text>
                <Text style={styles.techDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.workflowCard}>
          <Text style={styles.workflowTitle}>Cara kerja aplikasi</Text>
          {/* Alur kerja dibuat bernomor untuk memudahkan pembacaan pengguna. */}
          {WORKFLOW_ITEMS.map((item, index) => (
            <View key={item} style={styles.workflowRow}>
              <View style={styles.workflowNumber}>
                <Text style={styles.workflowNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.workflowText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Catatan</Text>
          <Text style={styles.noteText}>
            Hasil dari AsthmaScreen bukan diagnosis akhir. Aplikasi ini ditujukan sebagai alat bantu awal sehingga keputusan medis tetap perlu dikonfirmasi oleh dokter atau tenaga kesehatan.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <NavItem
          label="Skrining"
          icon="clipboard-pulse-outline"
          onPress={() => navigation.navigate('Home')}
        />
        <NavItem label="Riwayat" icon="history" onPress={() => navigation.navigate('History')} />
        <NavItem label="About" icon="information-outline" active />
        <NavItem
          label="Profil"
          icon="account-circle-outline"
          onPress={() => navigation.navigate('Profile')}
        />
      </View>
    </View>
  );
}

function NavItem({ label, icon, active, onPress }) {
  return (
    // Item navigasi bawah dipisah agar reusable pada beberapa screen.
    <TouchableOpacity style={styles.bottomItem} onPress={onPress} disabled={active}>
      <MaterialCommunityIcons
        name={icon}
        size={23}
        color={active ? COLORS.primaryLight : COLORS.textMuted}
      />
      <Text style={[styles.bottomLabel, active && styles.bottomActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 54,
    paddingBottom: 18,
    paddingHorizontal: 16,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '900' },
  headerSub: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  content: { padding: 16, paddingBottom: 112 },
  heroCard: {
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 18,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: COLORS.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: { color: COLORS.textPrimary, fontSize: 28, fontWeight: '900' },
  appDesc: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 21, marginTop: 10 },
  sectionBlock: { marginBottom: 18 },
  sectionTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '900', marginBottom: 10 },
  paragraph: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 21,
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
    gap: 12,
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCopy: { flex: 1 },
  infoTitle: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '900' },
  infoDesc: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 4 },
  techCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: COLORS.primaryDark,
    borderRadius: 18,
    padding: 15,
    marginBottom: 10,
  },
  techCopy: { flex: 1 },
  techTitle: { color: COLORS.white, fontSize: 15, fontWeight: '900' },
  techDesc: { color: 'rgba(255,255,255,0.86)', fontSize: 12, lineHeight: 18, marginTop: 4 },
  workflowCard: {
    backgroundColor: '#12324A',
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
  },
  workflowTitle: { color: COLORS.white, fontSize: 18, fontWeight: '900', marginBottom: 14 },
  workflowRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  workflowNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  workflowNumberText: { color: COLORS.white, fontSize: 13, fontWeight: '900' },
  workflowText: { flex: 1, color: 'rgba(255,255,255,0.88)', fontSize: 12, lineHeight: 19 },
  noteCard: {
    backgroundColor: '#FFF8E8',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F6DE9F',
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
