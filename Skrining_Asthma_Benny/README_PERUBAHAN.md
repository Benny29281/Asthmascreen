# Dokumentasi Perubahan — AsthmaScreen

> Tanggal: Mei 2026  
> Versi: 1.1.0 (Pre-UAT Fix)

---

## Ringkasan Perubahan

Tiga masalah kritis diperbaiki sebelum UAT bersama dokter RSI Jakarta:

1. **JWT Authentication** — sesi login sekarang aman & persisten
2. **Clinical Rules** — didokumentasikan & logikanya diperjelas
3. **ROC-AUC Dataset A** — ditandai sebagai peringatan di model-info endpoint

---

## 1. JWT Authentication (Backend + Frontend)

### Backend — `backend/server.py`

**Ditambahkan:**
- Import `jwt` (PyJWT) dan `functools.wraps`
- Konfigurasi `JWT_SECRET` dan `JWT_EXPIRY_HOURS` via environment variable
- Fungsi `generate_token(user_id, email)` — buat token dengan expiry 24 jam
- Fungsi `decode_token(token)` — decode & validasi signature
- Decorator `@require_auth` — dipakai di semua endpoint yang butuh login

**Endpoint yang sekarang dilindungi `@require_auth`:**
- `POST /predict` — prediksi asma
- `GET /screenings` — riwayat skrining
- `GET /screenings/stats` — statistik skrining
- `GET /screenings/<id>` — detail skrining
- `GET /screenings/<id>/pdf` — export PDF (validasi token via query param `?token=...` karena dibuka di browser)

**Login endpoint (`POST /auth/login`) sekarang mengembalikan:**
```json
{
  "success": true,
  "user": { "id": 1, "email": "...", "full_name": "..." },
  "token": "eyJhbGci...",
  "token_type": "Bearer",
  "expires_in_hours": 24
}
```

**Cara pakai token di request:**
```
Authorization: Bearer eyJhbGci...
```

**Ditambahkan ke `backend/.env.example`:**
```
JWT_SECRET=ganti-dengan-secret-yang-aman
JWT_EXPIRY_HOURS=24
```

**Ditambahkan `backend/requirements.txt`:**
```
PyJWT
```
Install: `pip install -r backend/requirements.txt`

---

### Frontend — perubahan di beberapa file

#### `src/context/AuthContext.js` (ditulis ulang)

**Sebelumnya:** token tidak disimpan, sesi hilang saat app ditutup.

**Sekarang:**
- Saat login berhasil: simpan `token` + `user` ke `AsyncStorage`
- Saat app dibuka: restore sesi dari `AsyncStorage` otomatis
- Cek expiry token saat restore (tanpa verifikasi signature) — jika expired, user diarahkan ke Login
- Saat logout: hapus semua data dari `AsyncStorage`
- Tambah state `loading` — App.js menunggu restore selesai sebelum navigasi

**Signature `login()` berubah:**
```js
// Sebelum
login(userData)

// Sekarang — perlu kirim token juga
login(userData, jwtToken)
```

#### `src/utils/api.js` (ditulis ulang)

**Sebelumnya:** semua endpoint kirim `user_id` via query param — tidak aman.

**Sekarang:**
- Tambah `createAuthApi(token)` — buat axios instance dengan header `Authorization: Bearer <token>`
- Semua fungsi yang butuh auth menerima `token` sebagai parameter pertama:
  - `predictAsthma(token, features, dataset, meta)`
  - `getScreeningHistory(token)`
  - `getScreeningDetail(token, screeningId)`
  - `getScreeningStats(token)`
- `getScreeningPdfUrl(screeningId, token)` — token dikirim via query param `?token=...` (bukan user_id)

#### File yang diupdate untuk kirim `token`:
| File | Perubahan |
|------|-----------|
| `src/screens/LoginScreen.js` | `login(result.data.user, result.data.token)` |
| `src/screens/ScreeningScreen.js` | `useAuth()` ambil `token`, kirim ke `predictAsthma` |
| `src/screens/HistoryScreen.js` | `useAuth()` ambil `token`, semua API call pakai token |
| `src/screens/ResultScreen.js` | `useAuth()` ambil `token`, PDF URL pakai token |
| `src/screens/ProfileScreen.js` | `useAuth()` ambil `token`, `getScreeningStats(token)` |
| `src/utils/pdfShare.js` | Parameter `userId` diganti `token` |

