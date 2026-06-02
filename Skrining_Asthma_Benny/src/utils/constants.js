// ============================================================
// KONSTANTA APLIKASI AsthmaScreen
// Benny Dwiyanto - 535220012
// ============================================================

// Ganti BASE_URL dengan IP perangkat yang menjalankan Flask.
export const API_BASE_URL = 'http://192.168.1.5:5000';
// export const API_BASE_URL = 'http://172.16.59.224:5000';
// export const API_BASE_URL = 'http://172.18.215.222:5000';
// export const API_BASE_URL = 'http://:192.168.110.57:5000';

export const COLORS = {
  bg: '#F4FBFF',
  bgCard: '#FFFFFF',
  bgCardLight: '#EAF7FF',
  bgInput: '#E7F5FF',

  primary: '#2D9CDB',
  primaryLight: '#5BBCEB',
  primaryDark: '#1686C7',

  asma: '#E74C3C',
  asmaLight: '#FFEAEA',
  sehat: '#27AE60',
  sehatLight: '#E8FFF3',
  warning: '#F39C12',

  textPrimary: '#12324A',
  textSecondary: '#456A84',
  textMuted: '#7CA1B8',

  border: '#CBE8F8',
  white: '#FFFFFF',
  overlay: 'rgba(244,251,255,0.95)',
};

// Opsi umum ini dipakai ulang di beberapa fitur biner agar definisi tidak berulang.
const YES_NO = [
  { label: 'Tidak', value: 0 },
  { label: 'Ya', value: 1 },
];

const GENDER_OPTIONS = [
  { label: 'Laki-laki', value: 0 },
  { label: 'Perempuan', value: 1 },
];

