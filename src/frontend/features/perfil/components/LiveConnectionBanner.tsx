import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Wifi, WifiOff } from 'lucide-react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';

interface LiveConnectionBannerProps {
  isOffline: boolean;
}

export function LiveConnectionBanner({ isOffline }: LiveConnectionBannerProps) {
  return (
    <View style={styles.liveBanner}>
      <View style={styles.liveLeft}>
        <View
          style={[
            styles.liveDot,
            {
              backgroundColor: !isOffline
                ? tokens.colors.status.greenText
                : tokens.colors.status.redText,
            },
          ]}
        />
        <ThemedText
          style={[
            styles.liveText,
            {
              color: !isOffline
                ? tokens.colors.status.greenText
                : tokens.colors.status.redText,
            },
          ]}
        >
          {!isOffline ? 'Tempo Real Conectado' : 'Offline (Cache Local)'}
        </ThemedText>
      </View>

      {!isOffline ? (
        <View style={styles.latencyBadge}>
          <Wifi size={13} color={tokens.colors.status.greenText} />
          <ThemedText style={styles.latencyText}>18ms</ThemedText>
        </View>
      ) : (
        <View style={styles.latencyBadgeOffline}>
          <WifiOff size={13} color={tokens.colors.status.redText} />
          <ThemedText style={styles.latencyTextOffline}>Desconectado</ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  liveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: tokens.colors.card,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radii.md,
    borderColor: tokens.colors.border,
    borderWidth: 1,
  },
  liveLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: tokens.radii.full,
  },
  liveText: {
    fontSize: tokens.typography.fontSm,
    fontWeight: '700',
  },
  latencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: tokens.colors.background,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 3,
    borderRadius: tokens.radii.full,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  latencyText: {
    fontSize: 11,
    fontWeight: '700',
    color: tokens.colors.status.greenText,
  },
  latencyBadgeOffline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFECEC',
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 3,
    borderRadius: tokens.radii.full,
    borderWidth: 1,
    borderColor: '#F2B8B5',
  },
  latencyTextOffline: {
    fontSize: 11,
    fontWeight: '700',
    color: tokens.colors.status.redText,
  },
});
