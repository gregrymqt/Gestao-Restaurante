import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';

export default function CaixaRoute() {
  return (
    <View style={styles.container}>
      <ThemedText variant="title">Dashboard & Caixa</ThemedText>
      <ThemedText variant="body" color={tokens.colors.textMuted}>
        Módulo operacional de fechamento de caixa em desenvolvimento.
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
