import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';

interface PerfilHeaderProps {
  iniciais: string;
}

export function PerfilHeader({ iniciais }: PerfilHeaderProps) {
  return (
    <View style={styles.topBar}>
      <View style={styles.brandContainer}>
        <ThemedText style={styles.brandSubtitle}>GASTROBURGER POS</ThemedText>
        <ThemedText variant="title" style={styles.brandTitle}>
          Perfil do Operador
        </ThemedText>
      </View>

      <View style={styles.topBarActions}>
        <View style={styles.wifiBox}>
          <ThemedText style={styles.wifiIcon}>📶</ThemedText>
        </View>
        <View style={styles.miniAvatar}>
          <ThemedText style={styles.miniAvatarText}>{iniciais}</ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    backgroundColor: tokens.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  brandContainer: {
    flex: 1,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.primary,
    letterSpacing: 1,
  },
  brandTitle: {
    fontSize: tokens.typography.fontLg,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
    marginTop: 1,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  wifiBox: {
    width: 34,
    height: 34,
    borderRadius: tokens.radii.full,
    backgroundColor: tokens.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wifiIcon: {
    fontSize: 16,
  },
  miniAvatar: {
    width: 34,
    height: 34,
    borderRadius: tokens.radii.full,
    backgroundColor: tokens.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.primary,
  },
  miniAvatarText: {
    fontSize: 12,
    fontWeight: '800',
    color: tokens.colors.primaryDark,
  },
});
