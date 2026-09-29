import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { useConnectionStore } from '../hooks/useConnectionStore';

export function OfflineBanner() {
  const insets = useSafeAreaInsets();
  const isApiOnline = useConnectionStore((state) => state.isApiOnline);
  const isChecking = useConnectionStore((state) => state.isChecking);
  const checkConnection = useConnectionStore((state) => state.checkConnection);

  if (isApiOnline) {
    return null;
  }

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      style={[
        styles.container,
        { paddingTop: Math.max(insets.top, 8) + 4 },
      ]}
    >
      <View style={styles.contentRow}>
        <View style={styles.infoCol}>
          <View style={styles.badgeRow}>
            <View style={styles.statusDot} />
            <ThemedText variant="badge" style={styles.badgeText}>
              MODO OFFLINE
            </ThemedText>
          </View>
          <ThemedText variant="caption" style={styles.messageText}>
            Servidor inacessível. Visualização ativa, mas vendas e alterações estão bloqueadas.
          </ThemedText>
        </View>

        <TouchableOpacity
          style={[styles.reconnectButton, isChecking && styles.buttonDisabled]}
          onPress={() => checkConnection()}
          disabled={isChecking}
          accessibilityRole="button"
          accessibilityLabel="Tentar reconectar com o servidor"
        >
          {isChecking ? (
            <ActivityIndicator size="small" color={tokens.colors.status.redText} />
          ) : (
            <ThemedText variant="caption" weight="bold" style={styles.reconnectText}>
              Reconectar
            </ThemedText>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.colors.status.redBg,
    borderBottomWidth: 1,
    borderBottomColor: '#F2B8B5',
    paddingHorizontal: tokens.spacing.md,
    paddingBottom: tokens.spacing.sm,
    zIndex: 999,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacing.sm,
  },
  infoCol: {
    flex: 1,
    gap: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: tokens.colors.status.redText,
  },
  badgeText: {
    color: tokens.colors.status.redText,
    fontWeight: '800',
    fontSize: tokens.typography.fontXs,
    letterSpacing: 0.5,
  },
  messageText: {
    color: tokens.colors.status.redText,
    fontSize: tokens.typography.fontXs,
    lineHeight: 14,
  },
  reconnectButton: {
    backgroundColor: tokens.colors.white,
    borderWidth: 1,
    borderColor: tokens.colors.status.redText,
    borderRadius: tokens.radii.sm,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs + 2,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 84,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  reconnectText: {
    color: tokens.colors.status.redText,
    fontSize: tokens.typography.fontXs,
  },
});
