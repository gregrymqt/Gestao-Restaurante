import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Check, ChevronRight } from 'lucide-react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { formatarMoeda } from '@/shared/utils/formatters';
import { calcularPerdaEstimada } from '../utils/previsoesHelpers';
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

      {itens.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText variant="body" color={tokens.colors.textMuted} style={styles.emptyText}>
            Nenhuma projeção disponível para esta data.
          </ThemedText>
        </View>
      ) : (
        <View style={styles.list}>
          {itens.map((item) => {
            const isZeroDemanda = item.demandaPrevista === 0;
            const isTotalRuptura =
              item.demandaPrevista > 0 && item.demandaAtendivel === 0;

            const atendivelPercent = isZeroDemanda
              ? 100
              : Math.min(100, Math.max(0, (item.demandaAtendivel / item.demandaPrevista) * 100));

            const rupturaPercent = isZeroDemanda ? 0 : Math.max(0, 100 - atendivelPercent);

            const perdaReal = calcularPerdaEstimada(item);
            const isRiscoRuturaReal = item.riscoRutura && (item.deficitUnidades > 0 || rupturaPercent > 0);

            return (
              <TouchableOpacity
                key={item.produtoId}
                activeOpacity={0.85}
                onPress={() => onSelectProduto(item)}
                style={styles.itemCard}
                accessibilityRole="button"
                accessibilityLabel={`Ver detalhes da ficha técnica de ${item.nomeProduto}`}
              >
                <View style={styles.itemHeader}>
                  <View style={styles.itemInfo}>
                    <ThemedText variant="body" style={styles.nomeProduto}>
                      {item.nomeProduto}
                    </ThemedText>
                    <ThemedText variant="caption" color={tokens.colors.textMuted}>
                      {isZeroDemanda
                        ? `0 demandados • Capacidade para ${Math.round(item.capacidadeMaximaProducao)} un`
                        : `${Math.round(item.demandaAtendivel)} atendíveis de ${Math.round(item.demandaPrevista)} demandados`}
                    </ThemedText>
                  </View>

                  {isRiscoRuturaReal ? (
                    <ThemedText variant="caption" style={styles.perdaTexto}>
                      Perda -{formatarMoeda(perdaReal)}
                    </ThemedText>
                  ) : (
                    <View style={styles.plenaBadge}>
                      <Check size={11} color={tokens.colors.status.greenText} />
                      <ThemedText variant="caption" style={styles.plenaText}>
                        Plena
                      </ThemedText>
                    </View>
                  )}
                </View>

                {/* Barra de Progresso Bicolor Proporcional */}
                <View style={styles.barContainer}>
                  {isZeroDemanda ? (
                    <View style={[styles.barAtendivel, styles.barFullWidth]} />
                  ) : isTotalRuptura ? (
                    <View style={[styles.barRuptura, styles.barFullWidth]} />
                  ) : (
                    <>
                      {atendivelPercent > 0 && (
                        <View
                          style={[
                            styles.barAtendivel,
                            { width: `${atendivelPercent}%` },
                            rupturaPercent === 0 && styles.barRoundedFull,
                          ]}
                        />
                      )}
                      {rupturaPercent > 0 && (
                        <View
                          style={[
                            styles.barRuptura,
                            { width: `${rupturaPercent}%` },
                            atendivelPercent === 0 && styles.barRoundedFull,
                          ]}
                        />
                      )}
                    </>
                  )}
                </View>

                <View style={styles.detalhesRow}>
                  <View style={styles.detalhesButton}>
                    <ThemedText variant="caption" style={styles.detalhesButtonText}>
                      Ver detalhes
                    </ThemedText>
                    <ChevronRight size={13} color={tokens.colors.primary} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
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
  emptyContainer: {
    paddingVertical: tokens.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontStyle: 'italic',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
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
    height: '100%',
  },
  barRuptura: {
    backgroundColor: tokens.colors.status.redText,
    height: '100%',
  },
  barFullWidth: {
    width: '100%',
    height: '100%',
    borderRadius: tokens.radii.full,
  },
  barRoundedFull: {
    borderRadius: tokens.radii.full,
  },
  detalhesRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 2,
  },
  detalhesButton: {
    minHeight: 44,
    minWidth: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
    paddingHorizontal: tokens.spacing.xs,
  },
  detalhesButtonText: {
    color: tokens.colors.primary,
    fontWeight: '700',
    fontSize: tokens.typography.fontXs,
  },
});
