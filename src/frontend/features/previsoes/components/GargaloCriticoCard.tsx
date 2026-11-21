import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import {
  AlertTriangle,
  AlertCircle,
  ShoppingCart,
  CheckCircle2,
  ArrowRight,
  WifiOff,
} from 'lucide-react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { formatarMoeda, formatarQuantidade } from '@/shared/utils/formatters';
import { calcularPerdaEstimada } from '../utils/previsoesHelpers';
import { ItemCapacidadeProducao, SugestaoReposicaoInsumo } from '../types';

interface GargaloCriticoCardProps {
  gargalo: ItemCapacidadeProducao | null;
  perdaTotal: number;
  sugestoesReposicao?: SugestaoReposicaoInsumo[];
  onSugerirPedido: (insumoId?: string) => void;
  onCadastrarFichaTecnica?: () => void;
  isOffline?: boolean;
}

export function GargaloCriticoCard({
  gargalo,
  perdaTotal,
  sugestoesReposicao = [],
  onSugerirPedido,
  onCadastrarFichaTecnica,
  isOffline = false,
}: GargaloCriticoCardProps) {
  if (!gargalo) {
    return (
      <View style={styles.cardSucesso}>
        <View style={styles.headerRow}>
          <View style={styles.sucessoBadgeContainer}>
            <CheckCircle2 size={16} color={tokens.colors.status.greenText} />
            <ThemedText variant="body" style={styles.sucessoBadge}>
              CAPACIDADE 100% ATENDIDA
            </ThemedText>
          </View>
        </View>
        <ThemedText variant="body" color={tokens.colors.status.greenText} style={styles.sucessoTexto}>
          Estoque perfeitamente equilibrado para toda a demanda projetada. Sem gargalos detectados!
        </ThemedText>
      </View>
    );
  }

  const isSemFichaTecnica = Boolean(
    gargalo.insumoGargaloNome?.toUpperCase().includes('SEM FICHA TÉCNICA') ||
      (!gargalo.insumoGargaloId &&
        (gargalo.capacidadeMaximaProducao === 0 || gargalo.deficitUnidades > 0) &&
        sugestoesReposicao.length === 0)
  );

  const percentualImpacto =
    gargalo.demandaPrevista > 0
      ? Math.round(
          ((gargalo.demandaPrevista - gargalo.demandaAtendivel) / gargalo.demandaPrevista) * 100
        )
      : 0;

  const perdaEfetiva = perdaTotal > 0 ? perdaTotal : calcularPerdaEstimada(gargalo);

  const sugestaoGargalo =
    sugestoesReposicao.find((s) => s.insumoId === gargalo.insumoGargaloId) ||
    sugestoesReposicao.find((s) => s.quantidadeComprar > 0);

  const qtdFormatada =
    sugestaoGargalo && sugestaoGargalo.quantidadeComprar > 0
      ? ` (+${formatarQuantidade(sugestaoGargalo.quantidadeComprar, sugestaoGargalo.unidadeMedida)})`
      : '';

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.alertTitleBadge}>
          <AlertTriangle size={16} color={tokens.colors.status.redText} />
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
        {isSemFichaTecnica ? (
          <ThemedText variant="body" style={styles.insumoSemFicha}>
            Produto sem Ficha Técnica cadastrada (impossível calcular insumos)
          </ThemedText>
        ) : (
          <ThemedText variant="body" style={styles.insumoLabel}>
            Insumo limitante:{' '}
            <ThemedText variant="body" style={styles.insumoNome}>
              {gargalo.insumoGargaloNome}
            </ThemedText>
          </ThemedText>
        )}
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
        <AlertCircle size={14} color={tokens.colors.status.redText} />
        <ThemedText variant="caption" style={styles.perdaWarningText}>
          Estimativa de {formatarMoeda(perdaEfetiva)} em vendas perdidas
        </ThemedText>
      </View>

      {isSemFichaTecnica ? (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onCadastrarFichaTecnica}
          style={styles.actionButtonFicha}
          accessibilityRole="button"
          accessibilityLabel="Cadastrar Ficha Técnica"
        >
          <ThemedText variant="body" style={styles.actionButtonText}>
            Cadastrar Ficha Técnica →
          </ThemedText>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => onSugerirPedido(gargalo.insumoGargaloId)}
          disabled={isOffline}
          style={[styles.actionButton, isOffline && styles.actionButtonDisabled]}
          accessibilityRole="button"
          accessibilityLabel={isOffline ? 'Conexão necessária' : `Sugerir Pedido${qtdFormatada}`}
        >
          {isOffline ? (
            <View style={styles.buttonInnerRow}>
              <WifiOff size={16} color="#6B7280" />
              <ThemedText variant="body" style={styles.actionButtonTextDisabled}>
                Conexão necessária
              </ThemedText>
            </View>
          ) : (
            <View style={styles.buttonInnerRow}>
              <ShoppingCart size={16} color={tokens.colors.white} />
              <ThemedText variant="body" style={styles.actionButtonText}>
                Sugerir Pedido{qtdFormatada}
              </ThemedText>
            </View>
          )}
        </TouchableOpacity>
      )}
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
  sucessoBadgeContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  alertTitleBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
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
  impactBadgeText: { color: tokens.colors.white, fontWeight: '800', fontSize: tokens.typography.fontXs },
  sucessoBadge: { fontWeight: '800', color: tokens.colors.status.greenText, fontSize: tokens.typography.fontSm },
  sucessoTexto: { fontWeight: '600', marginTop: 4 },
  insumoSection: { marginBottom: tokens.spacing.sm },
  insumoLabel: { fontSize: tokens.typography.fontSm, color: tokens.colors.textPrimary },
  insumoSemFicha: { fontSize: tokens.typography.fontSm, fontWeight: '700', color: tokens.colors.status.redText, lineHeight: 18 },
  insumoNome: { fontWeight: '800', color: tokens.colors.status.redText },
  deficitText: { color: tokens.colors.textMuted, marginTop: 2 },
  metricsGrid: {
    flexDirection: 'row',
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.sm,
    borderWidth: 1,
    borderColor: '#FCE8E6',
    marginBottom: tokens.spacing.sm,
  },
  metricItem: { flex: 1, alignItems: 'center' },
  metricDivider: { width: 1, backgroundColor: tokens.colors.border, marginVertical: 4 },
  metricValorDemanda: { fontSize: tokens.typography.fontXl, fontWeight: '800', color: tokens.colors.textPrimary, marginTop: 2 },
  metricValorCapacidade: { fontSize: tokens.typography.fontXl, fontWeight: '800', color: tokens.colors.status.redText, marginTop: 2 },
  perdaWarningBox: {
    backgroundColor: '#FCE8E6',
    paddingVertical: tokens.spacing.xs,
    paddingHorizontal: tokens.spacing.sm,
    borderRadius: tokens.radii.sm,
    marginBottom: tokens.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  perdaWarningText: { color: tokens.colors.status.redText, fontWeight: '700', fontSize: tokens.typography.fontXs },
  buttonInnerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionButton: {
    backgroundColor: tokens.colors.status.redText,
    paddingVertical: tokens.spacing.sm + 2,
    borderRadius: tokens.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  actionButtonFicha: {
    backgroundColor: '#111827',
    paddingVertical: tokens.spacing.sm + 2,
    borderRadius: tokens.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  actionButtonDisabled: { backgroundColor: '#E5E7EB' },
  actionButtonText: { color: tokens.colors.white, fontWeight: '800', fontSize: tokens.typography.fontMd },
  actionButtonTextDisabled: { color: '#6B7280', fontWeight: '700', fontSize: tokens.typography.fontMd },
});
