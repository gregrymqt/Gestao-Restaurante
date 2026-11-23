import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ChevronUp } from 'lucide-react-native';
import { tokens } from '@/components/primitives/tokens';
import { ThemedText } from '@/components/primitives/ThemedText';
import { shadows } from '@/shared/utils/shadows';

interface BarraFlutuanteCheckoutProps {
  totalItens: number;
  subtotalFormatado: string;
  aoCobrar: () => void;
  aoRevisar?: () => void;
}

export function BarraFlutuanteCheckout({
  totalItens,
  subtotalFormatado,
  aoCobrar,
  aoRevisar,
}: BarraFlutuanteCheckoutProps) {
  const isVazio = totalItens === 0;

  return (
    <View style={styles.floatingWrapper}>
      <View style={styles.bar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Revisar itens da comanda"
          disabled={isVazio}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={({ pressed }) => [
            styles.infoSection,
            pressed && !isVazio && styles.infoSectionPressionado,
          ]}
          onPress={aoRevisar}
        >
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
            <View style={styles.subtotalHeaderRow}>
              <ThemedText variant="caption" style={styles.labelSubtotal}>
                Subtotal da Comanda
              </ThemedText>
              {!isVazio && <ChevronUp size={13} color="#CAC4D0" />}
            </View>
            <ThemedText variant="subtitle" style={styles.valorSubtotal}>
              {subtotalFormatado}
            </ThemedText>
          </View>
        </Pressable>

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
            color={isVazio ? '#A8A2AE' : tokens.colors.white}
            style={[styles.textoCobrar, isVazio && styles.textoCobrarDesabilitado]}
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
  infoSectionPressionado: {
    opacity: 0.75,
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
  subtotalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    opacity: 1,
    backgroundColor: '#353338',
    borderWidth: 1,
    borderColor: '#4A4650',
  },
  textoCobrar: {
    fontSize: tokens.typography.fontMd,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  textoCobrarDesabilitado: {
    color: '#A8A2AE',
  },
  botaoCobrarPressionado: {
    opacity: 0.85,
    backgroundColor: tokens.colors.primaryDark,
  },
});
