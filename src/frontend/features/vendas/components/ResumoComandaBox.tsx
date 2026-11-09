import React from 'react';
import { View, StyleSheet } from 'react-native';
import { tokens } from '@/components/primitives/tokens';
import { ThemedText } from '@/components/primitives/ThemedText';
import { ItemComanda } from '../types';

interface ResumoComandaBoxProps {
  totalItens: number;
  subtotal: number;
  nomesResumo?: string;
  itens?: readonly ItemComanda[];
}

export function ResumoComandaBox({
  totalItens,
  subtotal,
  nomesResumo,
  itens = [],
}: ResumoComandaBoxProps) {
  return (
    <View style={styles.resumoBox}>
      <View style={styles.headerRow}>
        <ThemedText variant="subtitle" weight="bold" style={styles.itensContagem}>
          {totalItens} {totalItens === 1 ? 'item no pedido' : 'itens no pedido'}
        </ThemedText>
        <View style={styles.totalBadge}>
          <ThemedText variant="caption" style={styles.labelTotal}>
            TOTAL:
          </ThemedText>
          <ThemedText variant="subtitle" weight="bold" style={styles.valorTotal}>
            R$ {subtotal.toFixed(2).replace('.', ',')}
          </ThemedText>
        </View>
      </View>

      {itens.length > 0 ? (
        <View style={styles.itensLista}>
          {itens.map((item) => (
            <View key={item.id} style={styles.itemLinha}>
              <View style={styles.itemInfo}>
                <ThemedText variant="body" weight="medium" style={styles.itemNome}>
                  {item.quantidade}x {item.produto.nome}
                </ThemedText>
                {item.modificadores && item.modificadores.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {item.modificadores.map((mod) => {
                      const isAdicional = Number(mod.precoAdicional) > 0;
                      return (
                        <View
                          key={mod.opcaoId}
                          style={[
                            styles.tagModificador,
                            isAdicional
                              ? styles.tagModificadorAdicional
                              : styles.tagModificadorCulinario,
                          ]}
                        >
                          <ThemedText
                            variant="caption"
                            style={[
                              styles.tagTexto,
                              isAdicional
                                ? styles.tagTextoAdicional
                                : styles.tagTextoCulinario,
                            ]}
                          >
                            {isAdicional
                              ? `+ ${mod.nome} (+R$ ${Number(mod.precoAdicional)
                                  .toFixed(2)
                                  .replace('.', ',')})`
                              : mod.nome}
                          </ThemedText>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
              <ThemedText variant="body" weight="bold" style={styles.itemSubtotal}>
                R$ {item.subtotal.toFixed(2).replace('.', ',')}
              </ThemedText>
            </View>
          ))}
        </View>
      ) : (
        <ThemedText variant="caption" numberOfLines={1} style={styles.fallbackTexto}>
          {nomesResumo || 'Nenhum item adicionado'}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  resumoBox: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.lg,
    gap: tokens.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
    paddingBottom: tokens.spacing.xs,
  },
  itensContagem: {
    color: tokens.colors.textPrimary,
  },
  totalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  labelTotal: {
    color: tokens.colors.textMuted,
    fontSize: 11,
  },
  valorTotal: {
    color: tokens.colors.primary,
  },
  itensLista: {
    gap: tokens.spacing.sm,
    paddingTop: tokens.spacing.xs,
  },
  itemLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
    marginRight: tokens.spacing.sm,
  },
  itemNome: {
    color: tokens.colors.textPrimary,
    fontSize: 13,
  },
  itemSubtotal: {
    color: tokens.colors.textPrimary,
    fontSize: 13,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  tagModificador: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: tokens.radii.sm,
  },
  tagModificadorCulinario: {
    backgroundColor: '#E5E7EB',
  },
  tagModificadorAdicional: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tagTexto: {
    fontSize: 11,
  },
  tagTextoCulinario: {
    color: '#374151',
  },
  tagTextoAdicional: {
    color: '#92400E',
    fontWeight: '600',
  },
  fallbackTexto: {
    color: tokens.colors.textMuted,
  },
});