// Fitur lokal sesuai backend/models/evaluation_metadata.json.
export const FEATURES = [
  {
    key: 'umur',
    label: 'Umur',
    unit: 'tahun',
    type: 'number',
    min: 0,
    max: 120,
    step: 1,
    placeholder: 'Contoh: 35',
    category: 'demografis',
    description: 'Usia pasien.',
  },
  {
    key: 'tb',
    label: 'Tinggi Badan',
    unit: 'cm',
    type: 'number',
    min: 30,
    max: 230,
    step: 1,
    placeholder: 'Contoh: 165',
    category: 'antropometri',
    description: 'Tinggi badan pasien dalam sentimeter.',
  },
  {
    key: 'bb',
    label: 'Berat Badan',
    unit: 'kg',
    type: 'number',
    min: 1,
    max: 250,
    step: 0.1,
    placeholder: 'Contoh: 60',
    category: 'antropometri',
    description: 'Berat badan pasien dalam kilogram.',
  },
  {
    key: 'jenis kelamin',
    label: 'Jenis Kelamin',
    type: 'binary',
    options: GENDER_OPTIONS,
    category: 'demografis',
    description: 'Kode jenis kelamin sesuai dataset lokal.',
  },
  {
    key: 'Batuk',
    label: 'Batuk',
    type: 'binary',
    options: YES_NO,
    category: 'gejala',
    description: 'Keluhan batuk.',
  },
  {
    key: 'pilek',
    label: 'Pilek',
    type: 'binary',
    options: YES_NO,
    category: 'gejala',
    description: 'Keluhan pilek.',
  },
  {
    key: 'demam',
    label: 'Demam',
    type: 'binary',
    options: YES_NO,
    category: 'gejala',
    description: 'Keluhan demam.',
  },
  {
    key: 'sesak',
    label: 'Sesak Napas',
    type: 'binary',
    options: YES_NO,
    category: 'gejala',
    description: 'Keluhan sesak napas.',
  },
  {
    key: 'mengi',
    label: 'Mengi',
    type: 'binary',
    options: YES_NO,
    category: 'gejala',
    description: 'Bunyi napas mengi.',
  },
  {
    key: 'mual',
    label: 'Mual',
    type: 'binary',
    options: YES_NO,
    category: 'gejala',
    description: 'Keluhan mual.',
  },
  {
    key: 'lemas',
    label: 'Lemas',
    type: 'binary',
    options: YES_NO,
    category: 'gejala',
    description: 'Keluhan badan terasa lemas.',
  },
  {
    key: 'nyeri dada',
    label: 'Nyeri Dada',
    type: 'binary',
    options: YES_NO,
    category: 'gejala',
    description: 'Keluhan nyeri pada dada.',
  },
  {
    key: 'nyeri uluh hati',
    label: 'Nyeri Ulu Hati',
    type: 'binary',
    options: YES_NO,
    category: 'gejala',
    description: 'Keluhan nyeri ulu hati.',
  },
  {
    key: 'pusing',
    label: 'Pusing',
    type: 'binary',
    options: YES_NO,
    category: 'gejala',
    description: 'Keluhan pusing.',
  },
  {
    key: 'dahak',
    label: 'Dahak',
    type: 'binary',
    options: YES_NO,
    category: 'gejala',
    description: 'Ada dahak saat batuk. Dahak merupakan gejala pendukung dan bukan penyebab utama asma.',
  },
  {
    key: 'napas berat',
    label: 'Napas Berat',
    type: 'binary',
    options: YES_NO,
    category: 'gejala',
    description: 'Napas terasa berat.',
  },
  {
    key: 'riwayat keluarga',
    label: 'Riwayat Penyakit Asma Keluarga',
    type: 'binary',
    options: YES_NO,
    category: 'riwayat',
    description: 'Ada riwayat penyakit asma pada keluarga.',
  },
  {
    key: 'alergi',
    label: 'Alergi',
    type: 'binary',
    options: YES_NO,
    category: 'riwayat',
    description: 'Riwayat alergi.',
  },
  {
    key: 'penyakit bawaan',
    label: 'Riwayat Penyakit Asma Sebelumnya',
    type: 'binary',
    options: YES_NO,
    category: 'riwayat',
    description: 'Pasien pernah memiliki riwayat penyakit asma sebelumnya.',
  },
  {
    key: 'dm',
    label: 'Diabetes Melitus',
    type: 'binary',
    options: YES_NO,
    category: 'riwayat',
    description: 'Riwayat diabetes melitus.',
  },
  {
    key: 'penyakit_tb',
    label: 'Riwayat TB',
    type: 'binary',
    options: YES_NO,
    category: 'riwayat',
    description: 'Riwayat penyakit TB.',
  },
  {
    key: 'gerd',
    label: 'GERD',
    type: 'binary',
    options: YES_NO,
    category: 'riwayat',
    description: 'Riwayat GERD atau refluks lambung.',
  },
  {
    key: 'merokok',
    label: 'Merokok',
    type: 'binary',
    options: YES_NO,
    category: 'gaya_hidup',
    description: 'Status merokok.',
  },
  {
    key: 'populasi udara',
    label: 'Paparan Polusi Udara',
    type: 'binary',
    options: YES_NO,
    category: 'gaya_hidup',
    description: 'Ada paparan polusi udara.',
  },
  {
    key: 'tidur',
    label: 'Gangguan Tidur',
    type: 'binary',
    options: YES_NO,
    category: 'gaya_hidup',
    description: 'Ada gangguan atau kualitas tidur buruk.',
  },
  {
    key: 'aktivitas',
    label: 'Gangguan Aktivitas',
    type: 'binary',
    options: YES_NO,
    category: 'gaya_hidup',
    description: 'Keluhan mengganggu aktivitas.',
  },
  {
    key: 'mudah lelah',
    label: 'Mudah Lelah',
    type: 'binary',
    options: YES_NO,
    category: 'gejala',
    description: 'Pasien mudah merasa lelah.',
  },
];

