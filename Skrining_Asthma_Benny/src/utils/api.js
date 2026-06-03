import axios from 'axios';
import { API_BASE_URL } from './constants';

// ─── Axios instance dasar (tanpa auth header) ──────────────
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Axios instance dengan Bearer token ────────────────────
// Gunakan createAuthApi(token) setelah login berhasil.
export const createAuthApi = (token) =>
  axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

// Satukan cara membaca pesan error agar semua screen mendapat format yang konsisten.
const extractErrorMessage = (error, fallback) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.code === 'ECONNABORTED') {
    return `Koneksi ke server timeout. Cek backend di ${API_BASE_URL}.`;
  }

  if (!error.response) {
    return `Tidak dapat terhubung ke server (${API_BASE_URL}). Periksa EXPO_PUBLIC_API_BASE_URL dan pastikan backend aktif.`;
  }

  return error.message || fallback;
};

// ─── Auth (tidak butuh token) ──────────────────────────────

export const registerUser = async (payload) => {
  try {
    const response = await api.post('/auth/register', payload);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: extractErrorMessage(error, 'Register gagal. Silakan coba lagi.'),
    };
  }
};

export const loginUser = async (payload) => {
  try {
    const response = await api.post('/auth/login', payload);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: extractErrorMessage(error, 'Login gagal. Periksa email dan password.'),
    };
  }
};

// ─── Endpoint yang butuh token ─────────────────────────────

export const checkServerHealth = async () => {
  try {
    const response = await api.get('/health');
    return { success: true, data: response.data };
  } catch {
    return { success: false };
  }
};

export const getModelInfo = async () => {
  try {
    const response = await api.get('/model-info');
    return { success: true, data: response.data };
  } catch {
    return { success: false };
  }
};

export const predictAsthma = async (token, features, dataset = 'local', meta = {}) => {
  try {
    // Metadata tambahan seperti user dan nama pasien ikut dikirim saat hasil perlu disimpan.
    const authApi = createAuthApi(token);
    const response = await authApi.post('/predict', { features, dataset, ...meta });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: extractErrorMessage(
        error,
        'Tidak dapat terhubung ke server. Pastikan backend berjalan.',
      ),
    };
  }
};

export const getScreeningHistory = async (token) => {
  try {
    const authApi = createAuthApi(token);
    const response = await authApi.get('/screenings');
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: extractErrorMessage(error, 'Riwayat skrining gagal dimuat.'),
    };
  }
};

export const getScreeningDetail = async (token, screeningId) => {
  try {
    const authApi = createAuthApi(token);
    const response = await authApi.get(`/screenings/${screeningId}`);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: extractErrorMessage(error, 'Detail riwayat skrining gagal dimuat.'),
    };
  }
};

export const getScreeningStats = async (token) => {
  try {
    const authApi = createAuthApi(token);
    const response = await authApi.get('/screenings/stats');
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: extractErrorMessage(error, 'Statistik skrining gagal dimuat.'),
    };
  }
};

// PDF dibuka lewat Linking.openURL (browser), token dikirim via query param
export const getScreeningPdfUrl = (screeningId, token) =>
  `${API_BASE_URL}/screenings/${screeningId}/pdf?token=${encodeURIComponent(token)}`;
