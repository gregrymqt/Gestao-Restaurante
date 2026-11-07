import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { AssinaturaStatus } from '../types';

interface TrialBadgeHeaderProps {
  assinatura: AssinaturaStatus;
  onOpenPaywall: () => void;
  variant?: 'chip' | 'banner';
}

export function TrialBadgeHeader({
  assinatura,
  onOpenPaywall,
  variant = 'chip',
}: TrialBadgeHeaderProps) {
  const isTrial = assinatura.status === 'TRIAL';
  const dias = assinatura.diasRestantesTrial;
  const isExpirando = isTrial && dias <= 3;

  // Se a assinatura já for ativa e estivermos em modo chip, adota o silêncio operacional (sem poluição)
  if (!isTrial && assinatura.status === 'ATIVA') {
    if (variant === 'chip') return null;

    return (
      <View style={styles.containerAtivo}>
        <ThemedText style={styles.icone}>⭐</ThemedText>
        <ThemedText variant="caption" weight="bold" color={tokens.colors.status.greenText}>
          {assinatura.planoAtual?.nome || 'Plano Pro'} • Assinatura Ativa
        </ThemedText>
      </View>
    );
  }

  // Modo Micro-Chip de Alta Velocidade (Header Slim de Hospitalidade)
  if (variant === 'chip') {
    if (!isTrial) return null;

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Degustação: ${dias} dias restantes. Toque para ver planos.`}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        onPress={onOpenPaywall}
        style={({ pressed }) => [
          styles.chip,
          isExpirando && styles.chipAlerta,
          pressed && styles.pressed,
        ]}
      >
        <ThemedText style={styles.chipTextoIcone}>{isExpirando ? '⏳' : '⚡'}</ThemedText>
        <ThemedText
          variant="caption"
          weight="bold"
          style={[styles.chipTexto, isExpirando && styles.chipTextoAlerta]}
        >
          {dias > 0 ? `${dias}d` : 'Expirado'}
        </ThemedText>
      </Pressable>
    );
  }

  // Modo Banner Explicativo (Usado em Telas de Perfil / Configurações)
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
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    borderColor: '#FFE082',
    borderWidth: 1,
    borderRadius: tokens.radii.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  chipAlerta: {
    backgroundColor: tokens.colors.status.redBg,
    borderColor: '#FFCDD2',
  },
  chipTextoIcone: {
    fontSize: 12,
  },
  chipTexto: {
    fontSize: 11,
    color: '#B25E00',
  },
  chipTextoAlerta: {
    color: tokens.colors.status.redText,
  },
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
    opacity: 0.8,
  },
});