// 26 fitur Dataset A / asthma_disease_data.csv.
export const ASTHMA_DATASET_FEATURES = [
  {
    key: 'Age',
    label: 'Usia',
    unit: 'tahun',
    type: 'number',
    min: 0,
    max: 120,
    step: 1,
    placeholder: 'Contoh: 40',
    category: 'asthma_demografi',
    description: 'Usia pasien dalam tahun. Asma bisa muncul di semua usia, sering mulai di masa anak-anak.',
  },
  {
    key: 'Gender',
    label: 'Jenis Kelamin',
    type: 'binary',
    options: GENDER_OPTIONS,
    category: 'asthma_demografi',
    description: 'Jenis kelamin pasien.',
  },
  {
    key: 'Ethnicity',
    label: 'Etnis / Ras',
    type: 'select',
    options: [
      { label: 'Kaukasian (Eropa/Amerika)', value: 0 },
      { label: 'Afrika-Amerika',            value: 1 },
      { label: 'Asia',                      value: 2 },
      { label: 'Lainnya',                   value: 3 },
    ],
    category: 'asthma_demografi',
    description: 'Latar belakang etnis pasien. Asia mencakup Asia Timur, Asia Selatan, dan Asia Tenggara.',
  },
  {
    key: 'EducationLevel',
    label: 'Tingkat Pendidikan',
    type: 'select',
    options: [
      { label: 'Tidak Sekolah / SD',        value: 0 },
      { label: 'SMP',                        value: 1 },
      { label: 'SMA / SMK',                  value: 2 },
      { label: 'Sarjana / Perguruan Tinggi', value: 3 },
    ],
    category: 'asthma_demografi',
    description: 'Tingkat pendidikan terakhir. Berkaitan dengan kesadaran kesehatan dan akses layanan medis.',
  },
  {
    key: 'BMI',
    label: 'BMI (Indeks Massa Tubuh)',
    unit: 'kg/m²',
    type: 'number',
    min: 10,
    max: 60,
    step: 0.1,
    placeholder: 'Contoh: 24.5',
    category: 'asthma_fisik',
    description: 'BMI = Berat (kg) ÷ Tinggi² (m). Obesitas (BMI >30) meningkatkan risiko asma. Normal: 18.5–24.9.',
  },
  {
    key: 'Smoking',
    label: 'Merokok',
    type: 'binary',
    options: YES_NO,
    category: 'asthma_gaya_hidup',
    description: 'Status merokok aktif. Asap rokok merusak saluran napas dan merupakan pemicu utama serangan asma.',
  },
  {
    key: 'PhysicalActivity',
    label: 'Tingkat Aktivitas Fisik',
    unit: 'skor 0–10',
    type: 'number',
    min: 0,
    max: 10,
    step: 0.1,
    placeholder: 'Contoh: 5.0',
    category: 'asthma_gaya_hidup',
    description: 'Skor aktivitas fisik harian. 0 = sangat tidak aktif, 10 = sangat aktif. Kurang gerak memperburuk kondisi paru.',
  },
  {
    key: 'DietQuality',
    label: 'Kualitas Pola Makan',
    unit: 'skor 0–10',
    type: 'number',
    min: 0,
    max: 10,
    step: 0.1,
    placeholder: 'Contoh: 6.0',
    category: 'asthma_gaya_hidup',
    description: 'Skor kualitas diet. 0 = sangat buruk (banyak gorengan/olahan), 10 = sangat sehat (banyak sayur/buah).',
  },
  {
    key: 'SleepQuality',
    label: 'Kualitas Tidur',
    unit: 'skor 0–10',
    type: 'number',
    min: 0,
    max: 10,
    step: 0.1,
    placeholder: 'Contoh: 7.0',
    category: 'asthma_gaya_hidup',
    description: 'Skor kualitas tidur. 0 = sangat buruk (sering terbangun/sesak), 10 = sangat baik. Asma sering memburuk malam hari.',
  },
  {
    key: 'PollutionExposure',
    label: 'Paparan Polusi Udara',
    unit: 'skor 0–10',
    type: 'number',
    min: 0,
    max: 10,
    step: 0.1,
    placeholder: 'Contoh: 5.5',
    category: 'asthma_lingkungan',
    description: 'Tingkat paparan polusi udara (asap kendaraan, pabrik, dll). Semakin tinggi, risiko dan keparahan asma meningkat.',
  },
  {
    key: 'PollenExposure',
    label: 'Paparan Serbuk Sari (Pollen)',
    unit: 'skor 0–10',
    type: 'number',
    min: 0,
    max: 10,
    step: 0.1,
    placeholder: 'Contoh: 4.0',
    category: 'asthma_lingkungan',
    description: 'Tingkat paparan serbuk sari tanaman. Alergen utama yang memicu bronkospasme pada penderita asma alergi.',
  },
  {
    key: 'DustExposure',
    label: 'Paparan Debu',
    unit: 'skor 0–10',
    type: 'number',
    min: 0,
    max: 10,
    step: 0.1,
    placeholder: 'Contoh: 5.0',
    category: 'asthma_lingkungan',
    description: 'Tingkat paparan debu di rumah/lingkungan kerja. Tungau debu adalah alergen asma paling umum di dalam ruangan.',
  },
  {
    key: 'PetAllergy',
    label: 'Alergi Hewan Peliharaan',
    type: 'binary',
    options: YES_NO,
    category: 'asthma_riwayat',
    description: 'Riwayat alergi terhadap bulu/protein dari hewan peliharaan (kucing, anjing, dll).',
  },
  {
    key: 'FamilyHistoryAsthma',
    label: 'Riwayat Asma dalam Keluarga',
    type: 'binary',
    options: YES_NO,
    category: 'asthma_riwayat',
    description: 'Apakah orang tua atau saudara kandung menderita asma? Faktor genetik meningkatkan risiko hingga 3–6×.',
  },
  {
    key: 'HistoryOfAllergies',
    label: 'Riwayat Alergi',
    type: 'binary',
    options: YES_NO,
    category: 'asthma_riwayat',
    description: 'Riwayat alergi apa pun (makanan, obat, lingkungan). Kondisi atopik erat kaitannya dengan asma alergi.',
  },
  {
    key: 'Eczema',
    label: 'Eksim (Atopic Dermatitis)',
    type: 'binary',
    options: YES_NO,
    category: 'asthma_riwayat',
    description: 'Riwayat eksim atau dermatitis atopik. Bagian dari "atopic triad" yang sering muncul bersama asma.',
  },
  {
    key: 'HayFever',
    label: 'Hay Fever (Rinitis Alergi)',
    type: 'binary',
    options: YES_NO,
    category: 'asthma_riwayat',
    description: 'Riwayat rinitis alergi/hay fever (bersin, hidung berair karena alergen). Sangat berkorelasi dengan asma.',
  },
  {
    key: 'GastroesophagealReflux',
    label: 'GERD / Refluks Lambung',
    type: 'binary',
    options: YES_NO,
    category: 'asthma_riwayat',
    description: 'Riwayat GERD. Asam lambung yang naik ke esofagus dapat mencetuskan refleks bronkospasme.',
  },
  {
    key: 'LungFunctionFEV1',
    label: 'Fungsi Paru – FEV1',
    unit: 'Liter',
    type: 'number',
    min: 0,
    max: 8,
    step: 0.01,
    placeholder: 'Contoh: 2.50',
    category: 'asthma_fungsi_paru',
    description: 'Volume udara yang bisa dihembuskan paksa dalam 1 detik (spirometri). Penderita asma: biasanya <2.5 L.',
  },
  {
    key: 'LungFunctionFVC',
    label: 'Fungsi Paru – FVC',
    unit: 'Liter',
    type: 'number',
    min: 0,
    max: 8,
    step: 0.01,
    placeholder: 'Contoh: 3.80',
    category: 'asthma_fungsi_paru',
    description: 'Kapasitas vital paksa (total udara yang bisa dikeluarkan). Normal: 3.5–6.0 L. FEV1/FVC <70% = obstruksi.',
  },
  {
    key: 'Wheezing',
    label: 'Mengi (Wheezing)',
    type: 'binary',
    options: YES_NO,
    category: 'asthma_gejala',
    description: 'Bunyi napas "ngik" seperti siulan saat menghela napas. Gejala khas asma akibat penyempitan saluran napas.',
  },
  {
    key: 'ShortnessOfBreath',
    label: 'Sesak Napas',
    type: 'binary',
    options: YES_NO,
    category: 'asthma_gejala',
    description: 'Rasa sulit bernapas atau napas terasa pendek. Gejala umum asma, terutama saat terpapar pemicu.',
  },
  {
    key: 'ChestTightness',
    label: 'Dada Terasa Berat / Tertekan',
    type: 'binary',
    options: YES_NO,
    category: 'asthma_gejala',
    description: 'Perasaan tertekan, diikat, atau berat di dada. Salah satu gejala khas serangan asma.',
  },
  {
    key: 'Coughing',
    label: 'Batuk',
    type: 'binary',
    options: YES_NO,
    category: 'asthma_gejala',
    description: 'Batuk berulang atau kronis. Pada asma, batuk sering kering dan memburuk malam hari atau pagi hari.',
  },
  {
    key: 'NighttimeSymptoms',
    label: 'Gejala Memburuk Malam Hari',
    type: 'binary',
    options: YES_NO,
    category: 'asthma_gejala',
    description: 'Gejala asma yang muncul atau memburuk saat malam/dini hari. Tanda asma tidak terkontrol dengan baik.',
  },
  {
    key: 'ExerciseInduced',
    label: 'Dipicu oleh Olahraga / Aktivitas',
    type: 'binary',
    options: YES_NO,
    category: 'asthma_gejala',
    description: 'Sesak napas atau mengi muncul saat/setelah berolahraga. Dikenal sebagai Exercise-Induced Bronchoconstriction.',
  },
];

