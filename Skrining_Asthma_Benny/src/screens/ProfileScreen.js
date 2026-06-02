import React from 'react';
import { ActivityIndicator, Alert, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { COLORS } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import { getScreeningStats } from '../utils/api';

export default function ProfileScreen({ navigation }) {
  // Data user dan token berasal dari AuthContext agar layar profil tetap sinkron.
  const { user, token, logout } = useAuth();
  const [stats, setStats] = React.useState(null);
  const [loadingStats, setLoadingStats] = React.useState(true);

  const loadStats = React.useCallback(async () => {
    // Statistik diringkas dari backend supaya screen tidak menghitung ulang sendiri.
    setLoadingStats(true);
    const result = await getScreeningStats(token);
    setLoadingStats(false);
    if (result.success) {
      setStats(result.data);
    }
  }, [token]);

  useFocusEffect(React.useCallback(() => {
    loadStats();
  }, [loadStats]));

  const handleLogout = () => {
    // Logout dikonfirmasi dulu untuk mencegah keluar akun tanpa sengaja.
    Alert.alert('Logout', 'Keluar dari akun dan kembali ke halaman login?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <LinearGradient colors={['#EAF7FF', '#F4FBFF']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Profil</Text>
          <Text style={styles.headerSub}>Informasi akun yang sedang login</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.full_name || 'User')
                .split(' ')
                .slice(0, 2)
                .map((part) => part[0])
                .join('')
                .toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{user?.full_name || 'Pengguna AsthmaScreen'}</Text>
          <Text style={styles.nim}>{user?.email || 'Email belum tersedia'}</Text>

          <View style={styles.divider} />

          <InfoRow label="ID User" value={String(user?.id || '-')} />
          <InfoRow label="Status" value="Aktif / Login" />
          <InfoRow label="Role" value="Pengguna aplikasi" />

          <View style={styles.statsPanel}>
            <Text style={styles.statsTitle}>Statistik Skrining</Text>
            {loadingStats ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <>
                <View style={styles.statsGrid}>
                  <StatBox label="Total" value={stats?.total || 0} color={COLORS.primary} />
                  <StatBox label="Asma" value={stats?.asma_count || 0} color={COLORS.asma} />
                  <StatBox label="Non Asma" value={stats?.non_asma_count || 0} color={COLORS.sehat} />
                </View>
                <ResultBars
                  asma={stats?.asma_count || 0}
                  nonAsma={stats?.non_asma_count || 0}
                />
                <DailyChart data={stats?.daily || []} />
              </>
            )}
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={18} color={COLORS.white} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <NavItem
          label="Skrining"
          icon="clipboard-pulse-outline"
          onPress={() => navigation.navigate('Home')}
        />
        <NavItem label="Riwayat" icon="history" onPress={() => navigation.navigate('History')} />
        <NavItem
          label="About"
          icon="information-outline"
          onPress={() => navigation.navigate('About')}
        />
        <NavItem label="Profil" icon="account-circle-outline" active />
      </View>
    </View>
  );
}

function InfoRow({ label, value }) {
  return (
    // Menampilkan pasangan label-nilai informasi akun secara konsisten.
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function StatBox({ label, value, color }) {
  return (
    // Kartu statistik dipakai untuk total, asma, dan non asma.
    <View style={[styles.statBox, { borderColor: color }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ResultBars({ asma, nonAsma }) {
  // Minimal total 1 dipakai agar lebar bar tidak menghasilkan pembagian dengan nol.
  const total = Math.max(asma + nonAsma, 1);
  return (
    <View style={styles.resultBars}>
      <View style={styles.barRow}>
        <Text style={styles.barLabel}>Asma</Text>
        <View style={styles.barTrack}>
          <View style={[styles.asmaFill, { width: `${(asma / total) * 100}%` }]} />
        </View>
      </View>
      <View style={styles.barRow}>
        <Text style={styles.barLabel}>Non Asma</Text>
        <View style={styles.barTrack}>
          <View style={[styles.sehatFill, { width: `${(nonAsma / total) * 100}%` }]} />
        </View>
      </View>
    </View>
  );
}

function DailyChart({ data }) {
  // Grafik batang mini dibangun dari total skrining per hari selama 7 hari terakhir.
  const maxTotal = Math.max(...data.map((item) => item.total), 1);
  return (
    <View style={styles.dailyChart}>
      {data.length === 0 ? (
        <Text style={styles.emptyStats}>Belum ada data grafik.</Text>
      ) : data.map((item) => (
        <View key={item.day} style={styles.chartItem}>
          <View style={styles.chartTrack}>
            <View style={[styles.chartBar, { height: `${Math.max((item.total / maxTotal) * 100, 8)}%` }]} />
          </View>
          <Text style={styles.chartLabel}>
            {new Date(item.day).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
          </Text>
        </View>
      ))}
    </View>
  );
}

function NavItem({ label, icon, active, onPress }) {
  return (
    // Bottom nav sengaja dipisah sebagai helper agar lebih mudah dipakai ulang.
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
  headerTitle: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '900' },
  headerSub: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  content: { padding: 16, paddingBottom: 112, flexGrow: 1, justifyContent: 'center' },
  profileCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: COLORS.bgInput,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: { color: COLORS.primaryLight, fontSize: 27, fontWeight: '900' },
  name: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '900', textAlign: 'center' },
  nim: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4 },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    alignSelf: 'stretch',
    marginVertical: 20,
  },
  infoRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  infoLabel: { color: COLORS.textMuted, fontSize: 12, flex: 1 },
  infoValue: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    flex: 1.4,
    textAlign: 'right',
  },
  statsPanel: {
    alignSelf: 'stretch',
    backgroundColor: COLORS.bgCardLight,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 8,
  },
  statsTitle: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '900', marginBottom: 12 },
  statsGrid: { flexDirection: 'row', gap: 8 },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  statValue: { fontSize: 20, fontWeight: '900' },
  statLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '700', marginTop: 3 },
  resultBars: { gap: 9, marginTop: 14 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel: { width: 68, color: COLORS.textSecondary, fontSize: 11, fontWeight: '800' },
  barTrack: {
    flex: 1,
    height: 10,
    backgroundColor: COLORS.bgInput,
    borderRadius: 999,
    overflow: 'hidden',
  },
  asmaFill: { height: '100%', backgroundColor: COLORS.asma, borderRadius: 999 },
  sehatFill: { height: '100%', backgroundColor: COLORS.sehat, borderRadius: 999 },
  dailyChart: {
    height: 112,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 16,
  },
  chartItem: { flex: 1, alignItems: 'center', gap: 6 },
  chartTrack: {
    height: 78,
    width: '100%',
    maxWidth: 22,
    backgroundColor: COLORS.bgInput,
    borderRadius: 999,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  chartBar: { width: '100%', backgroundColor: COLORS.primary, borderRadius: 999 },
  chartLabel: { color: COLORS.textMuted, fontSize: 9, fontWeight: '700' },
  emptyStats: { color: COLORS.textMuted, fontSize: 12, textAlign: 'center', flex: 1 },
  logoutButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.asma,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },
  logoutText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
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
