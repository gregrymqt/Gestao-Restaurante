import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { PrevisaoIaResumo } from '../types';

interface PrevisaoDemandaIaCardProps {
  previsao: PrevisaoIaResumo;
  onNavegarPrevisoes: () => void;
}

export function PrevisaoDemandaIaCard({
  previsao,
  onNavegarPrevisoes,
}: PrevisaoDemandaIaCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.tituloRow}>
          <ThemedText style={styles.iconeIa}>🤖</ThemedText>
          <View style={styles.tituloTextos}>
            <ThemedText variant="subtitle" weight="bold">
              Inteligência Preditiva de Demanda
            </ThemedText>
            <ThemedText variant="caption" style={styles.subtituloIa}>
              IA Preditiva de Vendas • {previsao.dataAlvoFormatada}
            </ThemedText>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir tela de previsões de demanda"
          onPress={onNavegarPrevisoes}
          style={({ pressed }) => [styles.botaoVerMais, pressed && styles.pressed]}
        >
          <ThemedText variant="caption" weight="bold" color={tokens.colors.primary}>
            Detalhes →
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.corpo}>
        <View style={styles.blocoPrevisao}>
          <ThemedText variant="caption" style={styles.labelBloco}>
            VOLUME TOTAL ESPERADO
          </ThemedText>
          <View style={styles.valorPrevisaoLinha}>
            <ThemedText variant="title" weight="bold" color={tokens.colors.primary}>
              ~{previsao.totalItensPrevistos} pratos
            </ThemedText>
            <View style={styles.tagCrescimento}>
              <ThemedText variant="caption" weight="bold" color={tokens.colors.status.greenText}>
                +{previsao.variacaoPercentual}%
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.divisor} />

        <View style={styles.blocoContexto}>
          <ThemedText variant="caption" style={styles.labelBloco}>
            ITEM MAIS DEMANDADO
          </ThemedText>
          <ThemedText variant="caption" weight="bold" numberOfLines={1}>
            🍔 {previsao.produtoDestaque}
          </ThemedText>
          <ThemedText variant="caption" style={styles.textoClima}>
            Clima: {previsao.condicaoClimaPrevista}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radii.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.md,
    marginHorizontal: tokens.spacing.lg,
    marginTop: tokens.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
  },
  tituloRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    flex: 1,
  },
  tituloTextos: {
    flex: 1,
    paddingRight: tokens.spacing.xs,
  },
  iconeIa: {
    fontSize: 24,
  },
  subtituloIa: {
    fontSize: tokens.typography.fontXs,
    color: tokens.colors.textMuted,
  },
  botaoVerMais: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  pressed: {
    opacity: 0.7,
  },
  corpo: {
    backgroundColor: tokens.colors.background,
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  blocoPrevisao: {
    flex: 1,
  },
  labelBloco: {
    fontSize: 10,
    color: tokens.colors.textMuted,
    marginBottom: 4,
  },
  valorPrevisaoLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagCrescimento: {
    backgroundColor: tokens.colors.status.greenBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: tokens.radii.full,
  },
  divisor: {
    width: 1,
    backgroundColor: tokens.colors.border,
    marginHorizontal: tokens.spacing.md,
  },
  blocoContexto: {
    flex: 1,
  },
  textoClima: {
    fontSize: 10,
    color: tokens.colors.textSecondary,
    marginTop: 2,
  },
});
