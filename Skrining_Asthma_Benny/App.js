import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import ScreeningScreen from './src/screens/ScreeningScreen';
import ResultScreen from './src/screens/ResultScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import AboutScreen from './src/screens/AboutScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import { AuthProvider, useAuth } from './src/context/AuthContext';

const Stack = createNativeStackNavigator();

function RootNavigator() {
  // Ambil status autentikasi global dan status pemulihan sesi dari context.
  const { isAuthenticated, loading } = useAuth();
  // Splash internal dipakai agar transisi awal aplikasi terasa lebih halus.
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    // Tahan splash beberapa saat sebelum navigator utama ditampilkan.
    const timer = setTimeout(() => setIsBooting(false), 2400);
    return () => clearTimeout(timer);
  }, []);

  // Tunggu AsyncStorage selesai restore session
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4FBFF' }}>
        <ActivityIndicator size="large" color="#2D9CDB" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {/* Alur layar dibedakan berdasarkan status booting dan login pengguna. */}
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {isBooting ? (
          <Stack.Screen name="Splash" component={SplashScreen} />
        ) : isAuthenticated ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Screening" component={ScreeningScreen} />
            <Stack.Screen name="Result" component={ResultScreen} />
            <Stack.Screen name="History" component={HistoryScreen} />
            <Stack.Screen name="About" component={AboutScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    // Provider dibungkus di level paling atas agar aman dipakai di seluruh layar.
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
