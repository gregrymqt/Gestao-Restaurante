import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { ItemCapacidadeProducao, FichaTecnicaIngrediente } from '../types';
import { FichaTecnicaItemCard } from './FichaTecnicaItemCard';

interface FichaTecnicaModalProps {
  visible: boolean;
  produto: ItemCapacidadeProducao | null;
  ingredientes: FichaTecnicaIngrediente[];
  onClose: () => void;
}

export function FichaTecnicaModal({
  visible,
  produto,
  ingredientes,
  onClose,
}: FichaTecnicaModalProps) {
  if (!produto) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          <View style={styles.dragIndicator} />

          <View style={styles.header}>
            <ThemedText variant="caption" style={styles.title}>
              Ficha Técnica (BOM)
            </ThemedText>
            <ThemedText variant="body" style={styles.produtoNome}>
              {produto.nomeProduto}
            </ThemedText>

            <View style={styles.statusRow}>
              <ThemedText variant="caption" color={tokens.colors.textMuted}>
                Demanda Prevista: {Math.round(produto.demandaPrevista)} un | Capacidade Máxima: {Math.round(produto.capacidadeMaximaProducao)} un
              </ThemedText>
            </View>
          </View>

          <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
            <ThemedText variant="body" style={styles.sectionTitle}>
              Composição de Insumos por Porção
            </ThemedText>

            {ingredientes.length === 0 ? (
              <View style={styles.emptyBox}>
                <ThemedText variant="caption" color={tokens.colors.textMuted}>
                  Carregando especificações de engenharia de cardápio...
                </ThemedText>
              </View>
            ) : (
              ingredientes.map((ing) => (
                <FichaTecnicaItemCard key={ing.insumoId} ing={ing} />
              ))
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onClose}
              style={styles.fecharButton}
            >
              <ThemedText variant="body" style={styles.fecharButtonText}>
                Entendido / Fechar
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: tokens.colors.white,
    borderTopLeftRadius: tokens.radii.lg,
    borderTopRightRadius: tokens.radii.lg,
    maxHeight: '85%',
    paddingBottom: tokens.spacing.lg,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: tokens.colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: tokens.spacing.sm,
    marginBottom: tokens.spacing.xs,
  },
  header: {
    paddingHorizontal: tokens.spacing.md,
    paddingTop: tokens.spacing.xs,
    paddingBottom: tokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  title: {
    fontSize: tokens.typography.fontXs,
    fontWeight: '700',
    color: tokens.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  produtoNome: {
    fontSize: tokens.typography.fontLg,
    fontWeight: '800',
    color: tokens.colors.textPrimary,
    marginTop: 2,
  },
  statusRow: {
    marginTop: 4,
  },
  scrollList: {
    paddingHorizontal: tokens.spacing.md,
    paddingTop: tokens.spacing.md,
  },
  sectionTitle: {
    fontWeight: '700',
    color: tokens.colors.textPrimary,
    marginBottom: tokens.spacing.sm,
  },
  emptyBox: {
    padding: tokens.spacing.lg,
    alignItems: 'center',
  },
  footer: {
    paddingHorizontal: tokens.spacing.md,
    paddingTop: tokens.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border,
  },
  fecharButton: {
    backgroundColor: tokens.colors.card,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    paddingVertical: tokens.spacing.sm + 2,
    borderRadius: tokens.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  fecharButtonText: {
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
});
