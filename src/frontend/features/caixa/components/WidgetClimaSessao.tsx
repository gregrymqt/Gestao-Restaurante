import React from 'react';
import { View, StyleSheet } from 'react-native';
import { tokens } from '@/components/primitives/tokens';
import { ThemedText } from '@/components/primitives/ThemedText';
import { DadosClimaticos } from '../types';

interface WidgetClimaSessaoProps {
  clima: DadosClimaticos;
}

export function WidgetClimaSessao({ clima }: WidgetClimaSessaoProps) {
  return (
    <View style={styles.container}>
      {/* Header do Widget Climático */}
      <View style={styles.headerRow}>
        <View style={styles.tituloWrapper}>
          <ThemedText variant="subtitle" style={styles.iconeSol}>
            ☀️
          </ThemedText>
          <ThemedText variant="subtitle" style={styles.titulo}>
            Contexto Climático da Sessão
          </ThemedText>
        </View>

        <View style={styles.badgeTempoReal}>
          <ThemedText variant="caption" style={styles.textoTempoReal}>
            Tempo Real
          </ThemedText>
        </View>
      </View>

      {/* 3 Cards Lado a Lado (Flexbox Puro) */}
      <View style={styles.cardsRow}>
        {/* Card 1: Temperatura */}
        <View style={styles.cardItem}>
          <ThemedText variant="caption" style={styles.cardLabel}>
            TEMP
          </ThemedText>
          <ThemedText variant="title" style={styles.cardValor}>
            {clima.temperatura}°C
          </ThemedText>
          <ThemedText variant="caption" style={styles.cardSubtexto}>
            {clima.condicao}
          </ThemedText>
        </View>

        {/* Card 2: Umidade */}
        <View style={styles.cardItem}>
          <ThemedText variant="caption" style={styles.cardLabel}>
            UMIDADE
          </ThemedText>
          <ThemedText variant="title" style={styles.cardValor}>
            {clima.umidade}%
          </ThemedText>
          <ThemedText variant="caption" style={styles.cardSubtexto}>
            {clima.statusUmidade}
          </ThemedText>
        </View>

        {/* Card 3: Chuva */}
        <View style={styles.cardItem}>
          <ThemedText variant="caption" style={styles.cardLabel}>
            CHUVA
          </ThemedText>
          <ThemedText variant="title" style={styles.cardValor}>
            {clima.chuvaMm.toFixed(1)} mm
          </ThemedText>
          <ThemedText
            variant="caption"
            weight="bold"
            color={tokens.colors.status.greenText}
            style={styles.cardSubtexto}
          >
            {clima.statusChuva}
          </ThemedText>
        </View>
      </View>

      {/* Nota de Integração com Machine Learning */}
      <View style={styles.notaIaContainer}>
        <ThemedText variant="caption" style={styles.iconeIa}>
          🤖
        </ThemedText>
        <ThemedText variant="caption" style={styles.textoNotaIa}>
          Variáveis climáticas sincronizadas para inferência de Machine Learning e
          calibração de demanda de insumos no próximo turno.
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
    marginHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.md,
  },
  tituloWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  iconeSol: {
    fontSize: 16,
  },
  titulo: {
    fontSize: tokens.typography.fontSm,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
  badgeTempoReal: {
    backgroundColor: tokens.colors.background,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: tokens.radii.full,
  },
  textoTempoReal: {
    fontSize: 10,
    color: tokens.colors.textMuted,
    fontWeight: '600',
  },
  cardsRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.md,
  },
  cardItem: {
    flex: 1,
    backgroundColor: tokens.colors.card,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radii.md,
    paddingVertical: tokens.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.textMuted,
    letterSpacing: 0.5,
  },
  cardValor: {
    fontSize: tokens.typography.fontXl,
    fontWeight: '800',
    color: tokens.colors.textPrimary,
    marginVertical: 2,
  },
  cardSubtexto: {
    fontSize: 10,
    color: tokens.colors.textMuted,
  },
  notaIaContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.spacing.xs,
    paddingTop: tokens.spacing.xs,
  },
  iconeIa: {
    fontSize: 12,
    marginTop: 1,
  },
  textoNotaIa: {
    flex: 1,
    fontSize: 11,
    color: tokens.colors.textMuted,
    lineHeight: 16,
  },
});
