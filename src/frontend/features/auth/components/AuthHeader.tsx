import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { createShadow } from '@/shared/utils/shadows';

export function AuthHeader() {
  return (
    <View style={styles.container}>
      {/* Barra de Status Funcional do Sistema */}
      <View style={styles.topStatusRow}>
        <View style={styles.statusBadge}>
          <View style={styles.greenPulseDot} />
          <ThemedText variant="caption" style={styles.statusBadgeText}>
            Sistema Online
          </ThemedText>
        </View>

        <View style={styles.secureBadge}>
          <Ionicons name="shield-checkmark-outline" size={14} color={tokens.colors.textMuted} />
          <ThemedText variant="caption" color={tokens.colors.textMuted} style={styles.secureText}>
            Conexão Segura
          </ThemedText>
        </View>
      </View>

      {/* Ícone da Marca */}
      <View style={styles.logoContainer}>
        <View style={styles.logoBox}>
          <Ionicons name="restaurant" size={32} color={tokens.colors.white} />
        </View>
      </View>

      {/* Título Oficial do Produto */}
      <ThemedText variant="title" style={styles.brandTitle}>
        Restaurante Inteligente
      </ThemedText>

      {/* Subtítulo Corporativo */}
      <ThemedText variant="caption" color={tokens.colors.textMuted} style={styles.subtitle}>
        Painel Executivo de Gestão &amp; Decisão
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.sm,
    paddingBottom: tokens.spacing.lg,
  },
  topStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: tokens.spacing.lg,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.status.greenBg,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 4,
    borderRadius: tokens.radii.full,
    gap: 6,
  },
  greenPulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: tokens.colors.status.greenText,
  },
  statusBadgeText: {
    color: tokens.colors.status.greenText,
    fontWeight: '700',
    fontSize: tokens.typography.fontXs,
    letterSpacing: 0.2,
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  secureText: {
    fontSize: tokens.typography.fontXs,
    fontWeight: '600',
  },
  logoContainer: {
    marginBottom: tokens.spacing.md,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: tokens.radii.lg,
    backgroundColor: tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow({
      color: tokens.colors.primary,
      offsetY: 4,
      radius: 8,
      opacity: 0.3,
      elevation: 4,
    }),
  },
  brandTitle: {
    fontSize: tokens.typography.fontXxl,
    fontWeight: '800',
    color: tokens.colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: tokens.typography.fontSm,
    fontWeight: '500',
  },
});
