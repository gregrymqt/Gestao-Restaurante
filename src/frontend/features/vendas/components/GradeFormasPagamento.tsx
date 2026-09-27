import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { tokens } from '@/components/primitives/tokens';
import { ThemedText } from '@/components/primitives/ThemedText';
import { FormaPagamento } from '../types';

interface GradeFormasPagamentoProps {
  formaPagamento: FormaPagamento;
  aoSelecionarForma: (forma: FormaPagamento) => void;
}

export function GradeFormasPagamento({
  formaPagamento,
  aoSelecionarForma,
}: GradeFormasPagamentoProps) {
  return (
    <View style={styles.container}>
      <ThemedText variant="caption" weight="bold" style={styles.secaoTitulo}>
        FORMA DE PAGAMENTO
      </ThemedText>

      <View style={styles.gradePagamentos}>
        {/* Opção 1: Dinheiro */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Forma de pagamento Dinheiro"
          style={[
            styles.cardPagamento,
            formaPagamento === 'Dinheiro' && styles.cardPagamentoAtivo,
          ]}
          onPress={() => aoSelecionarForma('Dinheiro')}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconeWrapper}>
              <ThemedText variant="title">💵</ThemedText>
            </View>
            {formaPagamento === 'Dinheiro' && <View style={styles.dotAtivo} />}
          </View>
          <ThemedText
            variant="subtitle"
            style={[
              styles.tituloPagamento,
              formaPagamento === 'Dinheiro' && styles.tituloPagamentoAtivo,
            ]}
          >
            Dinheiro
          </ThemedText>
          <ThemedText variant="caption" style={styles.subtituloPagamento}>
            Cédulas / Moedas
          </ThemedText>
        </Pressable>

        {/* Opção 2: PIX */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Forma de pagamento PIX"
          style={[
            styles.cardPagamento,
            formaPagamento === 'PIX' && styles.cardPagamentoAtivo,
          ]}
          onPress={() => aoSelecionarForma('PIX')}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconeWrapper}>
              <ThemedText variant="title">💠</ThemedText>
            </View>
            <View style={styles.badgePix}>
              <ThemedText variant="caption" style={styles.textoBadgePix}>
                Instantâneo
              </ThemedText>
            </View>
          </View>
          <ThemedText
            variant="subtitle"
            style={[
              styles.tituloPagamento,
              formaPagamento === 'PIX' && styles.tituloPagamentoAtivo,
            ]}
          >
            PIX
          </ThemedText>
          <ThemedText variant="caption" style={styles.subtituloPagamento}>
            QR Code dinâmico
          </ThemedText>
        </Pressable>

        {/* Opção 3: Débito */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Forma de pagamento Débito"
          style={[
            styles.cardPagamento,
            formaPagamento === 'Debito' && styles.cardPagamentoAtivo,
          ]}
          onPress={() => aoSelecionarForma('Debito')}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconeWrapper}>
              <ThemedText variant="title">📟</ThemedText>
            </View>
            {formaPagamento === 'Debito' && <View style={styles.dotAtivo} />}
          </View>
          <ThemedText
            variant="subtitle"
            style={[
              styles.tituloPagamento,
              formaPagamento === 'Debito' && styles.tituloPagamentoAtivo,
            ]}
          >
            Débito
          </ThemedText>
          <ThemedText variant="caption" style={styles.subtituloPagamento}>
            Cartão / Maquininha
          </ThemedText>
        </Pressable>

        {/* Opção 4: Crédito */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Forma de pagamento Crédito"
          style={[
            styles.cardPagamento,
            formaPagamento === 'Credito' && styles.cardPagamentoAtivo,
          ]}
          onPress={() => aoSelecionarForma('Credito')}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconeWrapper}>
              <ThemedText variant="title">💳</ThemedText>
            </View>
            {formaPagamento === 'Credito' && <View style={styles.dotAtivo} />}
          </View>
          <ThemedText
            variant="subtitle"
            style={[
              styles.tituloPagamento,
              formaPagamento === 'Credito' && styles.tituloPagamentoAtivo,
            ]}
          >
            Crédito
          </ThemedText>
          <ThemedText variant="caption" style={styles.subtituloPagamento}>
            À vista ou parcelado
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: tokens.spacing.md,
  },
  secaoTitulo: {
    fontSize: tokens.typography.fontXs,
    color: tokens.colors.textSecondary,
    marginBottom: tokens.spacing.sm,
    letterSpacing: 0.5,
  },
  gradePagamentos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
  },
  cardPagamento: {
    width: '48%',
    backgroundColor: tokens.colors.card,
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.md,
    minHeight: 80,
    justifyContent: 'space-between',
  },
  cardPagamentoAtivo: {
    backgroundColor: tokens.colors.primaryLight,
    borderColor: tokens.colors.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconeWrapper: {
    marginBottom: 4,
  },
  dotAtivo: {
    width: 8,
    height: 8,
    borderRadius: tokens.radii.full,
    backgroundColor: tokens.colors.primary,
  },
  badgePix: {
    backgroundColor: tokens.colors.status.greenBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: tokens.radii.sm,
  },
  textoBadgePix: {
    fontSize: 9,
    color: tokens.colors.status.greenText,
    fontWeight: '700',
  },
  tituloPagamento: {
    fontSize: tokens.typography.fontMd,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
  tituloPagamentoAtivo: {
    color: tokens.colors.primaryDark,
  },
  subtituloPagamento: {
    fontSize: tokens.typography.fontXs,
    color: tokens.colors.textMuted,
    marginTop: 2,
  },
});
