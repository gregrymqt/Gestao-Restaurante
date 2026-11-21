import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Lock } from 'lucide-react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';

export function ModalAuditCallout() {
  return (
    <View style={styles.auditCallout}>
      <Lock size={16} color="#4B5563" style={styles.auditIcon} />
      <ThemedText variant="caption" style={styles.auditText}>
        Registro imutável: a movimentação será atualizada no estoque e auditada no histórico.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  auditCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.sm,
    gap: 8,
    marginTop: tokens.spacing.xs,
    marginBottom: tokens.spacing.md,
  },
  auditIcon: {
    marginTop: 1,
  },
  auditText: {
    flex: 1,
    color: '#3C4043',
    lineHeight: 16,
  },
});
