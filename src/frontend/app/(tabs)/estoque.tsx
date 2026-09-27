import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';

export default function EstoqueRoute() {
  return (
    <View style={styles.container}>
      <ThemedText variant="title">Estoque & Fichas Técnicas</ThemedText>
      <ThemedText variant="body" color={tokens.colors.textMuted}>
        Monitor de insumos e visualizador de ficha técnica em desenvolvimento.
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
