import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { tokens } from '@/components/primitives/tokens';
import { ThemedText } from '@/components/primitives/ThemedText';
import { VendaHistorico } from '../types';

interface CardVendaHistoricoProps {
  venda: VendaHistorico;
  onPress: () => void;
}

export function CardVendaHistorico({ venda, onPress }: CardVendaHistoricoProps) {
  const dataFormatada = new Date(venda.dataHora).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const valorFormatado = `R$ ${Number(venda.valorTotal || 0).toFixed(2).replace('.', ',')}`;
  const codigoVenda = `#${venda.vendaId.substring(0, 6).toUpperCase()}`;

  const primeiroItem = venda.itens?.[0]?.nomeProduto || 'Venda de Balcão';
  const resumoItens =
    venda.itens?.length > 1
      ? `${venda.quantidadeItens || venda.itens.length} itens • ${primeiroItem} +${venda.itens.length - 1}`
      : `${primeiroItem}`;

  const obterBadgePagamento = (forma: string) => {
    const f = forma.toUpperCase();
    if (f.includes('PIX')) return { label: '⚡ PIX', bg: '#E8F5E9', text: '#2E7D32' };
    if (f.includes('CRED')) return { label: '💳 Crédito', bg: '#E3F2FD', text: '#1565C0' };
    if (f.includes('DEB')) return { label: '📟 Débito', bg: '#EDE7F6', text: '#512DA8' };
    if (f.includes('DINHEIRO')) return { label: '💵 Dinheiro', bg: '#FFF8E1', text: '#F57F17' };
    return { label: forma, bg: tokens.colors.background, text: tokens.colors.textSecondary };
  };

  const badge = obterBadgePagamento(venda.formaPagamento);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel={`Venda ${codigoVenda}, valor ${valorFormatado}`}
    >
      <View style={styles.content}>
        <View style={styles.leftColumn}>
          <View style={styles.headerLinha}>
            <ThemedText variant="caption" weight="bold" style={styles.codigo}>
              {codigoVenda}
            </ThemedText>
            <ThemedText variant="caption" style={styles.horario}>
              • {dataFormatada}
            </ThemedText>
          </View>
          <ThemedText variant="body" numberOfLines={1} style={styles.resumoItens}>
            {resumoItens}
          </ThemedText>
        </View>

        <View style={styles.rightColumn}>
          <ThemedText variant="subtitle" weight="bold" style={styles.valor}>
            {valorFormatado}
          </ThemedText>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <ThemedText variant="caption" weight="bold" style={{ color: badge.text, fontSize: 11 }}>
              {badge.label}
            </ThemedText>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.sm,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  pressed: {
    opacity: 0.75,
    backgroundColor: tokens.colors.background,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftColumn: {
    flex: 1,
    marginRight: tokens.spacing.md,
  },
  headerLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  codigo: {
    color: tokens.colors.primary,
  },
  horario: {
    color: tokens.colors.textSecondary,
    marginLeft: 6,
  },
  resumoItens: {
    color: tokens.colors.textPrimary,
    fontWeight: '500',
  },
  rightColumn: {
    alignItems: 'flex-end',
  },
  valor: {
    color: tokens.colors.textPrimary,
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: tokens.radii.sm,
  },
});
