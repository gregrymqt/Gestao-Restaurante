import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';

export default function PrevisoesRoute() {
  return (
    <View style={styles.container}>
      <ThemedText variant="title">Previsões & Capacidade</ThemedText>
      <ThemedText variant="body" color={tokens.colors.textMuted}>
        Painel preditivo de demanda alimentado por IA em desenvolvimento.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.background,
    padding: tokens.spacing.lg,
  },
});
