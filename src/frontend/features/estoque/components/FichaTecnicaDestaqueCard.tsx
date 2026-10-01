import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { shadows } from '@/shared/utils/shadows';
import { FichaTecnicaItem } from '../types';
import { FichaTecnicaIngredientesPills } from './FichaTecnicaIngredientesPills';
import { FichaTecnicaFinanceGrid } from './FichaTecnicaFinanceGrid';

interface FichaTecnicaDestaqueCardProps {
  ficha: FichaTecnicaItem | null;
  totalFichas: number;
  onVerTodas: () => void;
}

export function FichaTecnicaDestaqueCard({
  ficha,
  totalFichas,
  onVerTodas,
}: FichaTecnicaDestaqueCardProps) {
  if (!ficha) return null;

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <ThemedText style={styles.sparkleIcon}>✨</ThemedText>
          <ThemedText variant="title" style={styles.sectionTitle}>
            Ficha Técnica em Destaque
          </ThemedText>
        </View>

        <TouchableOpacity activeOpacity={0.7} onPress={onVerTodas} style={styles.verTodasButton}>
          <ThemedText variant="caption" style={styles.verTodasText}>
            Ver todas ({totalFichas}) &gt;
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Main BOM Card */}
      <View style={styles.card}>
        <View style={styles.topInfoRow}>
          <View style={styles.thumbnailBox}>
            <ThemedText style={styles.thumbnailEmoji}>🍔</ThemedText>
          </View>

          <View style={styles.headerDetails}>
            <View style={styles.skuBadgeRow}>
              <ThemedText variant="caption" color={tokens.colors.textMuted} style={styles.skuText}>
                SKU {ficha.sku}
              </ThemedText>
              <View style={styles.bomBadge}>
                <ThemedText variant="caption" style={styles.bomBadgeText}>
                  {ficha.versaoBom}
                </ThemedText>
              </View>
            </View>

            <ThemedText variant="body" style={styles.nomeProduto}>
              {ficha.nomeProduto}
            </ThemedText>

            <ThemedText variant="caption" color={tokens.colors.textMuted}>
              Tempo médio preparo: {ficha.tempoPreparoMin} min
            </ThemedText>
          </View>
        </View>

        {/* Ingredientes / BOM Pills Modular */}
        <FichaTecnicaIngredientesPills ingredientes={ficha.ingredientes} />

        {/* Grid Financeiro Modular */}
        <FichaTecnicaFinanceGrid
          custoInsumos={ficha.custoInsumos}
          precoBalcao={ficha.precoBalcao}
          margemBrutaPercentual={ficha.margemBrutaPercentual}
        />

        {/* Callout de Capacidade / Gargalo */}
        <View style={styles.gargaloBox}>
          <ThemedText style={styles.gargaloIcon}>⚠️</ThemedText>
          <View style={styles.gargaloTexts}>
            <ThemedText variant="caption" color={tokens.colors.status.redText} style={styles.gargaloTitulo}>
              Capacidade no Turno:{' '}
              <ThemedText variant="caption" style={styles.gargaloDescricao}>
                Rende {ficha.capacidadeTurnoPorcoes} porções{' '}
                {ficha.insumoLimitanteNome ? `(limitado por ${ficha.insumoLimitanteNome})` : ''}
              </ThemedText>
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: tokens.spacing.md,
    marginTop: tokens.spacing.sm,
    marginBottom: tokens.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.xs + 2,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sparkleIcon: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: tokens.typography.fontMd,
    fontWeight: '800',
    color: tokens.colors.textPrimary,
  },
  verTodasButton: {
    paddingVertical: 4,
    paddingHorizontal: tokens.spacing.xs,
  },
  verTodasText: {
    color: tokens.colors.primary,
    fontWeight: '700',
    fontSize: tokens.typography.fontXs,
  },
  card: {
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radii.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.md,
    ...shadows.sm,
  },
  topInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
    gap: tokens.spacing.sm,
  },
  thumbnailBox: {
    width: 48,
    height: 48,
    borderRadius: tokens.radii.md,
    backgroundColor: '#FFF2EE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFD7CE',
  },
  thumbnailEmoji: {
    fontSize: 26,
  },
  headerDetails: {
    flex: 1,
  },
  skuBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  skuText: {
    fontWeight: '700',
  },
  bomBadge: {
    backgroundColor: '#F1F3F4',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: tokens.radii.sm,
  },
  bomBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.textSecondary,
  },
  nomeProduto: {
    fontSize: tokens.typography.fontMd,
    fontWeight: '800',
    color: tokens.colors.textPrimary,
    marginTop: 1,
  },
  gargaloBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.status.redBg,
    borderRadius: tokens.radii.sm,
    paddingVertical: 6,
    paddingHorizontal: tokens.spacing.sm,
    gap: 6,
  },
  gargaloIcon: {
    fontSize: 12,
  },
  gargaloTexts: {
    flex: 1,
  },
  gargaloTitulo: {
    fontWeight: '800',
  },
  gargaloDescricao: {
    fontWeight: '600',
    color: tokens.colors.status.redText,
  },
});
