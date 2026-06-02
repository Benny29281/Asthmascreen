// ============================================================
// RESULT SCREEN - Hasil Prediksi & Analisis
// ============================================================
import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Animated, Alert, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, getFeaturesByDataset } from '../utils/constants';
import { getScreeningPdfUrl } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function ResultScreen({ route, navigation }) {
  // Parameter route membawa hasil prediksi dan data input dari screen skrining/riwayat.
  const { token } = useAuth();
  const { result, inputData, datasetMode, patientName } = route.params;
  const probabilityAsma = Number(result.probability_asma || 0);
  const probabilitySehat = Number(result.probability_sehat || 0);
  const isAsma = probabilityAsma > probabilitySehat;
  const resultLabel = isAsma ? 'ASMA' : 'TIDAK ASMA';
  const resultDataset = datasetMode || result.dataset_used || 'local';
  const inputFeatures = getFeaturesByDataset(resultDataset);
  const summaryRows = [
    { key: 'patient_name', label: 'Nama Pasien', value: patientName || result.patient_name || '-' },
    ...inputFeatures.map((feature) => ({ ...feature, value: inputData[feature.key] })),
  ];

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    // Animasi sederhana dipakai untuk membuat kartu hasil muncul lebih halus.
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const statusColor = isAsma ? COLORS.asma : COLORS.sehat;

  const handleDownloadPdf = async () => {
    // PDF hanya bisa diunduh bila hasil ini sudah punya ID riwayat di database.
    if (!result.screening_id) {
      Alert.alert('PDF belum tersedia', result.save_warning || 'Hasil ini belum tersimpan ke database.');
      return;
    }

    const url = getScreeningPdfUrl(result.screening_id, token);
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert('Gagal membuka PDF', 'Perangkat tidak dapat membuka tautan unduhan PDF.');
      return;
    }
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <LinearGradient colors={['#EAF7FF', '#F4FBFF']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hasil Analisis</Text>
        <View style={styles.modelChip}>
          <Text style={styles.modelChipText}>🤖 {result.model_used}</Text>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 178 }}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <LinearGradient
            colors={isAsma ? ['#FFEAEA', '#FFFFFF'] : ['#E8FFF3', '#FFFFFF']}
            style={[styles.resultCard, { borderColor: statusColor }]}
          >
            <Text style={styles.resultEmoji}>{isAsma ? '⚠️' : '✅'}</Text>
            <Text style={[styles.resultLabel, { color: statusColor }]}>
              {resultLabel}
            </Text>
            <Text style={styles.resultDesc}>
              {isAsma
                ? 'Terdeteksi indikasi penyakit asma berdasarkan data klinis yang dimasukkan.'
                : 'Tidak terdeteksi indikasi asma berdasarkan data klinis saat ini.'}
            </Text>
          </LinearGradient>
        </Animated.View>





        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Faktor Risiko Terdeteksi
            <Text style={styles.riskCount}> ({result.risk_factors?.length || 0})</Text>
          </Text>
          {result.risk_factors?.length > 0 ? (
            result.risk_factors.map((risk, i) => (
              <View key={i} style={styles.riskItem}>
                <Text style={styles.riskIcon}>⚠</Text>
                <Text style={styles.riskText}>{risk}</Text>
              </View>
            ))
          ) : (
            <View style={styles.noRiskCard}>
              <Text style={styles.noRiskText}>✅ Tidak ada faktor risiko dominan yang terdeteksi.</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ringkasan Data Input</Text>
          <View style={styles.dataTable}>
            {/* Data input ditampilkan ulang agar pengguna bisa meninjau konteks hasil. */}
            {summaryRows.map((f, i) => {
              const val = f.value;
              let displayVal = String(val ?? '-');
              if (f.type === 'binary' || f.type === 'select') {
                const opt = f.options?.find((o) => String(o.value) === String(val));
                displayVal = opt ? opt.label : displayVal;
              } else if (f.unit) {
                displayVal = `${val} ${f.unit}`;
              }
              return (
                <View key={f.key} style={[styles.dataRow, i % 2 === 0 && styles.dataRowEven]}>
                  <Text style={styles.dataKey}>{f.label}</Text>
                  <Text style={styles.dataVal}>{displayVal}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            {isAsma
              ? 'Pasien disarankan memeriksa diri ke layanan kesehatan terdekat.'
              : '⚕️  Hasil prediksi ini merupakan alat bantu skrining berbasis data dan TIDAK menggantikan diagnosis medis. Konsultasikan hasil ini kepada dokter atau tenaga kesehatan yang berkualifikasi.'}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['#5BBCEB', '#2D9CDB']} style={styles.newBtnGradient}>
            <Text style={styles.newBtnText}>+ Pilih Skrining Baru</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.homeBtnText}>🏠 Beranda</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.homeBtn} onPress={handleDownloadPdf}>
          <Text style={styles.homeBtnText}>Unduh Hasil PDF</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}



const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16, gap: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.bgInput, alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { color: COLORS.textPrimary, fontSize: 20 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, flex: 1 },
  modelChip: {
    backgroundColor: COLORS.bgInput, paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 10, borderWidth: 1, borderColor: COLORS.border,
  },
  modelChipText: { fontSize: 11, color: COLORS.textSecondary },

  resultCard: {
    margin: 16, borderRadius: 20, padding: 24,
    alignItems: 'center', borderWidth: 2,
  },
  resultEmoji: { fontSize: 52, marginBottom: 12 },
  resultLabel: { fontSize: 28, fontWeight: '900', letterSpacing: 1 },
  resultDesc: {
    fontSize: 14, color: COLORS.textSecondary,
    textAlign: 'center', marginTop: 10, lineHeight: 20,
  },



  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  riskCount: { fontSize: 13, color: COLORS.textMuted },



  riskItem: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: COLORS.asmaLight, borderRadius: 10, padding: 12,
    marginBottom: 8, borderWidth: 1, borderColor: '#F6C9C4', gap: 10,
  },
  riskIcon: { fontSize: 14, color: COLORS.asma, marginTop: 1 },
  riskText: { fontSize: 13, color: COLORS.textPrimary, flex: 1, lineHeight: 18 },
  noRiskCard: {
    backgroundColor: COLORS.sehatLight, borderRadius: 10, padding: 16,
    borderWidth: 1, borderColor: '#BFEFD4',
  },
  noRiskText: { color: COLORS.sehat, fontSize: 14 },

  dataTable: {
    backgroundColor: COLORS.bgCard, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  dataRow: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10 },
  dataRowEven: { backgroundColor: COLORS.bgCardLight },
  dataKey: { flex: 1, fontSize: 12, color: COLORS.textSecondary },
  dataVal: { fontSize: 12, color: COLORS.textPrimary, fontWeight: '600', textAlign: 'right' },

  disclaimer: {
    margin: 16, backgroundColor: COLORS.bgCard,
    borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  disclaimerText: { fontSize: 11, color: COLORS.textMuted, lineHeight: 17, textAlign: 'center' },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.bg, paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: COLORS.border, gap: 8,
  },
  newBtn: { borderRadius: 14, overflow: 'hidden' },
  newBtnGradient: { paddingVertical: 14, alignItems: 'center' },
  newBtnText: { fontSize: 16, fontWeight: '800', color: COLORS.white },
  homeBtn: {
    backgroundColor: COLORS.bgCard, borderRadius: 14, paddingVertical: 12,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  homeBtnText: { fontSize: 14, color: COLORS.textSecondary },
});
