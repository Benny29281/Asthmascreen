# AsthmaScreen — Aplikasi Klasifikasi Penyakit Asma
**Benny Dwiyanto | NPM: 535220012**
**Teknik Informatika — Universitas Tarumanagara**

---

## 📁 Struktur Folder

```
AsthmaScreen/
├── App.js                        ← Root navigation
├── app.json                      ← Konfigurasi Expo
├── package.json                  ← Dependensi React Native
├── babel.config.js
├── server.py                     ← ⭐ Flask Backend (jalankan ini dulu!)
│
├── src/
│   ├── screens/
│   │   ├── HomeScreen.js         ← Halaman beranda
│   │   ├── ScreeningScreen.js    ← Form input 27 atribut klinis
│   │   └── ResultScreen.js       ← Hasil prediksi & analisis
│   │
│   └── utils/
│       ├── constants.js          ← 27 fitur, warna, konfigurasi
│       └── api.js                ← Koneksi ke Flask backend
│
└── assets/                       ← Tambahkan icon.png & splash.png
```

---

## 🚀 Cara Menjalankan

### Step 1 — Jalankan Notebook Backend
Buka dan jalankan semua sel di:
```
535220012_Benny_Dwiyanto_Klasifikasi_Asma.ipynb
```
Pastikan folder `models/` berisi:
- `lightgbm_asthma_smote.pkl`
- `xgboost_asthma_smote.pkl`
- `model_terbaik_lightgbm.pkl` (atau xgboost)
- `feature_names.json`

### Step 2 — Jalankan Flask Backend
```bash
# Install dependensi server
pip install flask flask-cors joblib scikit-learn lightgbm xgboost numpy pandas

# Jalankan server (dari folder yang sama dengan notebook)
python server.py
```
Server berjalan di: `http://0.0.0.0:5000`

### Step 3 — Konfigurasi IP di Aplikasi
Buka file `src/utils/constants.js` dan ubah `API_BASE_URL`:
```javascript
// Jika menjalankan di emulator Android:
export const API_BASE_URL = 'http://10.0.2.2:5000';

// Jika menjalankan di HP fisik (ganti dengan IP komputer kamu):
export const API_BASE_URL = 'http://192.168.1.XXX:5000';

// Jika menjalankan di web/browser:
export const API_BASE_URL = 'http://localhost:5000';
```

### Step 4 — Jalankan Aplikasi React Native
```bash
# Install dependensi
npm install

# Jalankan dengan Expo
npx expo start

# Pilih platform:
# a → Android emulator
# i → iOS simulator
# w → Web browser
```

---

## 📡 API Endpoints Flask

| Method | Endpoint      | Deskripsi                    |
|--------|---------------|------------------------------|
| GET    | `/health`     | Cek status server & model    |
| GET    | `/model-info` | Info model & hyperparameter  |
| POST   | `/predict`    | Prediksi asma dari 27 fitur  |

### Contoh Request POST `/predict`
```json
{
  "features": {
    "Age": 35,
    "Gender": 1,
    "Ethnicity": 0,
    "EducationLevel": 2,
    "BMI": 22.5,
    "Smoking": 0,
    "PhysicalActivity": 5.0,
    "DietQuality": 6.0,
    "SleepQuality": 7.0,
    "PollutionExposure": 3.0,
    "PollenExposure": 2.0,
    "DustExposure": 2.0,
    "PetAllergy": 0,
    "FamilyHistoryAsthma": 1,
    "HistoryOfAllergies": 0,
    "Eczema": 0,
    "HayFever": 0,
    "GastroesophagealReflux": 0,
    "LungFunctionFEV1": 2.5,
    "LungFunctionFVC": 3.5,
    "Wheezing": 0,
    "ShortnessOfBreath": 0,
    "ChestTightness": 0,
    "Coughing": 0,
    "NighttimeSymptoms": 0,
    "ExerciseInduced": 0
  }
}
```

### Contoh Response
```json
{
  "success": true,
  "prediction": 0,
  "label": "TIDAK ASMA",
  "probability_asma": 12.45,
  "probability_sehat": 87.55,
  "confidence_score": 87.55,
  "model_used": "LightGBM",
  "risk_factors": ["Riwayat asma dalam keluarga"],
  "comparison": {
    "LightGBM": { "prediction": 0, "probability_asma": 12.45, "probability_sehat": 87.55 },
    "XGBoost":  { "prediction": 0, "probability_asma": 10.20, "probability_sehat": 89.80 }
  }
}
```

---

## 🎨 Fitur Aplikasi

- **Home Screen** — Status koneksi server, info model & dataset
- **Screening Screen** — Form input 27 atribut klinis yang terorganisir per kategori
- **Result Screen** — Hasil prediksi, probabilitas, perbandingan LightGBM vs XGBoost, faktor risiko dominan, dan ringkasan data input

---

## ⚕️ Disclaimer
Aplikasi ini adalah alat bantu skrining berbasis data dan **tidak menggantikan** diagnosis medis oleh tenaga kesehatan profesional.
