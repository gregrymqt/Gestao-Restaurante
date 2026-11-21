import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import {
  ShieldCheck,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  TrendingDown,
  Truck,
} from 'lucide-react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { formatarQuantidade } from '@/shared/utils/formatters';
import { InsumoEstoque } from '../types';

interface InsumoSaldoCardProps {
  item: InsumoEstoque;
  onRegistrarEntrada: (insumo: InsumoEstoque) => void;
  onRegistrarBaixa: (insumo: InsumoEstoque) => void;
}

export function InsumoSaldoCard({
  item,
  onRegistrarEntrada,
  onRegistrarBaixa,
}: InsumoSaldoCardProps) {
  const isCritico = item.statusNivel === 'critico';
  const isAtencao = item.statusNivel === 'atencao';
  const isZerado = item.saldoAtual <= 0;

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
    ? 'Abaixo do Mínimo'
    : isAtencao
    ? 'Ponto de Pedido'
    : 'Estoque Seguro';

  const percentualBarra = Math.min(Math.max(item.percentualCapacidade, 5), 100);

  return (
    <View style={[styles.card, { borderLeftColor: statusColor }]}>
      <View style={styles.headerRow}>
        <View style={styles.titleInfo}>
          <ThemedText variant="body" style={styles.nomeInsumo}>
            {item.nome}
          </ThemedText>
          <ThemedText variant="caption" color={tokens.colors.textMuted} style={styles.localizacao}>
            {item.localizacao || 'Estoque'} • SKU {item.sku}
          </ThemedText>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
          {isCritico || isAtencao ? (
            <AlertTriangle size={13} color={statusColor} style={styles.statusBadgeIcon} />
          ) : (
            <ShieldCheck size={13} color={statusColor} style={styles.statusBadgeIcon} />
          )}
          <ThemedText variant="caption" style={[styles.statusBadgeText, { color: statusColor }]}>
            {badgeTexto}
          </ThemedText>
        </View>
      </View>

      <View style={styles.saldoRow}>
        <ThemedText variant="title" style={styles.saldoAtual}>
          {formatarQuantidade(item.saldoAtual, item.unidadeMedida)}{' '}
          <ThemedText variant="body" color={tokens.colors.textMuted}>
            atual
          </ThemedText>
        </ThemedText>

        <ThemedText variant="caption" color={tokens.colors.textMuted} style={styles.estoqueMinimo}>
          Mínimo: {formatarQuantidade(item.estoqueMinimo, item.unidadeMedida)}
        </ThemedText>
      </View>

      <View style={styles.progressBarTrack}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${percentualBarra}%`, backgroundColor: statusColor },
          ]}
        />
      </View>

      <View style={styles.contextInfoRow}>
        {item.deficitQuantidade !== undefined && item.deficitQuantidade > 0 ? (
          <View style={styles.contextItem}>
            <TrendingDown size={13} color={tokens.colors.status.redText} />
            <ThemedText variant="caption" style={styles.deficitText}>
              Déficit: {formatarQuantidade(item.deficitQuantidade, item.unidadeMedida)} (-{item.deficitPercentual || 35}%)
            </ThemedText>
          </View>
        ) : item.leadTimeHoras ? (
          <View style={styles.contextItem}>
            <Truck size={13} color={tokens.colors.textMuted} />
            <ThemedText variant="caption" style={styles.leadTimeText}>
              Lead Time Fornecedor: {item.leadTimeHoras}h
            </ThemedText>
          </View>
        ) : item.observacaoConsumo ? (
          <View style={styles.contextItem}>
            <ShieldCheck size={13} color={tokens.colors.status.greenText} />
            <ThemedText variant="caption" style={styles.seguroText}>
              {item.observacaoConsumo}
            </ThemedText>
          </View>
        ) : null}
      </View>

      <View style={styles.botoesGrid}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onRegistrarBaixa(item)}
          disabled={isZerado}
          style={[styles.baixaButton, isZerado && styles.baixaButtonDisabled]}
          accessibilityRole="button"
          accessibilityLabel={`Ajuste ou baixa para ${item.nome}`}
          accessibilityState={{ disabled: isZerado }}
        >
          <ArrowDownRight
            size={16}
            color={isZerado ? tokens.colors.textMuted : tokens.colors.status.redText}
            style={styles.btnIcon}
          />
          <ThemedText
            variant="caption"
            style={[styles.baixaButtonText, isZerado && styles.baixaButtonTextDisabled]}
          >
            Ajuste / Baixa
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onRegistrarEntrada(item)}
          style={[styles.entradaButton, isCritico && styles.entradaButtonCritico]}
          accessibilityRole="button"
          accessibilityLabel={`Registrar entrada para ${item.nome}`}
        >
          <ArrowUpRight
            size={16}
            color={isCritico ? tokens.colors.white : tokens.colors.status.greenText}
            style={styles.btnIcon}
          />
          <ThemedText
            variant="caption"
            style={[styles.entradaButtonText, isCritico && styles.entradaButtonTextCritico]}
          >
            + Entrada
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: tokens.colors.card, borderRadius: tokens.radii.md, padding: tokens.spacing.md, borderLeftWidth: 4, borderWidth: 1, borderColor: tokens.colors.border, marginBottom: tokens.spacing.sm },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: tokens.spacing.xs },
  titleInfo: { flex: 1, marginRight: tokens.spacing.sm },
  nomeInsumo: { fontWeight: '700', color: tokens.colors.textPrimary },
  localizacao: { marginTop: 2, fontSize: 11 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: tokens.radii.full },
  statusBadgeIcon: { marginRight: 4 },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },
  saldoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4, marginBottom: 6 },
  saldoAtual: { fontSize: 22, fontWeight: '800', color: tokens.colors.textPrimary },
  estoqueMinimo: { fontSize: 11 },
  progressBarTrack: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden', marginBottom: tokens.spacing.xs },
  progressBarFill: { height: '100%', borderRadius: 3 },
  contextInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: tokens.spacing.sm, minHeight: 18 },
  contextItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  deficitText: { color: tokens.colors.status.redText, fontWeight: '700', fontSize: 11 },
  leadTimeText: { color: tokens.colors.textSecondary, fontSize: 11 },
  seguroText: { color: tokens.colors.status.greenText, fontWeight: '600', fontSize: 11 },
  botoesGrid: { flexDirection: 'row', gap: tokens.spacing.sm, width: '100%' },
  baixaButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: 44, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: tokens.radii.sm, paddingHorizontal: 8 },
  baixaButtonDisabled: { opacity: 0.38, backgroundColor: '#F3F4F6', borderColor: tokens.colors.border },
  baixaButtonText: { color: tokens.colors.status.redText, fontWeight: '700', fontSize: 12 },
  baixaButtonTextDisabled: { color: tokens.colors.textMuted },
  entradaButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: 44, backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0', borderRadius: tokens.radii.sm, paddingHorizontal: 8 },
  entradaButtonCritico: { backgroundColor: tokens.colors.primary, borderColor: tokens.colors.primary },
  entradaButtonText: { color: tokens.colors.status.greenText, fontWeight: '700', fontSize: 12 },
  entradaButtonTextCritico: { color: tokens.colors.white },
  btnIcon: { marginRight: 4 },
});
