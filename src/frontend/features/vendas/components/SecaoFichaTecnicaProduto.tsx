import React from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { InsumoEstoque } from '@/features/estoque';

export interface IngredienteLinha {
  insumoId: string;
  quantidadeTexto: string;
}

export interface SecaoFichaTecnicaProdutoProps {
  ingredientes: IngredienteLinha[];
  insumosDisponiveis: InsumoEstoque[];
  carregandoInsumos: boolean;
  onAdicionarIngrediente: () => void;
  onRemoverIngrediente: (index: number) => void;
  onAlterarQuantidade: (index: number, valor: string) => void;
}

export function SecaoFichaTecnicaProduto({
  ingredientes,
  insumosDisponiveis,
  carregandoInsumos,
  onAdicionarIngrediente,
  onRemoverIngrediente,
  onAlterarQuantidade,
}: SecaoFichaTecnicaProdutoProps) {
  return (
    <View style={styles.bomSection}>
      <View style={styles.bomHeaderRow}>
        <View style={styles.bomTitleContainer}>
          <ThemedText style={styles.bomTitle}>Receita & Baixa de Estoque</ThemedText>
          <ThemedText style={styles.bomSubtitle}>
            {ingredientes.length === 0
              ? 'Nenhum insumo (venda direta sem baixa de matéria-prima)'
              : `${ingredientes.length} insumo(s) consumido(s) por venda`}
          </ThemedText>
        </View>

        <TouchableOpacity
          style={styles.btnAddIngrediente}
          onPress={onAdicionarIngrediente}
          accessibilityRole="button"
          accessibilityLabel="Adicionar ingrediente à receita"
          activeOpacity={0.8}
        >
          <ThemedText style={styles.btnAddIngredienteText}>+ Ingrediente</ThemedText>
        </TouchableOpacity>
      </View>

      {carregandoInsumos ? (
        <ActivityIndicator size="small" color={tokens.colors.primary} style={styles.loader} />
      ) : (
        ingredientes.map((linha, idx) => {
          const insumo = insumosDisponiveis.find((i) => i.id === linha.insumoId);
          return (
            <View key={linha.insumoId} style={styles.ingredienteRow}>
              <ThemedText style={styles.ingredienteNome} numberOfLines={1}>
                {insumo?.nome || 'Insumo'}
              </ThemedText>
              <TextInput
                style={styles.ingredienteQtdInput}
                placeholder="Qtd"
                placeholderTextColor={tokens.colors.textMuted}
                keyboardType="numeric"
                value={linha.quantidadeTexto}
                onChangeText={(txt) => onAlterarQuantidade(idx, txt)}
              />
              <ThemedText style={styles.ingredienteUn}>
                {insumo?.unidadeMedida || 'un'}
              </ThemedText>
              <TouchableOpacity
                onPress={() => onRemoverIngrediente(idx)}
                style={styles.btnRemoverIngrediente}
                accessibilityRole="button"
                accessibilityLabel={`Remover ingrediente ${insumo?.nome || ''}`}
              >
                <ThemedText style={styles.btnRemoverText}>✕</ThemedText>
              </TouchableOpacity>
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bomSection: {
    backgroundColor: tokens.colors.background,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    overflow: 'hidden',
  },
  bomHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  bomTitleContainer: {
    flex: 1,
    paddingRight: 6,
  },
  bomTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
  bomSubtitle: {
    fontSize: 11,
    color: tokens.colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  btnAddIngrediente: {
    backgroundColor: tokens.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    flexShrink: 0,
    alignSelf: 'center',
  },
  btnAddIngredienteText: {
    fontSize: 12,
    fontWeight: '700',
    color: tokens.colors.white,
  },
  loader: {
    marginVertical: 10,
  },
  ingredienteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.card,
    padding: 10,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    gap: 8,
  },
  ingredienteNome: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: tokens.colors.textPrimary,
  },
  ingredienteQtdInput: {
    width: 60,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 13,
    textAlign: 'center',
    color: tokens.colors.textPrimary,
    backgroundColor: tokens.colors.card,
  },
  ingredienteUn: {
    fontSize: 12,
    color: tokens.colors.textSecondary,
    minWidth: 24,
  },
  btnRemoverIngrediente: {
    padding: 6,
  },
  btnRemoverText: {
    color: tokens.colors.status.redText,
    fontSize: 14,
    fontWeight: '700',
  },
});
