import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { InsumoCriticoResumo } from '../types';

interface AlertaEstoqueCriticoCardProps {
  insumos: readonly InsumoCriticoResumo[];
  onNavegarEstoque: () => void;
  onAbrirOrdemCompra?: () => void;
}

export function AlertaEstoqueCriticoCard({
  insumos,
  onNavegarEstoque,
  onAbrirOrdemCompra,
}: AlertaEstoqueCriticoCardProps) {
  if (!insumos || insumos.length === 0) {
    return (
      <View style={styles.cardOk}>
        <ThemedText style={styles.iconeOk}>✅</ThemedText>
        <View style={styles.textosOk}>
          <ThemedText variant="subtitle" weight="bold" color={tokens.colors.status.greenText}>
            Estoque em Nível Seguro
          </ThemedText>
          <ThemedText variant="caption" style={styles.subtextoOk}>
            Nenhum insumo está abaixo da margem mínima operacional.
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.cardAlerta}>
      <View style={styles.header}>
        <View style={styles.tituloRow}>
          <ThemedText style={styles.iconeAlerta}>⚠️</ThemedText>
          <ThemedText variant="subtitle" weight="bold" color={tokens.colors.status.redText}>
            Atenção: {insumos.length} {insumos.length === 1 ? 'Insumo Crítico' : 'Insumos Críticos'}
          </ThemedText>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ver estoque completo"
          onPress={onNavegarEstoque}
          style={({ pressed }) => [styles.botaoVerMais, pressed && styles.pressed]}
        >
          <ThemedText variant="caption" weight="bold" color={tokens.colors.primary}>
            Ver Estoque →
          </ThemedText>
        </Pressable>
      </View>

      <ThemedText variant="caption" style={styles.descricao}>
        Itens abaixo do estoque mínimo de segurança em tempo real:
      </ThemedText>

      <View style={styles.listaInsumos}>
        {insumos.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <ThemedText variant="caption" weight="bold">
                {item.nome}
              </ThemedText>
              <ThemedText variant="caption" style={styles.itemMinimo}>
                Mínimo exigido: {item.quantidadeMinima} {item.unidadeMedida}
              </ThemedText>
            </View>

            <View style={styles.badgeQtd}>
              <ThemedText variant="caption" weight="bold" color={tokens.colors.status.redText}>
                {item.quantidadeAtual} {item.unidadeMedida}
              </ThemedText>
            </View>
          </View>
        ))}
      </View>

      {onAbrirOrdemCompra && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Gerar pedido de compra para insumos críticos"
          onPress={onAbrirOrdemCompra}
          style={({ pressed }) => [styles.botaoOrdemCompra, pressed && styles.pressed]}
        >
          <ThemedText variant="caption" weight="bold" color={tokens.colors.white}>
            📋 Gerar Pedido de Compra ({insumos.length})
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardAlerta: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.md,
    marginHorizontal: tokens.spacing.lg,
    marginTop: tokens.spacing.md,
  },
  cardOk: {
    backgroundColor: '#F1F8E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.md,
    marginHorizontal: tokens.spacing.lg,
    marginTop: tokens.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  iconeOk: {
    fontSize: 22,
  },
  textosOk: {
    flex: 1,
  },
  subtextoOk: {
    color: tokens.colors.textSecondary,
    fontSize: tokens.typography.fontXs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tituloRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconeAlerta: {
    fontSize: 18,
  },
  botaoVerMais: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  pressed: {
    opacity: 0.7,
  },
  descricao: {
    color: tokens.colors.textSecondary,
    fontSize: tokens.typography.fontXs,
    marginBottom: tokens.spacing.sm,
  },
  listaInsumos: {
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radii.sm,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FFE0E0',
  },
  itemInfo: {
    flex: 1,
  },
  itemMinimo: {
    fontSize: 10,
    color: tokens.colors.textMuted,
  },
  badgeQtd: {
    backgroundColor: tokens.colors.status.redBg,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: tokens.radii.full,
  },
  botaoOrdemCompra: {
    backgroundColor: tokens.colors.primary,
    borderRadius: tokens.radii.md,
    paddingVertical: tokens.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: tokens.spacing.md,
  },
});
