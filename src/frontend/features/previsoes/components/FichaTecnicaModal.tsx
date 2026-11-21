import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { X, ShoppingCart, AlertCircle } from 'lucide-react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { formatarQuantidade } from '@/shared/utils/formatters';
import { ItemCapacidadeProducao, FichaTecnicaIngrediente } from '../types';
import { FichaTecnicaItemCard } from './FichaTecnicaItemCard';

interface FichaTecnicaModalProps {
  visible: boolean;
  produto: ItemCapacidadeProducao | null;
  ingredientes: FichaTecnicaIngrediente[];
  onClose: () => void;
  onReporInsumo?: (insumoId?: string) => void;
  onCadastrarFichaTecnica?: () => void;
}

export function FichaTecnicaModal({
  visible,
  produto,
  ingredientes,
  onClose,
  onReporInsumo,
  onCadastrarFichaTecnica,
}: FichaTecnicaModalProps) {
  if (!produto) return null;

  const ingredienteGargalo = ingredientes.find((i) => i.isGargalo);
  const deficitQtd = ingredienteGargalo
    ? Math.max(0, ingredienteGargalo.estoqueNecessario - ingredienteGargalo.estoqueAtual)
    : 0;

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
            <View style={styles.headerTextCol}>
              <ThemedText variant="caption" style={styles.title}>
                Ficha Técnica do Prato
              </ThemedText>
              <ThemedText variant="body" style={styles.produtoNome} numberOfLines={1}>
                {produto.nomeProduto}
              </ThemedText>

              <View style={styles.statusRow}>
                <ThemedText variant="caption" color={tokens.colors.textMuted}>
                  Demanda Prevista: {Math.round(produto.demandaPrevista)} un | Capacidade Máxima: {Math.round(produto.capacidadeMaximaProducao)} un
                </ThemedText>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Fechar modal de ficha técnica"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={20} color={tokens.colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
            <ThemedText variant="body" style={styles.sectionTitle}>
              Composição de Insumos por Porção
            </ThemedText>

            {ingredientes.length === 0 ? (
              <View style={styles.emptyBox}>
                <AlertCircle size={28} color={tokens.colors.status.redText} />
                <ThemedText variant="body" style={styles.emptyTitle}>
                  Produto sem Ficha Técnica cadastrada
                </ThemedText>
                <ThemedText variant="caption" color={tokens.colors.textMuted} style={styles.emptySub}>
                  Cadastre os ingredientes e a composição deste item para calcular a capacidade de estoque.
                </ThemedText>

                {onCadastrarFichaTecnica && (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      onClose();
                      onCadastrarFichaTecnica();
                    }}
                    style={styles.cadastrarBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Cadastrar Ficha Técnica"
                  >
                    <ThemedText variant="body" style={styles.cadastrarBtnText}>
                      Cadastrar Ficha Técnica →
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              ingredientes.map((ing) => (
                <FichaTecnicaItemCard key={ing.insumoId} ing={ing} />
              ))
            )}
          </ScrollView>

          <View style={styles.footer}>
            {ingredienteGargalo && onReporInsumo && deficitQtd > 0 ? (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  onClose();
                  onReporInsumo(ingredienteGargalo.insumoId);
                }}
                style={styles.reporButton}
                accessibilityRole="button"
                accessibilityLabel={`Repor ${ingredienteGargalo.nomeInsumo}`}
              >
                <View style={styles.buttonInnerRow}>
                  <ShoppingCart size={16} color={tokens.colors.white} />
                  <ThemedText variant="body" style={styles.reporButtonText}>
                    Repor {ingredienteGargalo.nomeInsumo} (+{formatarQuantidade(deficitQtd, ingredienteGargalo.unidadeMedida)})
                  </ThemedText>
                </View>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onClose}
              style={styles.fecharButton}
              accessibilityRole="button"
              accessibilityLabel="Entendido / Fechar"
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.md,
    paddingTop: tokens.spacing.xs,
    paddingBottom: tokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  headerTextCol: {
    flex: 1,
    marginRight: tokens.spacing.sm,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: '#F9FAFB',
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    marginVertical: tokens.spacing.md,
  },
  emptyTitle: {
    fontWeight: '700',
    color: tokens.colors.textPrimary,
    marginTop: tokens.spacing.sm,
    fontSize: tokens.typography.fontMd,
  },
  emptySub: {
    textAlign: 'center',
    marginTop: 4,
    marginBottom: tokens.spacing.md,
  },
  cadastrarBtn: {
    backgroundColor: '#111827',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radii.md,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cadastrarBtnText: {
    color: tokens.colors.white,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: tokens.spacing.md,
    paddingTop: tokens.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border,
  },
  buttonInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  reporButton: {
    backgroundColor: tokens.colors.primary,
    paddingVertical: tokens.spacing.sm + 2,
    borderRadius: tokens.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginBottom: tokens.spacing.xs,
  },
  reporButtonText: {
    fontWeight: '700',
    color: tokens.colors.white,
    fontSize: tokens.typography.fontSm,
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
