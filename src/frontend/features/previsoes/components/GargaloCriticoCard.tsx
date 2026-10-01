import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { formatarMoeda } from '@/shared/utils/formatters';
import { ItemCapacidadeProducao } from '../types';

interface GargaloCriticoCardProps {
  gargalo: ItemCapacidadeProducao | null;
  perdaTotal: number;
  onSugerirPedido: (insumoId?: string) => void;
}

export function GargaloCriticoCard({
  gargalo,
  perdaTotal,
  onSugerirPedido,
}: GargaloCriticoCardProps) {
  if (!gargalo) {
    return (
      <View style={styles.cardSucesso}>
        <View style={styles.headerRow}>
          <ThemedText variant="body" style={styles.sucessoBadge}>
            ✓ CAPACIDADE 100% ATENDIDA
          </ThemedText>
        </View>
        <ThemedText variant="body" color={tokens.colors.status.greenText} style={styles.sucessoTexto}>
          Estoque perfeitamente equilibrado para toda a demanda projetada. Sem gargalos detectados!
        </ThemedText>
      </View>
    );
  }

  const percentualImpacto =
    gargalo.demandaPrevista > 0
      ? Math.round(
          ((gargalo.demandaPrevista - gargalo.demandaAtendivel) / gargalo.demandaPrevista) * 100
        )
      : 0;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.alertTitleBadge}>
          <ThemedText style={styles.warningIcon}>⚠️</ThemedText>
          <ThemedText variant="body" style={styles.headerTitle}>
            Gargalo Crítico
          </ThemedText>
        </View>

        <View style={styles.impactBadge}>
          <ThemedText variant="caption" style={styles.impactBadgeText}>
            -{percentualImpacto}% pedidos
          </ThemedText>
        </View>
      </View>

      <View style={styles.insumoSection}>
        <ThemedText variant="body" style={styles.insumoLabel}>
          Insumo limitante:{' '}
          <ThemedText variant="body" style={styles.insumoNome}>
            {gargalo.insumoGargaloNome}
          </ThemedText>
        </ThemedText>
        <ThemedText variant="caption" style={styles.deficitText}>
          Déficit de {Math.round(gargalo.deficitUnidades)} un em {gargalo.nomeProduto}
        </ThemedText>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
          <ThemedText variant="caption" color={tokens.colors.textMuted}>
            Demanda Prevista
          </ThemedText>
          <ThemedText variant="title" style={styles.metricValorDemanda}>
            {Math.round(gargalo.demandaPrevista)} un
          </ThemedText>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <ThemedText variant="caption" color={tokens.colors.textMuted}>
            Capacidade Atual
          </ThemedText>
          <ThemedText variant="title" style={styles.metricValorCapacidade}>
            {Math.round(gargalo.capacidadeMaximaProducao)} un
          </ThemedText>
        </View>
      </View>

      <View style={styles.perdaWarningBox}>
        <ThemedText variant="caption" style={styles.perdaWarningText}>
          ⚠️ Estimativa de {formatarMoeda(perdaTotal)} em vendas perdidas
        </ThemedText>
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => onSugerirPedido(gargalo.insumoGargaloId)}
        style={styles.actionButton}
      >
        <ThemedText variant="body" style={styles.actionButtonText}>
          🛒 Sugerir Pedido (+9.0 kg)
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
    backgroundColor: '#FFF8F7',
    borderRadius: tokens.radii.lg,
    borderWidth: 1.5,
    borderColor: '#F28B82',
    padding: tokens.spacing.md,
  },
  cardSucesso: {
    marginHorizontal: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
    backgroundColor: tokens.colors.status.greenBg,
    borderRadius: tokens.radii.lg,
    borderWidth: 1,
    borderColor: '#A8DAB5',
    padding: tokens.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.sm,
  },
  alertTitleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  warningIcon: {
    fontSize: 16,
  },
  headerTitle: {
    fontWeight: '800',
    color: tokens.colors.status.redText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: tokens.typography.fontSm,
  },
  impactBadge: {
    backgroundColor: tokens.colors.status.redText,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 3,
    borderRadius: tokens.radii.full,
  },
  impactBadgeText: {
    color: tokens.colors.white,
    fontWeight: '800',
    fontSize: tokens.typography.fontXs,
  },
  sucessoBadge: {
    fontWeight: '800',
    color: tokens.colors.status.greenText,
  },
  sucessoTexto: {
    fontWeight: '600',
    marginTop: 4,
  },
  insumoSection: {
    marginBottom: tokens.spacing.sm,
  },
  insumoLabel: {
    fontSize: tokens.typography.fontSm,
    color: tokens.colors.textPrimary,
  },
  insumoNome: {
    fontWeight: '800',
    color: tokens.colors.status.redText,
  },
  deficitText: {
    color: tokens.colors.textMuted,
    marginTop: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.sm,
    borderWidth: 1,
    borderColor: '#FCE8E6',
    marginBottom: tokens.spacing.sm,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    backgroundColor: tokens.colors.border,
    marginVertical: 4,
  },
  metricValorDemanda: {
    fontSize: tokens.typography.fontXl,
    fontWeight: '800',
    color: tokens.colors.textPrimary,
    marginTop: 2,
  },
  metricValorCapacidade: {
    fontSize: tokens.typography.fontXl,
    fontWeight: '800',
    color: tokens.colors.status.redText,
    marginTop: 2,
  },
  perdaWarningBox: {
    backgroundColor: '#FCE8E6',
    paddingVertical: tokens.spacing.xs,
    paddingHorizontal: tokens.spacing.sm,
    borderRadius: tokens.radii.sm,
    marginBottom: tokens.spacing.md,
    alignItems: 'center',
  },
  perdaWarningText: {
    color: tokens.colors.status.redText,
    fontWeight: '700',
    fontSize: tokens.typography.fontXs,
  },
  actionButton: {
    backgroundColor: tokens.colors.status.redText,
    paddingVertical: tokens.spacing.sm + 2,
    borderRadius: tokens.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  actionButtonText: {
    color: tokens.colors.white,
    fontWeight: '800',
    fontSize: tokens.typography.fontMd,
  },
});
