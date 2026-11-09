import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { tokens } from '@/components/primitives/tokens';
import { ThemedText } from '@/components/primitives/ThemedText';
import { VendaHistorico } from '../types';

interface ModalDetalheVendaProps {
  venda: VendaHistorico | null;
  visible: boolean;
  onClose: () => void;
}

function parseModificadores(json?: string | null): Array<{
  Nome?: string;
  nome?: string;
  PrecoAdicional?: number;
  precoAdicional?: number;
}> {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function ModalDetalheVenda({ venda, visible, onClose }: ModalDetalheVendaProps) {
  if (!venda) return null;

  const dataFormatada = new Date(venda.dataHora).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const totalFormatado = `R$ ${Number(venda.valorTotal || 0).toFixed(2).replace('.', ',')}`;
  const codigoVenda = `#${venda.vendaId.substring(0, 8).toUpperCase()}`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Cabeçalho do Cupom */}
          <View style={styles.header}>
            <View>
              <ThemedText variant="subtitle" weight="bold" style={styles.titulo}>
                Comprovante de Venda
              </ThemedText>
              <ThemedText variant="caption" style={styles.codigo}>
                {codigoVenda} • {dataFormatada}
              </ThemedText>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.btnFecharX}
            >
              <ThemedText variant="subtitle" weight="bold" style={styles.fecharTexto}>
                ✕
              </ThemedText>
            </Pressable>
          </View>

          <View style={styles.divisorTracejado} />

          {/* Itens do Pedido */}
          <ThemedText variant="caption" weight="bold" style={styles.secaoTitulo}>
            ITENS CONSUMIDOS ({venda.itens?.length || 0})
          </ThemedText>

          <ScrollView style={styles.itensScroll} showsVerticalScrollIndicator={false}>
            {venda.itens?.map((item, idx) => {
              const modificadores = parseModificadores(item.modificadoresJson);
              return (
                <View key={item.id || idx} style={styles.itemLinha}>
                  <View style={styles.itemInfo}>
                    <ThemedText variant="body" weight="medium" style={styles.itemNome}>
                      {item.quantidade}x {item.nomeProduto}
                    </ThemedText>
                    {modificadores.length > 0 && (
                      <View style={styles.tagsContainer}>
                        {modificadores.map((m, mIdx) => {
                          const nome = m.Nome || m.nome || '';
                          const preco = Number(m.PrecoAdicional ?? m.precoAdicional ?? 0);
                          const isAdicional = preco > 0;
                          return (
                            <View
                              key={mIdx}
                              style={[
                                styles.tagModificador,
                                isAdicional ? styles.tagAdicional : styles.tagCulinario,
                              ]}
                            >
                              <ThemedText
                                variant="caption"
                                style={[
                                  styles.tagTexto,
                                  isAdicional ? styles.tagTextoAdicional : styles.tagTextoCulinario,
                                ]}
                              >
                                {isAdicional
                                  ? `+ ${nome} (+R$ ${preco.toFixed(2).replace('.', ',')})`
                                  : nome}
                              </ThemedText>
                            </View>
                          );
                        })}
                      </View>
                    )}
                    <ThemedText variant="caption" style={styles.itemUnitario}>
                      R$ {Number(item.precoUnitario || 0).toFixed(2).replace('.', ',')} un.
                    </ThemedText>
                  </View>
                  <ThemedText variant="body" weight="bold" style={styles.itemSubtotal}>
                    R$ {Number(item.subtotal || 0).toFixed(2).replace('.', ',')}
                  </ThemedText>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.divisor} />

          {/* Resumo Financeiro */}
          <View style={styles.financeiroLinha}>
            <ThemedText variant="body" style={styles.rotulo}>
              Forma de Pagamento:
            </ThemedText>
            <ThemedText variant="body" weight="bold" style={styles.valorTexto}>
              {venda.formaPagamento}
            </ThemedText>
          </View>

          <View style={styles.financeiroLinha}>
            <ThemedText variant="body" style={styles.rotulo}>
              Status da Operação:
            </ThemedText>
            <View style={styles.statusBadge}>
              <ThemedText variant="caption" weight="bold" style={styles.statusTexto}>
                ● {venda.status}
              </ThemedText>
            </View>
          </View>

          <View style={[styles.financeiroLinha, styles.totalDestaque]}>
            <ThemedText variant="subtitle" weight="bold" style={styles.totalRotulo}>
              TOTAL PAGO
            </ThemedText>
            <ThemedText variant="title" weight="bold" style={styles.totalValor}>
              {totalFormatado}
            </ThemedText>
          </View>

          {/* Botão de Fechar */}
          <Pressable
            style={({ pressed }) => [styles.btnFechar, pressed && styles.btnPressed]}
            onPress={onClose}
          >
            <ThemedText variant="body" weight="bold" style={styles.btnFecharLabel}>
              Fechar Detalhes
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.lg,
  },
  container: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titulo: {
    color: tokens.colors.textPrimary,
  },
  codigo: {
    color: tokens.colors.textSecondary,
    marginTop: 2,
  },
  btnFecharX: {
    padding: 6,
  },
  fecharTexto: {
    color: tokens.colors.textSecondary,
    fontSize: 18,
  },
  divisorTracejado: {
    height: 1,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderStyle: 'dashed',
    marginVertical: tokens.spacing.md,
  },
  divisor: {
    height: 1,
    backgroundColor: tokens.colors.border,
    marginVertical: tokens.spacing.md,
  },
  secaoTitulo: {
    color: tokens.colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: tokens.spacing.sm,
  },
  itensScroll: {
    maxHeight: 220,
  },
  itemLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.colors.border,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemNome: {
    color: tokens.colors.textPrimary,
  },
  itemUnitario: {
    color: tokens.colors.textSecondary,
    marginTop: 2,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
    marginBottom: 2,
  },
  tagModificador: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: tokens.radii.sm,
  },
  tagCulinario: {
    backgroundColor: '#F3F4F6',
  },
  tagAdicional: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tagTexto: {
    fontSize: 10,
  },
  tagTextoCulinario: {
    color: '#4B5563',
  },
  tagTextoAdicional: {
    color: '#92400E',
    fontWeight: '600',
  },
  itemSubtotal: {
    color: tokens.colors.textPrimary,
  },
  financeiroLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rotulo: {
    color: tokens.colors.textSecondary,
  },
  valorTexto: {
    color: tokens.colors.textPrimary,
  },
  statusBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: tokens.radii.sm,
  },
  statusTexto: {
    color: '#2E7D32',
    fontSize: 12,
  },
  totalDestaque: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border,
  },
  totalRotulo: {
    color: tokens.colors.textPrimary,
  },
  totalValor: {
    color: tokens.colors.primary,
  },
  btnFechar: {
    backgroundColor: tokens.colors.background,
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: tokens.spacing.lg,
    minHeight: 48,
    justifyContent: 'center',
  },
  btnPressed: {
    opacity: 0.8,
  },
  btnFecharLabel: {
    color: tokens.colors.textPrimary,
  },
});
