import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRealtimeEvents } from '@/shared/hooks/useRealtimeEvents';
import { RealtimeStatusBar } from '@/shared/components/RealtimeStatusBar';
import { RealtimeEventToast } from '@/shared/components/RealtimeEventToast';
import { OfflineBanner } from '@/shared/components/OfflineBanner';
import { AppDialogHost } from '@/shared/components/AppDialog';

function RealtimeAppContainer() {
  // Orquestração de tempo real via SSE e invalidação cirúrgica de cache
  useRealtimeEvents();

  return (
    <View style={styles.container}>
      <OfflineBanner />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <RealtimeStatusBar />
      <RealtimeEventToast />
      <AppDialogHost />
    </View>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 2,
            staleTime: 1000 * 60 * 5,
          },
        },
      })
  );

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <RealtimeAppContainer />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
