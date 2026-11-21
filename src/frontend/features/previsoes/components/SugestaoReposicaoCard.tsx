import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { CheckCircle2, ClipboardList, Check, WifiOff } from 'lucide-react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { formatarQuantidade } from '@/shared/utils/formatters';
import { SugestaoReposicaoInsumo } from '../types';

interface SugestaoReposicaoCardProps {
  sugestoes: SugestaoReposicaoInsumo[];
  onGerarOrdemCompra: () => void;
  isOffline?: boolean;
}

export function SugestaoReposicaoCard({
  sugestoes,
  onGerarOrdemCompra,
  isOffline = false,
}: SugestaoReposicaoCardProps) {
  const itensNecessarios = sugestoes.filter((s) => s.quantidadeComprar > 0);
  const temItensComprar = itensNecessarios.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText variant="title" style={styles.title}>
          Sugestão de Reposição
        </ThemedText>
        <ThemedText variant="caption" color={tokens.colors.textMuted}>
          Para garantir 100% dos pedidos previstos
        </ThemedText>
      </View>

      {!temItensComprar ? (
        <View style={styles.emptyContainer}>
          <CheckCircle2 size={20} color={tokens.colors.status.greenText} />
          <ThemedText variant="body" style={styles.emptyText}>
            Estoque equilibrado: nenhuma reposição necessária para este dia.
          </ThemedText>
        </View>
      ) : (
        <>
          <View style={styles.list}>
            {sugestoes.map((item) => {
              const precisaComprar = item.quantidadeComprar > 0;

              return (
                <View key={item.insumoId} style={styles.row}>
                  <View style={styles.infoCol}>
                    <ThemedText variant="body" style={styles.nomeInsumo}>
                      {item.nomeInsumo}
                    </ThemedText>

                    {precisaComprar ? (
                      <ThemedText variant="caption" color={tokens.colors.textMuted}>
                        Atual {formatarQuantidade(item.stockAtual, item.unidadeMedida)} / Necessário{' '}
                        {formatarQuantidade(item.stockNecessario, item.unidadeMedida)}
                      </ThemedText>
                    ) : (
                      <ThemedText variant="caption" style={styles.suficienteText}>
                        Estoque Suficiente (Cobre demanda projetada)
                      </ThemedText>
                    )}
                  </View>

                  <View
                    style={[
                      styles.badge,
                      precisaComprar ? styles.badgeComprar : styles.badgeOk,
                    ]}
                  >
                    {precisaComprar ? (
                      <ThemedText variant="caption" style={[styles.badgeText, styles.badgeTextComprar]}>
                        +{formatarQuantidade(item.quantidadeComprar, item.unidadeMedida)}
                      </ThemedText>
                    ) : (
                      <View style={styles.badgeOkInner}>
                        <Check size={11} color={tokens.colors.status.greenText} />
                        <ThemedText variant="caption" style={[styles.badgeText, styles.badgeTextOk]}>
                          OK
                        </ThemedText>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onGerarOrdemCompra}
            disabled={isOffline}
            style={[styles.botaoOrdemGeral, isOffline && styles.botaoOrdemGeralDisabled]}
            accessibilityRole="button"
            accessibilityLabel={
              isOffline ? 'Conexão necessária' : 'Consolidar Pedido de Compras'
            }
          >
            {isOffline ? (
              <View style={styles.buttonInnerRow}>
                <WifiOff size={16} color="#6B7280" />
                <ThemedText variant="body" style={styles.botaoOrdemGeralTextDisabled}>
                  Conexão necessária
                </ThemedText>
              </View>
            ) : (
              <View style={styles.buttonInnerRow}>
                <ClipboardList size={16} color={tokens.colors.textPrimary} />
                <ThemedText variant="body" style={styles.botaoOrdemGeralText}>
                  Consolidar Pedido de Compras
                </ThemedText>
              </View>
            )}
          </TouchableOpacity>
        </>
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
  header: {
    marginBottom: tokens.spacing.sm,
  },
  title: {
    fontSize: tokens.typography.fontLg,
    fontWeight: '800',
    color: tokens.colors.textPrimary,
  },
  emptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.sm,
    backgroundColor: tokens.colors.status.greenBg,
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    borderColor: '#A8DAB5',
  },
  emptyText: {
    flex: 1,
    fontWeight: '600',
    color: tokens.colors.status.greenText,
    fontSize: tokens.typography.fontSm,
  },
  list: {
    gap: tokens.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: tokens.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  infoCol: {
    flex: 1,
    paddingRight: tokens.spacing.sm,
  },
  nomeInsumo: {
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
  suficienteText: {
    color: tokens.colors.status.greenText,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 4,
    borderRadius: tokens.radii.full,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeComprar: {
    backgroundColor: tokens.colors.status.redBg,
    borderWidth: 1,
    borderColor: '#F28B82',
  },
  badgeOk: {
    backgroundColor: tokens.colors.status.greenBg,
    borderWidth: 1,
    borderColor: '#A8DAB5',
  },
  badgeOkInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  badgeText: {
    fontWeight: '800',
    fontSize: tokens.typography.fontXs,
  },
  badgeTextComprar: {
    color: tokens.colors.status.redText,
  },
  badgeTextOk: {
    color: tokens.colors.status.greenText,
  },
  botaoOrdemGeral: {
    marginTop: tokens.spacing.md,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radii.md,
    paddingVertical: tokens.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  botaoOrdemGeralDisabled: {
    backgroundColor: '#E5E7EB',
    borderColor: '#D1D5DB',
  },
  buttonInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  botaoOrdemGeralText: {
    color: tokens.colors.textPrimary,
    fontWeight: '700',
  },
  botaoOrdemGeralTextDisabled: {
    color: '#6B7280',
    fontWeight: '700',
  },
});
