// ============================================================
// SCREENING SCREEN — Input 27 Atribut Klinis
// ============================================================
import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  COLORS,
  CATEGORY_LABELS,
  getCategoryOrderByDataset,
  getDefaultValues,
  getFeaturesByDataset,
} from '../utils/constants';
import { predictAsthma } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function ScreeningScreen({ route, navigation }) {
  // Route menentukan dataset/model mana yang sedang dipakai pada form skrining.
  const { user, token } = useAuth();
  const datasetMode = route.params?.datasetMode || 'local';
  const screenTitle = route.params?.screenTitle || 'Skrining Asthma';
  const screenSub = route.params?.screenSub || 'Form skrining model terbaik';
  const formFeatures = getFeaturesByDataset(datasetMode);
  const defaultValues = getDefaultValues(datasetMode);
  const categories = getCategoryOrderByDataset(datasetMode);
  const defaultExpandedCategories = useMemo(() => {
    const expanded = {};
    categories.forEach(category => {
      expanded[category] = !['gejala', 'riwayat', 'gaya_hidup'].includes(category);
    });
    return expanded;
  }, [categories]);
  const [values, setValues]       = useState({ ...defaultValues });
  const [patientName, setPatientName] = useState('');
  const [loading, setLoading]     = useState(false);
  const [errors, setErrors]       = useState({});
  const [expandedCategories, setExpandedCategories] = useState(defaultExpandedCategories);

  const setValue = (key, val) => {
    // Saat field berubah, error untuk field tersebut langsung dibersihkan.
    setValues(prev => ({ ...prev, [key]: val }));
    setErrors(prev => ({ ...prev, [key]: null }));
  };

  // Validasi semua field wajib
  const validate = () => {
    const newErrors = {};
    formFeatures.forEach(f => {
      const val = values[f.key];
      if (f.type === 'number') {
        if (val === '' || val === null || val === undefined) {
          newErrors[f.key] = 'Wajib diisi';
        } else {
          const num = parseFloat(val);
          if (isNaN(num)) {
            newErrors[f.key] = 'Harus berupa angka';
          } else if (num < f.min || num > f.max) {
            newErrors[f.key] = `Rentang: ${f.min}–${f.max}`;
          }
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePredict = async () => {
    // Nama pasien wajib ada karena dipakai juga saat menyimpan riwayat.
    if (!patientName.trim()) {
      Alert.alert('Nama pasien belum diisi', 'Masukkan nama pasien terlebih dahulu.');
      return;
    }

    if (!validate()) {
      Alert.alert('Data Tidak Lengkap', 'Harap lengkapi semua field yang ditandai merah.');
      return;
    }

    setLoading(true);
    const features = {};
    // Normalisasi tipe data dilakukan sesuai definisi fitur yang dipilih.
    formFeatures.forEach(f => {
      features[f.key] = f.type === 'number'
        ? parseFloat(values[f.key])
        : parseInt(values[f.key]);
    });

    const result = await predictAsthma(token, features, datasetMode, {
      user_id: user?.id,
      patient_name: patientName.trim(),
    });
    setLoading(false);

    if (result.success) {
      navigation.navigate('Result', {
        result: result.data,
        inputData: features,
        datasetMode,
        patientName: patientName.trim(),
      });
    } else {
      Alert.alert('Gagal Prediksi', result.error);
    }
  };

  const handleReset = () => {
    // Reset mengembalikan form ke nilai default dataset aktif.
    Alert.alert('Reset Form', 'Semua data akan dihapus?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          setValues({ ...defaultValues });
          setErrors({});
          setPatientName('');
          setExpandedCategories(defaultExpandedCategories);
        },
      },
    ]);
  };
  const toggleCategory = categoryKey => {
    setExpandedCategories(prev => ({ ...prev, [categoryKey]: !prev[categoryKey] }));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* Header */}
      <LinearGradient colors={['#EAF7FF', '#F4FBFF']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{screenTitle}</Text>
          <Text style={styles.headerSub}>{screenSub}</Text>
        </View>
        <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}>

        <View style={styles.patientCard}>
          <Text style={styles.fieldLabel}>Nama Pasien</Text>
          <Text style={styles.fieldDesc}>Nama ini akan disimpan bersama hasil skrining dan tampil di riwayat.</Text>
          <TextInput
            style={styles.input}
            value={patientName}
            onChangeText={setPatientName}
            placeholder="Contoh: Budi Santoso"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        {categories.map(cat => {
          const catFeatures = formFeatures.filter(f => f.category === cat);
          const catInfo     = CATEGORY_LABELS[cat];
          return (
            <View key={cat} style={styles.categorySection}>
              <TouchableOpacity
                style={styles.categoryHeader}
                activeOpacity={0.85}
                onPress={() => toggleCategory(cat)}
              >
                <Text style={styles.categoryIcon}>{catInfo.icon}</Text>
                <Text style={styles.categoryLabel}>{catInfo.label}</Text>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{catFeatures.length} data</Text>
                </View>
                <Text style={styles.categoryChevron}>
                  {expandedCategories[cat] ? '▾' : '▸'}
                </Text>
              </TouchableOpacity>

              {expandedCategories[cat] ? (
                catFeatures.map(feature => (
                  // Setiap field dibangun dari metadata sehingga form mudah dikembangkan.
                  <FeatureInput
                    key={feature.key}
                    feature={feature}
                    value={values[feature.key]}
                    onChange={val => setValue(feature.key, val)}
                    error={errors[feature.key]}
                  />
                ))
              ) : null}
            </View>
          );
        })}
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.predictBtn}
          onPress={handlePredict}
          disabled={loading}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={loading ? ['#C7DCE8', '#A7C5D6'] : ['#5BBCEB', '#2D9CDB']}
            style={styles.predictGradient}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.predictText}>🔍  Analisis Sekarang</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Feature Input Component ──────────────────────────────
function FeatureInput({ feature, value, onChange, error }) {
  if (feature.type === 'select' || (feature.type === 'binary' && feature.key === 'jenis kelamin')) {
    return (
      <View style={styles.fieldBox}>
        <Text style={styles.fieldLabel}>{feature.label}</Text>
        <Text style={styles.fieldDesc}>{feature.description}</Text>
        <View style={styles.optionsRow}>
          {feature.options.map(opt => {
            const isActive = String(value) === String(opt.value);
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.optionBtn, isActive && styles.optionActive]}
                onPress={() => onChange(opt.value)}
              >
                <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  // Binary memakai centang tunggal agar pengisian terasa lebih ringkas.
  if (feature.type === 'binary') {
    const isChecked = String(value) === '1';
    return (
      <TouchableOpacity
        style={[styles.checkboxField, isChecked && styles.checkboxFieldActive]}
        activeOpacity={0.85}
        onPress={() => onChange(isChecked ? 0 : 1)}
      >
        <View style={[styles.checkboxBox, isChecked && styles.checkboxBoxActive]}>
          <Text style={styles.checkboxIcon}>{isChecked ? '✓' : ''}</Text>
        </View>
        <View style={styles.checkboxContent}>
          <Text style={styles.fieldLabel}>{feature.label}</Text>
          <Text style={styles.fieldDescInline}>
            {feature.description} Centang jika pasien mengalami / memiliki riwayat ini.
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Number input dipakai untuk atribut yang membutuhkan nilai numerik.
  return (
    <View style={styles.fieldBox}>
      <View style={styles.fieldLabelRow}>
        <Text style={styles.fieldLabel}>{feature.label}</Text>
        {feature.unit ? <Text style={styles.fieldUnit}>{feature.unit}</Text> : null}
      </View>
      <Text style={styles.fieldDesc}>{feature.description} (min: {feature.min}, max: {feature.max})</Text>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        value={String(value)}
        onChangeText={onChange}
        placeholder={feature.placeholder}
        placeholderTextColor={COLORS.textMuted}
        keyboardType="decimal-pad"
      />
      {error && <Text style={styles.errorText}>⚠ {error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 52, paddingBottom: 14, paddingHorizontal: 16,
    gap: 10,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.bgInput,
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { color: COLORS.textPrimary, fontSize: 20 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  headerSub: { fontSize: 12, color: COLORS.textSecondary },
  resetBtn: {
    marginLeft: 'auto',
    backgroundColor: COLORS.bgInput,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 10, borderWidth: 1, borderColor: COLORS.border,
  },
  resetText: { color: COLORS.asma, fontSize: 13, fontWeight: '600' },

  // Scroll
  scroll: { flex: 1, paddingHorizontal: 14 },

  // Category
  categorySection: { marginTop: 12 },
  patientCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryHeader: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 8, gap: 8,
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  categoryIcon: { fontSize: 20 },
  categoryLabel: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, flex: 1 },
  categoryBadge: {
    backgroundColor: COLORS.bgInput,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, borderWidth: 1, borderColor: COLORS.border,
  },
  categoryBadgeText: { fontSize: 11, color: COLORS.textSecondary },
  categoryChevron: {
    fontSize: 20,
    lineHeight: 20,
    color: COLORS.primaryDark,
    fontWeight: '700',
    marginLeft: 4,
  },

  // Field
  fieldBox: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 12, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  fieldUnit: {
    fontSize: 11, color: COLORS.primary,
    backgroundColor: COLORS.bgInput,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  fieldDesc: { fontSize: 11, color: COLORS.textMuted, marginTop: 2, marginBottom: 8 },
  fieldDescInline: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

  checkboxField: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  checkboxFieldActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.bgCardLight,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxBoxActive: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primaryDark,
  },
  checkboxIcon: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  checkboxContent: {
    flex: 1,
  },

  // Options (binary / select)
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  optionBtn: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
    backgroundColor: COLORS.bgInput,
    borderWidth: 1, borderColor: COLORS.border,
  },
  optionActive: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primary,
  },
  optionText: { fontSize: 13, color: COLORS.textSecondary },
  optionTextActive: { color: COLORS.white, fontWeight: '600' },

  // Number input
  input: {
    backgroundColor: COLORS.bgInput,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 15, color: COLORS.textPrimary,
    borderWidth: 1, borderColor: COLORS.border,
  },
  inputError: { borderColor: COLORS.asma },
  errorText: { fontSize: 11, color: COLORS.asma, marginTop: 4 },

  // Bottom
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 16, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  predictBtn: { borderRadius: 14, overflow: 'hidden' },
  predictGradient: {
    paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
  },
  predictText: { fontSize: 17, fontWeight: '800', color: COLORS.white },
});
