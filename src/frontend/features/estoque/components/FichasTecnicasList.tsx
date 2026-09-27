import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { FichaTecnicaItem } from '../types';
import { FichaTecnicaIngredientesPills } from './FichaTecnicaIngredientesPills';
import { FichaTecnicaFinanceGrid } from './FichaTecnicaFinanceGrid';

interface FichasTecnicasListProps {
  fichas: FichaTecnicaItem[];
}

export function FichasTecnicasList({ fichas }: FichasTecnicasListProps) {
  if (fichas.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ThemedText style={styles.emptyIcon}>🔍</ThemedText>
        <ThemedText variant="body" style={styles.emptyTitle}>
          Nenhuma ficha técnica encontrada
        </ThemedText>
        <ThemedText variant="caption" color={tokens.colors.textMuted}>
          Verifique o termo buscado ou adicione novos produtos com BOM.
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText variant="title" style={styles.title}>
          Receitas &amp; Fichas Técnicas (BOM)
        </ThemedText>
        <ThemedText variant="caption" color={tokens.colors.textMuted}>
          {fichas.length} fórmulas ativas com apuração de custos em tempo real
        </ThemedText>
      </View>

      <View style={styles.list}>
        {fichas.map((ficha) => (
          <View key={ficha.id} style={styles.card}>
            <View style={styles.topInfoRow}>
              <View style={styles.thumbnailBox}>
                <ThemedText style={styles.thumbnailEmoji}>
                  {ficha.sku === '#PDV-01' ? '🍔' : ficha.sku === '#PDV-02' ? '🍟' : '🥤'}
                </ThemedText>
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
                  Preparo: {ficha.tempoPreparoMin} min
                </ThemedText>
              </View>
            </View>

            {/* Ingredientes / BOM Pills Modular */}
            <FichaTecnicaIngredientesPills
              ingredientes={ficha.ingredientes}
              tituloSecao="INGREDIENTES DA FORMULAÇÃO"
              exibirQuantidade
            />

            {/* Grid Financeiro Modular */}
            <FichaTecnicaFinanceGrid
              custoInsumos={ficha.custoInsumos}
              precoBalcao={ficha.precoBalcao}
              margemBrutaPercentual={ficha.margemBrutaPercentual}
            />

            {/* Capacidade no Turno */}
            <View style={[styles.capacidadeBox, ficha.insumoLimitanteNome ? styles.capacidadeAlerta : styles.capacidadeOk]}>
              <ThemedText style={styles.capacidadeIcon}>
                {ficha.insumoLimitanteNome ? '⚠️' : '✓'}
              </ThemedText>
              <ThemedText variant="caption" style={ficha.insumoLimitanteNome ? styles.capacidadeTextoAlerta : styles.capacidadeTextoOk}>
                Capacidade Máxima: {ficha.capacidadeTurnoPorcoes} porções{' '}
                {ficha.insumoLimitanteNome ? `(limitado por ${ficha.insumoLimitanteNome})` : '(100% abastecido)'}
              </ThemedText>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: tokens.spacing.md,
    marginBottom: tokens.spacing.xl,
  },
  header: {
    marginBottom: tokens.spacing.sm,
  },
  title: {
    fontSize: tokens.typography.fontLg,
    fontWeight: '800',
    color: tokens.colors.textPrimary,
  },
  emptyContainer: {
    padding: tokens.spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: tokens.spacing.sm,
  },
  emptyTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
  list: {
    gap: tokens.spacing.md,
  },
  card: {
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radii.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  topInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
    gap: tokens.spacing.sm,
  },
  thumbnailBox: {
    width: 44,
    height: 44,
    borderRadius: tokens.radii.md,
    backgroundColor: '#FFF2EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailEmoji: {
    fontSize: 22,
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
  capacidadeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: tokens.radii.sm,
    paddingVertical: 6,
    paddingHorizontal: tokens.spacing.sm,
    gap: 6,
  },
  capacidadeAlerta: {
    backgroundColor: tokens.colors.status.redBg,
  },
  capacidadeOk: {
    backgroundColor: tokens.colors.status.greenBg,
  },
  capacidadeIcon: {
    fontSize: 12,
  },
  capacidadeTextoAlerta: {
    color: tokens.colors.status.redText,
    fontWeight: '700',
  },
  capacidadeTextoOk: {
    color: tokens.colors.status.greenText,
    fontWeight: '700',
  },
});
