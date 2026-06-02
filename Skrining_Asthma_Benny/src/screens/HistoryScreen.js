// ============================================================
// HISTORY SCREEN - AsthmaScreen
// ============================================================
import React from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { COLORS } from '../utils/constants';
import { getScreeningDetail, getScreeningHistory, getScreeningPdfUrl } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function HistoryScreen({ navigation }) {
  // Token dipakai untuk memuat riwayat privat milik user yang sedang login.
  const { token } = useAuth();
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [openingId, setOpeningId] = React.useState(null);

  const loadHistory = React.useCallback(async () => {
    // Muat ulang data tiap kali screen kembali fokus agar riwayat selalu terbaru.
    setLoading(true);
    const result = await getScreeningHistory(token);
    setLoading(false);
    if (result.success) {
      setItems(result.data.items || []);
    } else {
      Alert.alert('Riwayat gagal dimuat', result.error);
    }
  }, [token]);

  useFocusEffect(React.useCallback(() => {
    loadHistory();
  }, [loadHistory]));

  const handleDownload = (screeningId) => {
    // PDF dibuka via browser/device handler menggunakan URL yang mengandung token.
    Linking.openURL(getScreeningPdfUrl(screeningId, token));
  };

  const handleOpenDetail = async (screeningId) => {
    // Detail riwayat dipakai ulang untuk membuka screen hasil yang sama.
    setOpeningId(screeningId);
    const result = await getScreeningDetail(token, screeningId);
    setOpeningId(null);

    if (!result.success) {
      Alert.alert('Detail gagal dimuat', result.error);
      return;
    }

    const item = result.data.item;
    navigation.navigate('Result', {
      result: result.data.result,
      inputData: result.data.input_features || {},
      datasetMode: item.dataset_mode,
      patientName: item.patient_name,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <LinearGradient colors={['#EAF7FF', '#F4FBFF']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>{'<'}</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Riwayat</Text>
          <Text style={styles.headerSub}>Hasil skrining pasien</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.emptyCard}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.emptyText}>Memuat riwayat skrining...</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>R</Text>
            <Text style={styles.emptyTitle}>Belum Ada Riwayat</Text>
            <Text style={styles.emptyText}>
              Hasil skrining pasien akan tampil di sini setelah form berhasil dianalisis.
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.navigate('Screening')}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>Mulai Skrining</Text>
            </TouchableOpacity>
          </View>
        ) : (
          items.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.historyCard}
              activeOpacity={0.85}
              onPress={() => handleOpenDetail(item.id)}
              disabled={openingId === item.id}
            >
              <View style={styles.historyTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.patientName}>{item.patient_name}</Text>
                  <Text style={styles.historyDate}>{new Date(item.created_at).toLocaleString('id-ID')}</Text>
                </View>
                <Text style={[styles.resultBadge, item.prediction === 1 ? styles.asmaBadge : styles.sehatBadge]}>
                  {item.label}
                </Text>
              </View>
              <Text style={styles.modelText}>{item.model_used}</Text>
              <View style={styles.actionRow}>
                <Text style={styles.detailHint}>
                  {openingId === item.id ? 'Membuka detail...' : 'Ketuk kartu untuk melihat hasil'}
                </Text>
                <View style={styles.pdfActions}>
                  <TouchableOpacity style={styles.downloadBtn} onPress={() => handleDownload(item.id)}>
                    <Text style={styles.downloadText}>Unduh</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {openingId === item.id && (
                <ActivityIndicator style={styles.cardLoader} color={COLORS.primary} size="small" />
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <NavItem
          label="Skrining"
          icon="clipboard-pulse-outline"
          onPress={() => navigation.navigate('Home')}
        />
        <NavItem label="Riwayat" icon="history" active />
        <NavItem
          label="About"
          icon="information-outline"
          onPress={() => navigation.navigate('About')}
        />
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
    // Helper ini menjaga struktur bottom navigation tetap singkat.
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
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backText: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '900' },
  headerTitle: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '900' },
  headerSub: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  content: { padding: 16, paddingBottom: 112, flexGrow: 1 },
  emptyCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyIcon: { color: COLORS.sehat, fontSize: 34, fontWeight: '900', marginBottom: 10 },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 19, fontWeight: '900' },
  emptyText: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 10 },
  primaryBtn: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginTop: 18,
  },
  primaryBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '800' },
  historyCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  historyTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  patientName: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '900' },
  historyDate: { color: COLORS.textMuted, fontSize: 11, marginTop: 4 },
  resultBadge: {
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 11,
    fontWeight: '900',
  },
  asmaBadge: { color: COLORS.asma, backgroundColor: COLORS.asmaLight },
  sehatBadge: { color: COLORS.sehat, backgroundColor: COLORS.sehatLight },
  modelText: { color: COLORS.textMuted, fontSize: 11, marginTop: 14 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 12,
  },
  detailHint: { color: COLORS.primaryDark, fontSize: 11, fontWeight: '800', flex: 1 },
  pdfActions: { flexDirection: 'row', gap: 8 },
  downloadBtn: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.bgInput,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  downloadText: { color: COLORS.primaryDark, fontSize: 12, fontWeight: '800' },
  cardLoader: { marginTop: 10, alignSelf: 'flex-start' },
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
