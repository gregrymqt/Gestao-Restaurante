import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { useSseStatus } from '../hooks/useSseStatus';
import { useAuthStore } from '@/features/auth';

export function RealtimeStatusBar() {
  const insets = useSafeAreaInsets();
  const status = useSseStatus((state) => state.status);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) return null;

  const isConnected = status === 'CONNECTED';
  const isReconnecting = status === 'RECONNECTING';
  const isConnecting = status === 'CONNECTING';

  const dotColor = isConnected
    ? tokens.colors.status.greenText
    : isReconnecting
    ? tokens.colors.status.orangeText
    : isConnecting
    ? '#1A73E8'
    : tokens.colors.textMuted;

  const statusLabel = isConnected
    ? 'Tempo Real Ativo'
    : isReconnecting
    ? 'Reconectando...'
    : isConnecting
    ? 'Conectando...'
    : 'Stream Offline';

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 4) }]}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <ThemedText variant="caption" style={styles.statusText}>
        {statusLabel}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    paddingTop: 4,
    paddingHorizontal: tokens.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.textSecondary,
    letterSpacing: 0.3,
  },
});
