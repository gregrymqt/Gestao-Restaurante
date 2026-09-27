import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';

export function AuthHeader() {
  return (
    <View style={styles.container}>
      {/* Top Bar: Node & Terminal Status */}
      <View style={styles.topStatusRow}>
        <ThemedText variant="caption" color={tokens.colors.textMuted} style={styles.nodeText}>
          PDV NODE • DSM
        </ThemedText>

        <View style={styles.terminalBadge}>
          <View style={styles.greenPulseDot} />
          <ThemedText variant="caption" style={styles.terminalBadgeText}>
            TERMINAL 01 • ONLINE
          </ThemedText>
        </View>
      </View>

      {/* GastroPDV Icon Box */}
      <View style={styles.logoContainer}>
        <View style={styles.logoBox}>
          <ThemedText style={styles.logoIcon}>🧾</ThemedText>
        </View>
      </View>

      {/* Title & Version Badge */}
      <View style={styles.titleRow}>
        <ThemedText variant="title" style={styles.brandTitle}>
          GastroPDV
        </ThemedText>
        <View style={styles.versionBadge}>
          <ThemedText variant="caption" style={styles.versionText}>
            v2.4
          </ThemedText>
        </View>
      </View>

      {/* Subtitle */}
      <ThemedText variant="caption" color={tokens.colors.textMuted} style={styles.subtitle}>
        Acesso Operacional &amp; Gestão de Turno
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
    paddingTop: tokens.spacing.sm,
    paddingBottom: tokens.spacing.md,
  },
  topStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: tokens.spacing.md,
  },
  nodeText: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  terminalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.status.greenBg,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 3,
    borderRadius: tokens.radii.full,
    gap: 6,
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: tokens.colors.status.greenText,
  },
  terminalBadgeText: {
    color: tokens.colors.status.greenText,
    fontWeight: '800',
    fontSize: tokens.typography.fontXs,
    letterSpacing: 0.3,
  },
  logoContainer: {
    marginBottom: tokens.spacing.sm,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: tokens.radii.lg,
    backgroundColor: tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: tokens.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  logoIcon: {
    fontSize: 32,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  brandTitle: {
    fontSize: tokens.typography.fontXxl,
    fontWeight: '800',
    color: tokens.colors.textPrimary,
    letterSpacing: -0.5,
  },
  versionBadge: {
    backgroundColor: tokens.colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: tokens.radii.sm,
  },
  versionText: {
    color: tokens.colors.primaryDark,
    fontWeight: '800',
    fontSize: 10,
  },
  subtitle: {
    fontSize: tokens.typography.fontSm,
    marginTop: 2,
    fontWeight: '500',
  },
});
