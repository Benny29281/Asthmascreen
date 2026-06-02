module.exports = function(api) {
  // Cache konfigurasi Babel agar proses build ulang lebih cepat.
  api.cache(true);
  return {
    // Preset Expo menangani transform dasar React Native pada project ini.
    presets: ['babel-preset-expo'],
    // Plugin reanimated harus diletakkan di Babel agar animasi berjalan benar.
    plugins: ['react-native-reanimated/plugin'],
  };
};
