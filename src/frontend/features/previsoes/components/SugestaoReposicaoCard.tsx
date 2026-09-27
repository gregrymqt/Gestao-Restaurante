import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { SugestaoReposicaoInsumo } from '../types';

interface SugestaoReposicaoCardProps {
  sugestoes: SugestaoReposicaoInsumo[];
  onGerarOrdemCompra: () => void;
}

export function SugestaoReposicaoCard({
  sugestoes,
  onGerarOrdemCompra,
}: SugestaoReposicaoCardProps) {
  const temItensComprar = sugestoes.some((s) => s.quantidadeComprar > 0);

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
                    Atual {item.stockAtual} {item.unidadeMedida} / Necessário {item.stockNecessario}{' '}
                    {item.unidadeMedida}
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
                <ThemedText
                  variant="caption"
                  style={[
                    styles.badgeText,
                    precisaComprar ? styles.badgeTextComprar : styles.badgeTextOk,
                  ]}
                >
                  {precisaComprar
                    ? `+${item.quantidadeComprar} ${item.unidadeMedida}`
                    : '✓ OK'}
                </ThemedText>
              </View>
            </View>
          );
        })}
      </View>

      {temItensComprar && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onGerarOrdemCompra}
          style={styles.botaoOrdemGeral}
        >
          <ThemedText variant="body" style={styles.botaoOrdemGeralText}>
            📋 Consolidar Pedido de Compras
          </ThemedText>
        </TouchableOpacity>
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
  botaoOrdemGeralText: {
    color: tokens.colors.textPrimary,
    fontWeight: '700',
  },
});
