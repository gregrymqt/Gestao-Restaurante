import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { tokens } from '@/components/primitives/tokens';
import { ThemedText } from '@/components/primitives/ThemedText';
import { shadows } from '@/shared/utils/shadows';

interface BarraFlutuanteCheckoutProps {
  totalItens: number;
  subtotalFormatado: string;
  aoCobrar: () => void;
}

export function BarraFlutuanteCheckout({
  totalItens,
  subtotalFormatado,
  aoCobrar,
}: BarraFlutuanteCheckoutProps) {
  const isVazio = totalItens === 0;

  return (
    <View style={styles.floatingWrapper}>
      <View style={styles.bar}>
        <View style={styles.infoSection}>
          <View style={styles.badgeItens}>
            <ThemedText
              variant="caption"
              weight="bold"
              color={tokens.colors.white}
            >
              {totalItens}
            </ThemedText>
          </View>

          <View style={styles.valoresCol}>
            <ThemedText variant="caption" style={styles.labelSubtotal}>
              Subtotal da Comanda
            </ThemedText>
            <ThemedText variant="subtitle" style={styles.valorSubtotal}>
              {subtotalFormatado}
            </ThemedText>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Cobrar pedido no valor de ${subtotalFormatado}`}
          accessibilityState={{ disabled: isVazio }}
          disabled={isVazio}
          style={({ pressed }) => [
            styles.botaoCobrar,
            isVazio && styles.botaoCobrarDesabilitado,
            pressed && !isVazio && styles.botaoCobrarPressionado,
          ]}
          onPress={aoCobrar}
        >
          <ThemedText
            variant="subtitle"
            weight="bold"
            color={tokens.colors.white}
            style={styles.textoCobrar}
          >
            Cobrar →
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    bottom: tokens.spacing.lg,
    left: tokens.spacing.lg,
    right: tokens.spacing.lg,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: tokens.colors.textPrimary,
    borderRadius: tokens.radii.lg,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    ...shadows.lg,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
  },
  badgeItens: {
    width: 32,
    height: 32,
    borderRadius: tokens.radii.full,
    backgroundColor: tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valoresCol: {
    flexDirection: 'column',
  },
  labelSubtotal: {
    color: '#CAC4D0',
    fontSize: tokens.typography.fontXs,
  },
  valorSubtotal: {
    color: tokens.colors.white,
    fontSize: tokens.typography.fontLg,
    fontWeight: '700',
  },
  botaoCobrar: {
    height: 48,
    paddingHorizontal: tokens.spacing.xl,
    borderRadius: tokens.radii.md,
    backgroundColor: tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoCobrarDesabilitado: {
    opacity: 0.45,
    backgroundColor: tokens.colors.textMuted,
  },
  botaoCobrarPressionado: {
    opacity: 0.85,
    backgroundColor: tokens.colors.primaryDark,
  },
  textoCobrar: {
    fontSize: tokens.typography.fontMd,
    fontWeight: '700',
  },
});