export const CATEGORY_LABELS = {
  demografis:         { label: 'Identitas Pasien',          icon: '👤' },
  antropometri:       { label: 'Data Antropometri',          icon: '📏' },
  gejala:             { label: 'Gejala Klinis',              icon: '🤒' },
  riwayat:            { label: 'Riwayat Penyakit',           icon: '📋' },
  gaya_hidup:         { label: 'Lingkungan & Kebiasaan',     icon: '🌿' },
  asthma_demografi:   { label: 'Demografi Pasien',           icon: '👤' },
  asthma_fisik:       { label: 'Data Fisik (BMI)',           icon: '⚖️' },
  asthma_gaya_hidup:  { label: 'Gaya Hidup',                 icon: '🏃' },
  asthma_lingkungan:  { label: 'Paparan Lingkungan',         icon: '🌫️' },
  asthma_riwayat:     { label: 'Riwayat Penyakit & Alergi', icon: '🧬' },
  asthma_fungsi_paru: { label: 'Fungsi Paru (Spirometri)',   icon: '🫁' },
  asthma_gejala:      { label: 'Gejala Klinis Asma',        icon: '😮‍💨' },
};

export const CATEGORY_ORDER = [
  'demografis',
  'antropometri',
  'gejala',
  'riwayat',
  'gaya_hidup',
];