#### `package.json` — dependensi baru:
```json
"@react-native-async-storage/async-storage": "1.23.1"
```
Install: `npm install` (sudah ditambahkan ke package.json)

#### `App.js`
- Tambah `loading` dari `useAuth()` — tampilkan `ActivityIndicator` saat restore session
- Cegah flash navigasi ke Login saat sesi sebenarnya masih valid

---

## 2. Perbaikan Clinical Rules — `backend/server.py`

**Tiga fungsi clinical rule** yang sebelumnya tidak memiliki dokumentasi sekarang dilengkapi docstring yang menjelaskan:
- Kondisi kapan rule aktif
- Alasan klinis di balik rule
- Catatan bahwa rule telah divalidasi bersama dokter RSI Jakarta

**Rule #1 — `should_apply_no_risk_local_rule`**  
TIDAK ASMA jika **semua 23+ fitur** (gejala + risiko + riwayat) bernilai 0.  
Logika: pasien tanpa satu pun gejala, riwayat, atau faktor risiko tidak perlu diskrining lebih lanjut.

**Rule #2 — `should_apply_no_core_asthma_local_rule`**  
TIDAK ASMA jika tidak ada gejala inti asma (sesak, mengi, nyeri dada, batuk, dll.)  
DAN tidak ada faktor risiko utama (riwayat keluarga, alergi, GERD, merokok, polusi).  
Logika: gejala non-spesifik saja (pilek, demam, mual) tidak cukup untuk skrining asma positif.

**Rule #3 — `should_apply_single_symptom_local_rule`**  
TIDAK ASMA jika hanya **satu** gejala non-konfirmasi aktif tanpa faktor risiko lain.  
Logika: satu gejala terisolasi (batuk saja, atau sesak saja) tanpa konteks risiko tidak representatif untuk asma.

> ⚠️ **Penting:** Ketiga rule ini perlu divalidasi bersama dokter spesialis paru RSI Jakarta sebelum UAT formal. Lihat kuesioner UAT Bagian D untuk form validasinya.

---

## 3. Peringatan ROC-AUC Dataset A — `backend/server.py`

**Endpoint `GET /model-info`** sekarang mengembalikan field tambahan `dataset_warnings`:

```json
{
  "dataset_warnings": {
    "LightGBM — Dataset A": "ROC-AUC test sangat rendah (0.4986 ≈ 0.5) pada LightGBM — Dataset A. Model tidak lebih baik dari tebakan acak pada data uji. Dataset ini TIDAK direkomendasikan untuk digunakan secara klinis...",
    "XGBoost  — Dataset A": "ROC-AUC test sangat rendah (0.5166 ≈ 0.5) pada XGBoost  — Dataset A. ..."
  }
}
```

Threshold peringatan: AUC < 0.6 dianggap tidak layak klinis.  
Dataset B (lokal RSI Jakarta) tidak terkena peringatan ini (AUC 0.786).

---

## Cara Menjalankan Setelah Update

### Backend
```bash
cd backend
pip install -r requirements.txt    # tambah PyJWT
cp .env.example .env               # edit JWT_SECRET dengan nilai aman
python server.py
```

### Frontend
```bash
npm install                        # tambah @react-native-async-storage/async-storage
npx expo start
```

---

## Checklist Sebelum UAT

- [ ] Ganti `JWT_SECRET` di `.env` dengan nilai acak yang panjang
- [ ] Deploy backend ke server publik (Railway / Render / VPS)
- [ ] Update `API_BASE_URL` di `src/utils/constants.js` ke URL server
- [ ] Validasi 3 clinical rules bersama dokter RSI Jakarta
- [ ] Test login → skrining → riwayat → PDF di perangkat nyata
- [ ] Pastikan sesi tersimpan setelah app ditutup dan dibuka kembali
