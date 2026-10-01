import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { createShadow } from '@/shared/utils/shadows';

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
        accessibilityRole="button"
        accessibilityLabel="Acessar painel do restaurante"
      >
        {isLoading ? (
          <ActivityIndicator color={tokens.colors.white} />
        ) : (
          <View style={styles.ctaContent}>
            <ThemedText variant="body" weight="bold" style={styles.ctaText}>
              Acessar Painel
            </ThemedText>
            <Ionicons name="arrow-forward" size={18} color={tokens.colors.white} />
          </View>
        )}
      </TouchableOpacity>

      {/* Indicador de Segurança Corporativa */}
      <View style={styles.securityBadge}>
        <Ionicons name="shield-checkmark" size={14} color={tokens.colors.status.greenText} />
        <ThemedText variant="caption" style={styles.securityText}>
          Ambiente Seguro • Criptografia de Ponta a Ponta
        </ThemedText>
      </View>

      {/* Rodapé Institucional */}
      <ThemedText variant="caption" color={tokens.colors.textMuted} style={styles.metadataText}>
        Restaurante Inteligente Cloud • Plataforma de Gestão
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: tokens.spacing.lg,
    marginTop: tokens.spacing.xs,
    marginBottom: tokens.spacing.md,
    alignItems: 'center',
  },
  ctaButton: {
    width: '100%',
    height: 52,
    backgroundColor: tokens.colors.primary,
    borderRadius: tokens.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow({
      color: tokens.colors.primary,
      offsetY: 4,
      radius: 6,
      opacity: 0.25,
      elevation: 3,
    }),
  },
  ctaButtonDisabled: {
    backgroundColor: tokens.colors.border,
    elevation: 0,
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  ctaText: {
    color: tokens.colors.white,
    fontSize: tokens.typography.fontMd,
    letterSpacing: 0.3,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: tokens.spacing.md,
    marginBottom: tokens.spacing.xs,
  },
  securityText: {
    color: tokens.colors.status.greenText,
    fontSize: tokens.typography.fontXs,
    fontWeight: '600',
  },
  metadataText: {
    fontSize: 11,
  },
});
