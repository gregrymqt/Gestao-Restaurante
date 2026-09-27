import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';

export function ModalAuditCallout() {
  return (
    <View style={styles.auditCallout}>
      <ThemedText style={styles.auditIcon}>🔒</ThemedText>
      <ThemedText variant="caption" style={styles.auditText}>
        Transação append-only: o saldo em estoque será atualizado atomicamente e o evento registrado para auditoria.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  auditCallout: {
    flexDirection: 'row',
    backgroundColor: '#F0F4F8',
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.sm,
    gap: 8,
    marginTop: tokens.spacing.xs,
    marginBottom: tokens.spacing.md,
  },
  auditIcon: {
    fontSize: 16,
  },
  auditText: {
    flex: 1,
    color: '#3C4043',
    lineHeight: 16,
  },
});
