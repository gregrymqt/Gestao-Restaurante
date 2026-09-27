import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/features/auth';
import { tokens } from '@/components/primitives/tokens';

/**
 * Gateway Auth Guard:
 * Inicializa a sessão a partir do armazenamento seguro MMKV e redireciona
 * para as abas operacionais (se autenticado) ou para o login de turno.
 */
export default function IndexGateway() {
  const { isAuthenticated, isInitialized, initSessionFromStorage } = useAuthStore();

  useEffect(() => {
    initSessionFromStorage();
  }, [initSessionFromStorage]);

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={tokens.colors.primary} />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.background,
  },
});
