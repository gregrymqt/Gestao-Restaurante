import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { ItemCapacidadeProducao } from '../types';

interface ProjecaoProdutoCardProps {
  itens: ItemCapacidadeProducao[];
  dataReferenciaTexto?: string;
  onSelectProduto: (produto: ItemCapacidadeProducao) => void;
}

export function ProjecaoProdutoCard({
  itens,
  dataReferenciaTexto = '(D+1)',
  onSelectProduto,
}: ProjecaoProdutoCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <ThemedText variant="title" style={styles.title}>
          Projeção por Produto {dataReferenciaTexto}
        </ThemedText>

        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: tokens.colors.status.greenText }]} />
            <ThemedText variant="caption" style={styles.legendText}>
              Atendível
            </ThemedText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: tokens.colors.status.redText }]} />
            <ThemedText variant="caption" style={styles.legendText}>
              Ruptura
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.list}>
        {itens.map((item) => {
          const total = Math.max(item.demandaPrevista, 1);
          const atendivel = Math.min(item.demandaAtendivel, total);
          const ruptura = Math.max(total - atendivel, 0);

          return (
            <View key={item.produtoId} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={styles.itemInfo}>
                  <ThemedText variant="body" style={styles.nomeProduto}>
                    {item.nomeProduto}
                  </ThemedText>
                  <ThemedText variant="caption" color={tokens.colors.textMuted}>
                    {Math.round(item.demandaAtendivel)} atendíveis de {Math.round(item.demandaPrevista)} demandados
                  </ThemedText>
                </View>

                {item.riscoRutura ? (
                  <ThemedText variant="caption" style={styles.perdaTexto}>
                    Perda -R$ {(item.perdaEstimadaReceita || 0).toFixed(2).replace('.', ',')}
                  </ThemedText>
                ) : (
                  <View style={styles.plenaBadge}>
                    <ThemedText variant="caption" style={styles.plenaText}>
                      ✓ Plena
                    </ThemedText>
                  </View>
                )}
              </View>

              {/* Barra de Progresso Bicolor Proporcional Flexbox */}
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.barAtendivel,
                    { flex: atendivel },
                    ruptura === 0 && styles.barRoundedFull,
                  ]}
                />
                {ruptura > 0 && (
                  <View
                    style={[
                      styles.barRuptura,
                      { flex: ruptura },
                      atendivel === 0 && styles.barRoundedFull,
                    ]}
                  />
                )}
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onSelectProduto(item)}
                style={styles.detalhesButton}
              >
                <ThemedText variant="caption" style={styles.detalhesButtonText}>
                  Ver detalhes &gt;
                </ThemedText>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radii.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.md,
    flexWrap: 'wrap',
    gap: 8,
  },
  title: {
    fontSize: tokens.typography.fontLg,
    fontWeight: '800',
    color: tokens.colors.textPrimary,
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: tokens.typography.fontXs,
    fontWeight: '600',
    color: tokens.colors.textMuted,
  },
  list: {
    gap: tokens.spacing.md,
  },
  itemCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.sm,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.xs,
  },
  itemInfo: {
    flex: 1,
    marginRight: tokens.spacing.xs,
  },
  nomeProduto: {
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
  perdaTexto: {
    color: tokens.colors.status.redText,
    fontWeight: '800',
    fontSize: tokens.typography.fontXs,
  },
  plenaBadge: {
    backgroundColor: tokens.colors.status.greenBg,
    paddingHorizontal: tokens.spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: tokens.radii.sm,
  },
  plenaText: {
    color: tokens.colors.status.greenText,
    fontWeight: '800',
    fontSize: tokens.typography.fontXs,
  },
  barContainer: {
    height: 10,
    flexDirection: 'row',
    borderRadius: tokens.radii.full,
    backgroundColor: '#E9ECEF',
    overflow: 'hidden',
    marginVertical: tokens.spacing.xs,
  },
  barAtendivel: {
    backgroundColor: tokens.colors.status.greenText,
  },
  barRuptura: {
    backgroundColor: tokens.colors.status.redText,
  },
  barRoundedFull: {
    borderRadius: tokens.radii.full,
  },
  detalhesButton: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
    paddingHorizontal: tokens.spacing.xs,
  },
  detalhesButtonText: {
    color: tokens.colors.primary,
    fontWeight: '700',
    fontSize: tokens.typography.fontXs,
  },
});
