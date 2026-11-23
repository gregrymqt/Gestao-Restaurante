import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Clock,
  Timer,
  Receipt,
  CircleDollarSign,
  TrendingUp,
} from 'lucide-react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { ShiftMetrics } from '../types';

interface ShiftMetricsSectionProps {
  metricas: ShiftMetrics | null;
}

export function ShiftMetricsSection({ metricas }: ShiftMetricsSectionProps) {
  const turnoNumero = metricas?.turnoNumero || '#108';
  const inicio = metricas?.inicioTurno || '08:30';
  const tempoDecorrido = metricas?.tempoDecorrido || 'Há 3h 15m';
  const vendas = metricas?.totalVendas ?? 24;
  const tm = (metricas?.ticketMedio ?? 53.35).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const volumeFormatado = (metricas?.volumeTotal ?? 1280.5).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
  const pix = (metricas?.tenderBreakdown?.pix ?? 720.0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const cartao = (metricas?.tenderBreakdown?.cartao ?? 440.5).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const dinheiro = (metricas?.tenderBreakdown?.dinheiro ?? 120.0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <View style={styles.container}>
      {/* Cabeçalho da Seção */}
      <View style={styles.headerRow}>
        <ThemedText style={styles.sectionTitle}>
          RESUMO DO TURNO ATUAL
        </ThemedText>
        <View style={styles.shiftTag}>
          <Clock size={13} color={tokens.colors.textSecondary} />
          <ThemedText style={styles.shiftTagText}>Turno {turnoNumero}</ThemedText>
        </View>
      </View>

      {/* Grid de 3 Cards de Métricas */}
      <View style={styles.cardsRow}>
        {/* Card 1: Início */}
        <View style={styles.metricCard}>
          <View style={styles.cardTop}>
            <ThemedText style={styles.cardLabel}>INÍCIO</ThemedText>
            <Timer size={14} color={tokens.colors.textMuted} />
          </View>
          <View style={styles.cardBottom}>
            <ThemedText style={styles.metricValue}>{inicio}</ThemedText>
            <ThemedText style={styles.metricSub}>{tempoDecorrido}</ThemedText>
          </View>
        </View>

        {/* Card 2: Vendas */}
        <View style={styles.metricCard}>
          <View style={styles.cardTop}>
            <ThemedText style={styles.cardLabel}>VENDAS</ThemedText>
            <Receipt size={14} color={tokens.colors.textMuted} />
          </View>
          <View style={styles.cardBottom}>
            <ThemedText style={styles.metricValue}>{vendas} un</ThemedText>
            <ThemedText style={styles.metricSub} numberOfLines={1}>TM R$ {tm}</ThemedText>
          </View>
        </View>

        {/* Card 3: Volume */}
        <View style={styles.metricCard}>
          <View style={styles.cardTop}>
            <ThemedText style={styles.cardLabel}>VOLUME</ThemedText>
            <CircleDollarSign size={14} color={tokens.colors.textMuted} />
          </View>
          <View style={styles.cardBottom}>
            <ThemedText style={styles.metricValue}>{volumeFormatado}</ThemedText>
            <View style={styles.trendRow}>
              <TrendingUp size={12} color={tokens.colors.status.greenText} />
              <ThemedText style={styles.trendText}>+18%</ThemedText>
            </View>
          </View>
        </View>
      </View>

      {/* Tender Breakdown Mini Drawer */}
      <View style={styles.tenderDrawer}>
        <View style={styles.tenderItem}>
          <View style={[styles.tenderDot, { backgroundColor: '#059669' }]} />
          <ThemedText style={styles.tenderText}>
            PIX: <ThemedText style={styles.tenderStrong}>R$ {pix}</ThemedText>
          </ThemedText>
        </View>

        <View style={styles.tenderDivider} />

        <View style={styles.tenderItem}>
          <View style={[styles.tenderDot, { backgroundColor: '#2563EB' }]} />
          <ThemedText style={styles.tenderText}>
            Cartão: <ThemedText style={styles.tenderStrong}>R$ {cartao}</ThemedText>
          </ThemedText>
        </View>

        <View style={styles.tenderDivider} />

        <View style={styles.tenderItem}>
          <View style={[styles.tenderDot, { backgroundColor: '#16A34A' }]} />
          <ThemedText style={styles.tenderText}>
            Dinheiro: <ThemedText style={styles.tenderStrong}>R$ {dinheiro}</ThemedText>
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: tokens.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: tokens.colors.textSecondary,
    letterSpacing: 0.5,
  },
  shiftTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shiftTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: tokens.colors.textSecondary,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  metricCard: {
    flex: 1,
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.sm,
    borderColor: tokens.colors.border,
    borderWidth: 1,
    justifyContent: 'space-between',
    minHeight: 88,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.textMuted,
    letterSpacing: 0.5,
  },
  cardBottom: {
    marginTop: tokens.spacing.xs,
  },
  metricValue: {
    fontSize: tokens.typography.fontMd,
    fontWeight: '800',
    color: tokens.colors.textPrimary,
  },
  metricSub: {
    fontSize: 11,
    color: tokens.colors.textMuted,
    marginTop: 2,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.status.greenText,
  },
  tenderDrawer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: tokens.colors.background,
    borderRadius: tokens.radii.md,
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    borderColor: tokens.colors.border,
    borderWidth: 1,
    gap: tokens.spacing.xs,
  },
  tenderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  tenderDot: {
    width: 7,
    height: 7,
    borderRadius: tokens.radii.full,
    flexShrink: 0,
  },
  tenderText: {
    fontSize: 11,
    color: tokens.colors.textSecondary,
    flexShrink: 1,
  },
  tenderStrong: {
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
  tenderDivider: {
    width: 1,
    height: 16,
    backgroundColor: tokens.colors.border,
    flexShrink: 0,
  },
});