export const ASTHMA_CATEGORY_ORDER = [
  'asthma_demografi',
  'asthma_fisik',
  'asthma_gaya_hidup',
  'asthma_lingkungan',
  'asthma_riwayat',
  'asthma_fungsi_paru',
  'asthma_gejala',
];

// Helper berikut menjaga pemilihan fitur tetap terpusat berdasarkan dataset aktif.
export const getFeaturesByDataset = (datasetMode = 'local') => (
  datasetMode === 'asthma' ? ASTHMA_DATASET_FEATURES : FEATURES
);

export const getCategoryOrderByDataset = (datasetMode = 'local') => (
  datasetMode === 'asthma' ? ASTHMA_CATEGORY_ORDER : CATEGORY_ORDER
);

export const getDefaultValues = (datasetMode = 'local') => (
  getFeaturesByDataset(datasetMode).reduce((acc, feature) => {
    acc[feature.key] = feature.type === 'number' ? '' : 0;
    return acc;
  }, {})
);

// Nilai default statis disediakan juga bila bagian lain butuh akses langsung.
export const DEFAULT_VALUES = FEATURES.reduce((acc, feature) => {
  acc[feature.key] = feature.type === 'number' ? '' : 0;
  return acc;
}, {});

export const ASTHMA_DEFAULT_VALUES = ASTHMA_DATASET_FEATURES.reduce((acc, feature) => {
  acc[feature.key] = feature.type === 'number' ? '' : 0;
  return acc;
}, {});
