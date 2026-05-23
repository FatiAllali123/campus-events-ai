import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { RefreshProvider } from '../hooks/useRefresh';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { initDatabase, seedDatabase } from '../database/init';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import { DMMono_400Regular, DMMono_500Medium } from '@expo-google-fonts/dm-mono';
import { Colors } from '../constants/theme';

// Empêcher la disparition automatique du splash
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const setup = async () => {
      try {
        await initDatabase();
        await seedDatabase();
      } catch (e) {
        console.log('DB error:', e);
      }
    };
    setup();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments?.[0] === 'login';

    if (!user && !inAuthGroup) {
      router.replace('/login');
      return;
    }

    if (user && inAuthGroup) {
      router.replace(
        user.role === 'admin'
          ? '/(admin)/events'
          : '/(student)/events'
      );
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg }}>
        <ActivityIndicator color={Colors.accent} size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="(admin)" />
      <Stack.Screen name="(student)" />
    </Stack>
  );
}

export default function RootLayout() {
  // Chargement des polices custom
  const [fontsLoaded, fontError] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
    DMMono_400Regular,
    DMMono_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Attendre que les polices soient prêtes
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <RefreshProvider>
        <RootLayoutNav />
      </RefreshProvider>
    </AuthProvider>
  );
}
