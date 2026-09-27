import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';

interface LoginCtaSectionProps {
  onIniciarTurno: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function LoginCtaSection({
  onIniciarTurno,
  isLoading,
  disabled = false,
}: LoginCtaSectionProps) {
  return (
    <View style={styles.container}>
      {/* Botão Primário CTA */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onIniciarTurno}
        disabled={disabled || isLoading}
        style={[styles.ctaButton, (disabled || isLoading) && styles.ctaButtonDisabled]}
      >
        {isLoading ? (
          <ActivityIndicator color={tokens.colors.white} />
        ) : (
          <View style={styles.ctaContent}>
            <ThemedText style={styles.ctaIcon}>➔</ThemedText>
            <ThemedText variant="body" style={styles.ctaText}>
              Iniciar Turno &amp; Abrir Balcão
            </ThemedText>
          </View>
        )}
      </TouchableOpacity>

      {/* Nota Operacional / Gaveta */}
      <View style={styles.infoRow}>
        <ThemedText style={styles.shieldIcon}>🛡️</ThemedText>
        <ThemedText variant="caption" color={tokens.colors.status.greenText} style={styles.infoText}>
          Registra início de jornada e vincula gaveta de dinheiro
        </ThemedText>
      </View>

      {/* Badge de Segurança RLS Multi-Tenant */}
      <View style={styles.rlsBadge}>
        <ThemedText style={styles.lockIcon}>🔒</ThemedText>
        <ThemedText variant="caption" style={styles.rlsText}>
          RLS Isolamento Multi-tenant Ativo • Criptografado
        </ThemedText>
      </View>

      {/* Metadados de Versão */}
      <ThemedText variant="caption" color={tokens.colors.textMuted} style={styles.metadataText}>
        v2.4.0-prod (Build 942) • FATEC DSM • GastroPDV Cloud
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: tokens.spacing.md,
    marginTop: tokens.spacing.xs,
    marginBottom: tokens.spacing.xl,
    alignItems: 'center',
  },
  ctaButton: {
    width: '100%',
    height: 56,
    borderRadius: 24,
    backgroundColor: tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: tokens.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: tokens.spacing.sm,
  },
  ctaButtonDisabled: {
    opacity: 0.6,
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs + 2,
  },
  ctaIcon: {
    color: tokens.colors.white,
    fontSize: 18,
    fontWeight: '800',
  },
  ctaText: {
    color: tokens.colors.white,
    fontWeight: '800',
    fontSize: tokens.typography.fontMd,
    letterSpacing: 0.3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: tokens.spacing.sm,
  },
  shieldIcon: {
    fontSize: 13,
  },
  infoText: {
    fontWeight: '700',
    fontSize: 11,
  },
  rlsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F3F4',
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 4,
    borderRadius: tokens.radii.full,
    gap: 6,
    marginBottom: tokens.spacing.md,
  },
  lockIcon: {
    fontSize: 11,
  },
  rlsText: {
    color: tokens.colors.textSecondary,
    fontWeight: '600',
    fontSize: 11,
  },
  metadataText: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
});
