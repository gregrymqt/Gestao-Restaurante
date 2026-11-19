import React, { useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShoppingBag, Trash2, Minus, Plus, X } from 'lucide-react-native';
import { tokens } from '@/components/primitives/tokens';
import { ThemedText } from '@/components/primitives/ThemedText';
import { useCarrinho } from '../hooks/useCarrinho';
import { ItemComanda } from '../types';

interface RevisaoComandaSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function RevisaoComandaSheet({ visible, onClose }: RevisaoComandaSheetProps) {
  const insets = useSafeAreaInsets();
  const paddingInferior = Math.max(insets.bottom, 16) + (Platform.OS === 'web' ? 16 : 0);

  const itens = useCarrinho((s) => s.itens);
  const removerItem = useCarrinho((s) => s.removerItem);
  const alterarQuantidade = useCarrinho((s) => s.alterarQuantidade);
  const totalItens = useCarrinho((s) => s.obterTotalItens());
  const subtotalFormatado = useCarrinho((s) => s.obterSubtotalFormatado());

  // Auto-fecha quando o carrinho esvaziar
  useEffect(() => {
    if (visible && itens.length === 0) {
      onClose();
    }
  }, [visible, itens.length, onClose]);

  const handleDiminuir = (item: ItemComanda) => {
    if (item.quantidade <= 1) {
      removerItem(item.id);
    } else {
      alterarQuantidade(item.id, item.quantidade - 1);
    }
  };

  const handleAumentar = (item: ItemComanda) => {
    alterarQuantidade(item.id, item.quantidade + 1);
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar revisão da comanda"
          style={styles.backdrop}
          onPress={onClose}
        />

        <View style={[styles.bottomSheet, { paddingBottom: paddingInferior }]}>
          <View style={styles.dragIndicator} />

          {/* Cabeçalho */}
          <View style={styles.header}>
            <View style={styles.headerTituloRow}>
              <View style={styles.iconCircle}>
                <ShoppingBag size={18} color={tokens.colors.primary} />
              </View>
              <View>
                <ThemedText variant="subtitle" weight="bold">
                  Revisar Comanda
                </ThemedText>
                <ThemedText variant="caption" color={tokens.colors.textMuted}>
                  {totalItens} {totalItens === 1 ? 'item adicionado' : 'itens adicionados'}
                </ThemedText>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.botaoFechar}
              onPress={onClose}
            >
              <X size={18} color={tokens.colors.textMuted} />
            </Pressable>
          </View>

          {/* Lista de Itens */}
          <ScrollView
            style={styles.scrollList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {itens.map((item) => {
              const precoUnitarioStr = item.precoUnitarioEfetivo.toFixed(2).replace('.', ',');
              const subtotalStr = item.subtotal.toFixed(2).replace('.', ',');

              return (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemHeaderRow}>
                    <ThemedText
                      variant="body"
                      weight="bold"
                      style={styles.itemNome}
                      numberOfLines={1}
                    >
                      {item.produto.nome}
                    </ThemedText>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Excluir ${item.produto.nome}`}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      style={styles.btnExcluir}
                      onPress={() => removerItem(item.id)}
                    >
                      <Trash2 size={16} color={tokens.colors.status.redText} />
                    </Pressable>
                  </View>

                  {/* Modificadores / Observações se houver */}
                  {item.modificadores.length > 0 && (
                    <ThemedText
                      variant="caption"
                      color={tokens.colors.textMuted}
                      style={styles.itemModificadores}
                    >
                      {item.modificadores
                        .map((m) =>
                          Number(m.precoAdicional) > 0
                            ? `+ ${m.nome} (+R$ ${Number(m.precoAdicional)
                                .toFixed(2)
                                .replace('.', ',')})`
                            : m.nome
                        )
                        .join(' • ')}
                    </ThemedText>
                  )}

                  {/* Linha inferior: Stepper + Preço Total */}
                  <View style={styles.itemFooterRow}>
                    <View style={styles.stepperContainer}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Diminuir quantidade"
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={styles.stepperBtn}
                        onPress={() => handleDiminuir(item)}
                      >
                        {item.quantidade === 1 ? (
                          <Trash2 size={14} color={tokens.colors.status.redText} />
                        ) : (
                          <Minus size={14} color={tokens.colors.textSecondary} />
                        )}
                      </Pressable>

                      <ThemedText variant="body" weight="bold" style={styles.stepperQtd}>
                        {item.quantidade}
                      </ThemedText>

                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Aumentar quantidade"
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={styles.stepperBtn}
                        onPress={() => handleAumentar(item)}
                      >
                        <Plus size={14} color={tokens.colors.primary} />
                      </Pressable>
                    </View>

                    <View style={styles.precoCol}>
                      <ThemedText variant="caption" color={tokens.colors.textMuted}>
                        Unit. R$ {precoUnitarioStr}
                      </ThemedText>
                      <ThemedText variant="body" weight="bold" style={styles.subtotalItem}>
                        R$ {subtotalStr}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Rodapé Fixo */}
          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <ThemedText variant="body" color={tokens.colors.textSecondary}>
                Total da Comanda
              </ThemedText>
              <ThemedText variant="price" color={tokens.colors.primary}>
                {subtotalFormatado}
              </ThemedText>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Concluir revisão"
              style={({ pressed }) => [styles.btnConcluir, pressed && styles.btnPressionado]}
              onPress={onClose}
            >
              <ThemedText variant="body" weight="bold" color={tokens.colors.white}>
                Continuar Pedido
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  bottomSheet: {
    backgroundColor: tokens.colors.card,
    borderTopLeftRadius: tokens.radii.lg,
    borderTopRightRadius: tokens.radii.lg,
    paddingTop: tokens.spacing.sm,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  dragIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: tokens.colors.border,
    alignSelf: 'center',
    marginBottom: tokens.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: tokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  headerTituloRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: tokens.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoFechar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: tokens.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollList: {
    flexGrow: 0,
    maxHeight: 380,
  },
  scrollContent: {
    padding: tokens.spacing.lg,
    gap: tokens.spacing.sm,
  },
  itemCard: {
    backgroundColor: tokens.colors.background,
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.md,
    gap: tokens.spacing.xs,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemNome: {
    flex: 1,
    color: tokens.colors.textPrimary,
    marginRight: tokens.spacing.sm,
  },
  btnExcluir: {
    padding: 4,
  },
  itemModificadores: {
    fontSize: 11,
    lineHeight: 15,
  },
  itemFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: tokens.spacing.xs,
    paddingTop: tokens.spacing.xs,
    borderTopWidth: 0.5,
    borderTopColor: tokens.colors.border,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radii.sm,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    height: 34,
  },
  stepperBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperQtd: {
    minWidth: 28,
    textAlign: 'center',
    fontSize: 13,
    color: tokens.colors.textPrimary,
  },
  precoCol: {
    alignItems: 'flex-end',
  },
  subtotalItem: {
    fontSize: 14,
    color: tokens.colors.primary,
  },
  footer: {
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.md,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border,
    gap: tokens.spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  btnConcluir: {
    backgroundColor: tokens.colors.primary,
    height: 48,
    borderRadius: tokens.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPressionado: {
    opacity: 0.88,
  },
});
