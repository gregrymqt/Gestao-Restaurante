import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { shadows } from '@/shared/utils/shadows';
import { InsumoEstoque } from '../types';

interface InsumoSaldoCardProps {
  item: InsumoEstoque;
  onRegistrarEntrada: (insumo: InsumoEstoque) => void;
}

export function InsumoSaldoCard({
  item,
  onRegistrarEntrada,
}: InsumoSaldoCardProps) {
  const isCritico = item.statusNivel === 'critico';
  const isAtencao = item.statusNivel === 'atencao';
  const isNormal = item.statusNivel === 'normal';

  // Configuração semântica de cores
  const statusColor = isCritico
    ? tokens.colors.status.redText
    : isAtencao
    ? tokens.colors.status.orangeText
    : tokens.colors.status.greenText;

  const statusBg = isCritico
    ? tokens.colors.status.redBg
    : isAtencao
    ? tokens.colors.status.orangeBg
    : tokens.colors.status.greenBg;

  const badgeTexto = isCritico
    ? '⚠️ Abaixo do Mínimo'
    : isAtencao
    ? '⏰ Ponto de Pedido'
    : '🛡️ Estoque Seguro';

  const percentualBarra = Math.min(Math.max(item.percentualCapacidade, 5), 100);

  return (
    <View style={[styles.card, { borderLeftColor: statusColor }]}>
      {/* Header do Card com Nome e Badge de Status */}
      <View style={styles.headerRow}>
        <View style={styles.titleInfo}>
          <ThemedText variant="body" style={styles.nomeInsumo}>
            {item.nome}
          </ThemedText>
          <ThemedText variant="caption" color={tokens.colors.textMuted} style={styles.localizacao}>
            {item.localizacao} • SKU {item.sku}
          </ThemedText>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
          <ThemedText variant="caption" style={[styles.statusBadgeText, { color: statusColor }]}>
            {badgeTexto}
          </ThemedText>
        </View>
      </View>

      {/* Métricas de Saldo e Limites */}
      <View style={styles.saldoRow}>
        <ThemedText variant="title" style={styles.saldoAtual}>
          {item.saldoAtual.toFixed(item.unidadeMedida === 'unid' ? 0 : 3)}{' '}
          <ThemedText variant="body" color={tokens.colors.textMuted}>
            {item.unidadeMedida} atual
          </ThemedText>
        </ThemedText>

        <ThemedText variant="caption" color={tokens.colors.textMuted} style={styles.estoqueMinimo}>
          Mínimo: {item.estoqueMinimo.toFixed(item.unidadeMedida === 'unid' ? 0 : 3)} {item.unidadeMedida}
        </ThemedText>
      </View>

      {/* Barra Horizontal de Nível Proporcional */}
      <View style={styles.progressBarTrack}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${percentualBarra}%`, backgroundColor: statusColor },
          ]}
        />
      </View>

      {/* Rodapé: Contexto Operacional + Botão Entrada (+) */}
      <View style={styles.footerRow}>
        <View style={styles.contextInfo}>
          {item.deficitQuantidade !== undefined && item.deficitQuantidade > 0 ? (
            <ThemedText variant="caption" style={styles.deficitText}>
              📉 Déficit: {item.deficitQuantidade.toFixed(1)} {item.unidadeMedida} (-{item.deficitPercentual || 35}%)
            </ThemedText>
          ) : item.leadTimeHoras ? (
            <ThemedText variant="caption" style={styles.leadTimeText}>
              🚚 Lead Time Fornecedor: {item.leadTimeHoras}h
            </ThemedText>
          ) : item.observacaoConsumo ? (
            <ThemedText variant="caption" style={styles.seguroText}>
              🛡️ {item.observacaoConsumo}
            </ThemedText>
          ) : (
            <ThemedText variant="caption" color={tokens.colors.textMuted}>
              Estoque monitorado pelo Ledger
            </ThemedText>
          )}
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onRegistrarEntrada(item)}
          style={[styles.entradaButton, isCritico && styles.entradaButtonCritico]}
        >
          <ThemedText
            variant="caption"
            style={[styles.entradaButtonText, isCritico && styles.entradaButtonTextCritico]}
          >
            {isCritico ? '📦 Entrada (+)' : '+ Entrada'}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radii.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderLeftWidth: 4,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.sm,
    ...shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.xs,
  },
  titleInfo: {
    flex: 1,
    marginRight: tokens.spacing.xs,
  },
  nomeInsumo: {
    fontWeight: '800',
    color: tokens.colors.textPrimary,
  },
  localizacao: {
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: tokens.spacing.xs + 2,
    paddingVertical: 3,
    borderRadius: tokens.radii.sm,
  },
  statusBadgeText: {
    fontWeight: '800',
    fontSize: tokens.typography.fontXs,
  },
  saldoRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: tokens.spacing.xs,
    marginBottom: 6,
  },
  saldoAtual: {
    fontSize: tokens.typography.fontXl,
    fontWeight: '800',
    color: tokens.colors.textPrimary,
  },
  estoqueMinimo: {
    fontWeight: '600',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#E9ECEF',
    borderRadius: tokens.radii.full,
    overflow: 'hidden',
    marginBottom: tokens.spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: tokens.radii.full,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  contextInfo: {
    flex: 1,
    marginRight: tokens.spacing.xs,
  },
  deficitText: {
    color: tokens.colors.status.redText,
    fontWeight: '700',
  },
  leadTimeText: {
    color: tokens.colors.status.orangeText,
    fontWeight: '700',
  },
  seguroText: {
    color: tokens.colors.status.greenText,
    fontWeight: '600',
  },
  entradaButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: tokens.colors.border,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 6,
    borderRadius: tokens.radii.sm,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entradaButtonCritico: {
    backgroundColor: tokens.colors.status.redBg,
    borderColor: '#F28B82',
  },
  entradaButtonText: {
    color: tokens.colors.textPrimary,
    fontWeight: '700',
    fontSize: tokens.typography.fontXs,
  },
  entradaButtonTextCritico: {
    color: tokens.colors.status.redText,
  },
});
