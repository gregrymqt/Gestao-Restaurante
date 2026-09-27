import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { tokens } from '@/components/primitives/tokens';
import { ThemedText } from '@/components/primitives/ThemedText';
import { Produto } from '../types';

interface ProdutoCardProps {
  produto: Produto;
  aoAdicionar: (produto: Produto) => void;
}

export function ProdutoCard({ produto, aoAdicionar }: ProdutoCardProps) {
  const isEstoqueBaixo =
    produto.estoqueRestante !== undefined && produto.estoqueRestante <= 5;

  const precoFormatado = `R$ ${produto.preco.toFixed(2).replace('.', ',')}`;

  return (
    <View style={styles.card}>
      {/* Imagem Placeholder Decorativa */}
      <View style={styles.imagePlaceholder}>
        <ThemedText variant="title" style={styles.imageIcon}>
          🍔
        </ThemedText>
        {isEstoqueBaixo && (
          <View style={styles.badgeEstoque}>
            <ThemedText
              variant="caption"
              weight="bold"
              color={tokens.colors.status.redText}
            >
              Restam {produto.estoqueRestante}
            </ThemedText>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <ThemedText
          variant="subtitle"
          numberOfLines={2}
          style={styles.nomeProduto}
        >
          {produto.nome}
        </ThemedText>

        {produto.descricao ? (
          <ThemedText
            variant="caption"
            numberOfLines={2}
            style={styles.descricaoProduto}
          >
            {produto.descricao}
          </ThemedText>
        ) : null}

        <View style={styles.footerRow}>
          <View style={styles.precoContainer}>
            <ThemedText variant="price" style={styles.preco}>
              {precoFormatado}
            </ThemedText>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Adicionar ${produto.nome} à comanda`}
            style={({ pressed }) => [
              styles.botaoAdicionar,
              pressed && styles.botaoAdicionarPressionado,
            ]}
            onPress={() => aoAdicionar(produto)}
          >
            <ThemedText variant="subtitle" style={styles.botaoAdicionarTexto}>
              +
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    margin: tokens.spacing.xs,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  imagePlaceholder: {
    height: 110,
    backgroundColor: tokens.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  imageIcon: {
    fontSize: 40,
  },
  badgeEstoque: {
    position: 'absolute',
    top: tokens.spacing.sm,
    left: tokens.spacing.sm,
    backgroundColor: tokens.colors.status.redBg,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 3,
    borderRadius: tokens.radii.sm,
  },
  body: {
    padding: tokens.spacing.md,
    flex: 1,
    justifyContent: 'space-between',
  },
  nomeProduto: {
    fontSize: tokens.typography.fontSm,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
    minHeight: 36,
  },
  descricaoProduto: {
    marginTop: tokens.spacing.xs,
    marginBottom: tokens.spacing.sm,
    color: tokens.colors.textMuted,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: tokens.spacing.sm,
  },
  precoContainer: {
    flex: 1,
  },
  preco: {
    fontSize: tokens.typography.fontMd,
    fontWeight: '700',
    color: tokens.colors.primary,
  },
  botaoAdicionar: {
    width: 48,
    height: 48,
    borderRadius: tokens.radii.md,
    backgroundColor: tokens.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoAdicionarPressionado: {
    opacity: 0.85,
    backgroundColor: '#FED7D2',
  },
  botaoAdicionarTexto: {
    fontSize: tokens.typography.fontXl,
    fontWeight: '700',
    color: tokens.colors.primary,
    lineHeight: 26,
  },
});
