import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { AssinaturaStatus } from '../types';

interface TrialBadgeHeaderProps {
  assinatura: AssinaturaStatus;
  onOpenPaywall: () => void;
}

export function TrialBadgeHeader({ assinatura, onOpenPaywall }: TrialBadgeHeaderProps) {
  const isTrial = assinatura.status === 'TRIAL';
  const dias = assinatura.diasRestantesTrial;
  const isExpirando = isTrial && dias <= 3;

  if (!isTrial && assinatura.status === 'ATIVA') {
    return (
      <View style={styles.containerAtivo}>
        <ThemedText style={styles.icone}>⭐</ThemedText>
        <ThemedText variant="caption" weight="bold" color={tokens.colors.status.greenText}>
          {assinatura.planoAtual?.nome || 'Plano Pro'} • Assinatura Ativa
        </ThemedText>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Ver opções de assinatura"
      onPress={onOpenPaywall}
      style={({ pressed }) => [
        styles.container,
        isExpirando && styles.containerAlerta,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.conteudo}>
        <ThemedText style={styles.icone}>{isExpirando ? '⏳' : '🎉'}</ThemedText>
        <View style={styles.textos}>
          <ThemedText variant="caption" weight="bold" color={isExpirando ? tokens.colors.status.redText : '#B25E00'}>
            {dias > 0
              ? `Degustação: ${dias} ${dias === 1 ? 'dia restante' : 'dias restantes'}`
              : 'Período de Teste Finalizado'}
          </ThemedText>
          <ThemedText variant="caption" style={styles.subtexto}>
            Toque para escolher seu plano SaaS
          </ThemedText>
        </View>
      </View>

      <View style={styles.botaoCta}>
        <ThemedText variant="caption" weight="bold" color={tokens.colors.white}>
          Ver Planos
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFE082',
    borderWidth: 1,
    borderRadius: tokens.radii.md,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.md,
  },
  containerAlerta: {
    backgroundColor: tokens.colors.status.redBg,
    borderColor: '#FFCDD2',
  },
  containerAtivo: {
    backgroundColor: tokens.colors.status.greenBg,
    borderColor: '#C8E6C9',
    borderWidth: 1,
    borderRadius: tokens.radii.md,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    marginBottom: tokens.spacing.md,
  },
  conteudo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    flex: 1,
  },
  icone: {
    fontSize: 18,
  },
  textos: {
    flex: 1,
  },
  subtexto: {
    fontSize: tokens.typography.fontXs,
    color: tokens.colors.textSecondary,
  },
  botaoCta: {
    backgroundColor: tokens.colors.primary,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 5,
    borderRadius: tokens.radii.sm,
  },
  pressed: {
    opacity: 0.85,
  },
});
