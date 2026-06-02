import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Storage Keys ──────────────────────────────────────────
const TOKEN_KEY = 'asthmascreen_jwt_token';
const USER_KEY  = 'asthmascreen_user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // State global untuk menyimpan identitas user, token, dan status loading awal.
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);

  // Saat app pertama buka: restore sesi dari AsyncStorage
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);

        if (storedToken && storedUser) {
          const isExpired = checkTokenExpired(storedToken);
          if (!isExpired) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
          } else {
            await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
          }
        }
      } catch (error) {
        console.warn('AuthContext: gagal restore session:', error);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // Decode JWT payload untuk cek expiry (tanpa verifikasi signature)
  const checkTokenExpired = (jwtToken) => {
    try {
      const base64Payload = jwtToken.split('.')[1];
      const payload = JSON.parse(atob(base64Payload));
      return payload.exp < Math.floor(Date.now() / 1000);
    } catch {
      return true;
    }
  };

  const login = async (userData, jwtToken) => {
    // Simpan sesi ke storage lebih dulu agar login tetap bertahan saat app dibuka ulang.
    try {
      await Promise.all([
        AsyncStorage.setItem(TOKEN_KEY, jwtToken),
        AsyncStorage.setItem(USER_KEY, JSON.stringify(userData)),
      ]);
    } catch (error) {
      console.warn('AuthContext: gagal simpan sesi:', error);
    }
    setToken(jwtToken);
    setUser(userData);
  };

  const logout = async () => {
    // Hapus sesi lokal lalu kosongkan state agar user kembali ke flow login.
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    } catch (error) {
      console.warn('AuthContext: gagal hapus sesi:', error);
    }
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    // Status ini dipakai navigator untuk memutuskan flow layar publik atau privat.
    isAuthenticated: Boolean(user) && Boolean(token),
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider.');
  }
  return context;
}
