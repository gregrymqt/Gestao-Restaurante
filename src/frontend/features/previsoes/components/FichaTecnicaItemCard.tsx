import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AlertTriangle, AlertCircle, Check } from 'lucide-react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import {
  formatarQuantidade,
  formatarPorcaoGastronomica,
  formatarMoeda,
} from '@/shared/utils/formatters';
import { FichaTecnicaIngrediente } from '../types';

interface FichaTecnicaItemCardProps {
  ing: FichaTecnicaIngrediente;
}

export function FichaTecnicaItemCard({ ing }: FichaTecnicaItemCardProps) {
  const custoProporcional =
    ing.custoUnitarioPorcao ??
    (ing.custoUnitario ? ing.quantidadePorPorcao * ing.custoUnitario : 0);

  return (
    <View
      style={[
        styles.ingredienteCard,
        ing.isGargalo && styles.ingredienteCardGargalo,
      ]}
    >
      <View style={styles.ingredienteHeader}>
        <ThemedText variant="body" style={styles.ingredienteNome}>
          {ing.nomeInsumo}
        </ThemedText>

        <View
          style={[
            styles.badge,
            ing.isGargalo ? styles.badgeGargalo : styles.badgeOk,
          ]}
        >
          {ing.isGargalo ? (
            <View style={styles.badgeInner}>
              <AlertTriangle size={11} color={tokens.colors.status.redText} />
              <ThemedText variant="caption" style={[styles.badgeText, styles.badgeTextGargalo]}>
                GARGALO LIMITANTE
              </ThemedText>
            </View>
          ) : (
            <View style={styles.badgeInner}>
              <Check size={11} color={tokens.colors.status.greenText} />
              <ThemedText variant="caption" style={[styles.badgeText, styles.badgeTextOk]}>
                OK
              </ThemedText>
            </View>
          )}
        </View>
      </View>

      <View style={styles.specsGrid}>
        <View style={styles.specItem}>
          <ThemedText variant="caption" color={tokens.colors.textMuted}>
            Por Porção
          </ThemedText>
          <ThemedText variant="body" style={styles.specValor}>
            {formatarPorcaoGastronomica(ing.quantidadePorPorcao, ing.unidadeMedida)}
          </ThemedText>
        </View>

        <View style={styles.specItem}>
          <ThemedText variant="caption" color={tokens.colors.textMuted}>
            Estoque Atual
          </ThemedText>
          <ThemedText
            variant="body"
            style={[styles.specValor, ing.isGargalo && styles.specValorAlerta]}
          >
            {formatarQuantidade(ing.estoqueAtual, ing.unidadeMedida)}
          </ThemedText>
        </View>

        <View style={styles.specItem}>
          <ThemedText variant="caption" color={tokens.colors.textMuted}>
            Teto Produção
          </ThemedText>
          <ThemedText
            variant="body"
            style={[styles.specValor, ing.isGargalo && styles.specValorAlerta]}
          >
            {formatarQuantidade(ing.capacidadeMaxItem, 'un')}
          </ThemedText>
        </View>

        <View style={styles.specItem}>
          <ThemedText variant="caption" color={tokens.colors.textMuted}>
            Custo / Porção
          </ThemedText>
          <ThemedText variant="body" style={styles.specValor}>
            {formatarMoeda(custoProporcional)}
          </ThemedText>
        </View>
      </View>

      {ing.isGargalo && (
        <View style={styles.calloutGargalo}>
          <AlertCircle size={14} color={tokens.colors.status.redText} />
          <ThemedText variant="caption" style={styles.calloutGargaloText}>
            Este insumo limita a produção a {ing.capacidadeMaxItem} un. Faltam ~{formatarQuantidade(Math.max(0, ing.estoqueNecessario - ing.estoqueAtual), ing.unidadeMedida)} para cobrir a demanda prevista.
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ingredienteCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.sm,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    marginBottom: tokens.spacing.sm,
  },
  ingredienteCardGargalo: {
    backgroundColor: '#FFF8F7',
    borderColor: '#F28B82',
    borderWidth: 1.5,
  },
  ingredienteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.xs,
  },
  ingredienteNome: {
    fontWeight: '700',
    color: tokens.colors.textPrimary,
    flex: 1,
  },
  badge: {
    paddingHorizontal: tokens.spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: tokens.radii.sm,
  },
  badgeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  badgeGargalo: {
    backgroundColor: tokens.colors.status.redBg,
  },
  badgeOk: {
    backgroundColor: tokens.colors.status.greenBg,
  },
  badgeText: {
    fontWeight: '800',
    fontSize: 10,
  },
  badgeTextGargalo: {
    color: tokens.colors.status.redText,
  },
  badgeTextOk: {
    color: tokens.colors.status.greenText,
  },
  specsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: tokens.spacing.xs,
    paddingTop: tokens.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F4',
  },
  specItem: {
    flex: 1,
    alignItems: 'center',
  },
  specValor: {
    fontWeight: '700',
    color: tokens.colors.textPrimary,
    marginTop: 2,
    fontSize: tokens.typography.fontSm,
  },
  specValorAlerta: {
    color: tokens.colors.status.redText,
    fontWeight: '800',
  },
  calloutGargalo: {
    marginTop: tokens.spacing.xs,
    backgroundColor: tokens.colors.status.redBg,
    padding: tokens.spacing.xs,
    borderRadius: tokens.radii.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  calloutGargaloText: {
    flex: 1,
    color: tokens.colors.status.redText,
    fontWeight: '600',
    fontSize: 11,
    lineHeight: 16,
  },
});
