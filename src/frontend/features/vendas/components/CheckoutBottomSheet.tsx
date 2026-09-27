import React, { useState, useMemo, useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { tokens } from '@/components/primitives/tokens';
import { ThemedText } from '@/components/primitives/ThemedText';
import { FormaPagamento } from '../types';
import { useCarrinho } from '../hooks/useCarrinho';
import { useRegistrarVenda } from '../hooks/useRegistrarVenda';
import { ResumoComandaBox } from './ResumoComandaBox';
import { GradeFormasPagamento } from './GradeFormasPagamento';
import { PainelDinheiroTroco } from './PainelDinheiroTroco';

interface CheckoutBottomSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function CheckoutBottomSheet({ visible, onClose }: CheckoutBottomSheetProps) {
  const itens = useCarrinho((state) => state.itens);
  const totalItens = useCarrinho((state) => state.obterTotalItens());
  const subtotal = useCarrinho((state) => state.obterSubtotal());
  const comandaAtiva = useCarrinho((state) => state.comandaAtiva);

  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('Dinheiro');
  const [valorRecebidoInput, setValorRecebidoInput] = useState<string>('');
  const [pilulaSelecionada, setPilulaSelecionada] = useState<string>('');

  // Sugestões dinâmicas de cédulas com base no subtotal da comanda
  const pilulasCalculadas = useMemo(() => {
    if (subtotal <= 0) return [];

    const proximaDezena = Math.ceil(subtotal / 10) * 10;
    const valor1 = proximaDezena === subtotal ? proximaDezena + 10 : proximaDezena;
    const valor2 = Math.ceil((subtotal + 1) / 50) * 50;
    const valorFinal2 = valor2 <= valor1 ? valor1 + 10 : valor2;

    return [
      { id: 'p1', label: `+ R$ ${valor1.toFixed(2).replace('.', ',')}`, valor: valor1 },
      { id: 'p2', label: `+ R$ ${valorFinal2.toFixed(2).replace('.', ',')}`, valor: valorFinal2 },
      { id: 'exato', label: `Valor Exato (R$ ${subtotal.toFixed(2).replace('.', ',')})`, valor: subtotal },
    ];
  }, [subtotal]);

  // Ao abrir o modal, define a sugestão padrão de dinheiro
  useEffect(() => {
    if (visible && subtotal > 0 && pilulasCalculadas.length > 1) {
      const sugestaoInicial = pilulasCalculadas[1] || pilulasCalculadas[0];
      setValorRecebidoInput(sugestaoInicial.valor.toFixed(2));
      setPilulaSelecionada(sugestaoInicial.id);
    }
  }, [visible, subtotal, pilulasCalculadas]);

  const valorRecebidoNumerico = useMemo(() => {
    const parseado = parseFloat(valorRecebidoInput.replace(',', '.'));
    return isNaN(parseado) ? 0 : parseado;
  }, [valorRecebidoInput]);

  const troco = useMemo(() => {
    if (formaPagamento !== 'Dinheiro') return 0;
    const diferenca = valorRecebidoNumerico - subtotal;
    return diferenca > 0 ? Number(diferenca.toFixed(2)) : 0;
  }, [formaPagamento, valorRecebidoNumerico, subtotal]);

  const isValorInsuficiente =
    formaPagamento === 'Dinheiro' && valorRecebidoNumerico < subtotal;

  const { mutate: dispararVenda, isPending } = useRegistrarVenda({
    troco: formaPagamento === 'Dinheiro' ? troco : undefined,
    onSuccessCallback: () => {
      onClose();
    },
  });

  const handleConfirmar = () => {
    if (totalItens === 0 || isValorInsuficiente || isPending) return;

    dispararVenda({
      formaPagamento,
      itens: itens.map((i) => ({
        produtoId: i.produto.id,
        quantidade: i.quantidade,
      })),
    });
  };

  const handleSelecionarPilula = (id: string, valor: number) => {
    setPilulaSelecionada(id);
    setValorRecebidoInput(valor.toFixed(2));
  };

  const nomesResumo = useMemo(() => {
    return itens.map((i) => i.produto.nome).join(', ');
  }, [itens]);

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar modal de cobrança"
          style={styles.backdrop}
          onPress={onClose}
        />

        <View style={styles.bottomSheet}>
          {/* Drag Handle Indicator */}
          <View style={styles.dragIndicator} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header com Comanda e Ação de Fechar */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <ThemedText variant="title" style={styles.tituloComanda}>
                  Fechar Comanda {comandaAtiva}
                </ThemedText>
                <View style={styles.badgeMesa}>
                  <ThemedText variant="caption" style={styles.textoBadgeMesa}>
                    Mesa / Balcão
                  </ThemedText>
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fechar modal"
                style={styles.botaoFechar}
                onPress={onClose}
              >
                <ThemedText variant="subtitle" style={styles.textoFechar}>
                  ✕
                </ThemedText>
              </Pressable>
            </View>

            {/* Subcomponente 1: Resumo da Comanda e Total */}
            <ResumoComandaBox
              totalItens={totalItens}
              subtotal={subtotal}
              nomesResumo={nomesResumo}
            />

            {/* Subcomponente 2: Seletor de Formas de Pagamento */}
            <GradeFormasPagamento
              formaPagamento={formaPagamento}
              aoSelecionarForma={setFormaPagamento}
            />

            {/* Subcomponente 3: Painel Dinâmico de Troco em Espécie */}
            {formaPagamento === 'Dinheiro' && (
              <PainelDinheiroTroco
                subtotal={subtotal}
                valorRecebidoInput={valorRecebidoInput}
                aoMudarValorRecebido={(val) => {
                  setPilulaSelecionada('');
                  setValorRecebidoInput(val);
                }}
                pilulasCalculadas={pilulasCalculadas}
                pilulaSelecionada={pilulaSelecionada}
                aoSelecionarPilula={handleSelecionarPilula}
                troco={troco}
                isValorInsuficiente={isValorInsuficiente}
                valorRecebidoNumerico={valorRecebidoNumerico}
              />
            )}

            {/* Botão de Confirmação da Venda */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Confirmar pagamento e emitir venda"
              accessibilityState={{ disabled: isValorInsuficiente || isPending || totalItens === 0 }}
              disabled={isValorInsuficiente || isPending || totalItens === 0}
              style={({ pressed }) => [
                styles.botaoConfirmar,
                (isValorInsuficiente || totalItens === 0) && styles.botaoConfirmarDesabilitado,
                pressed && !isValorInsuficiente && styles.botaoConfirmarPressionado,
              ]}
              onPress={handleConfirmar}
            >
              {isPending ? (
                <ActivityIndicator color={tokens.colors.white} />
              ) : (
                <View style={styles.botaoConfirmarConteudo}>
                  <ThemedText variant="title" style={styles.iconeImpressora}>
                    🖨️
                  </ThemedText>
                  <ThemedText
                    variant="subtitle"
                    weight="bold"
                    color={tokens.colors.white}
                    style={styles.textoConfirmar}
                  >
                    Confirmar Pagamento e Emitir Venda
                  </ThemedText>
                </View>
              )}
            </Pressable>

            {/* Microcópia de Transparência Operacional */}
            <ThemedText variant="caption" style={styles.microcopiaRodape}>
              A confirmação deduz imediatamente os insumos do estoque no servidor.
            </ThemedText>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: tokens.colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.sm,
    paddingBottom: tokens.spacing.xl,
    maxHeight: '90%',
  },
  dragIndicator: {
    width: 44,
    height: 4,
    backgroundColor: '#D9D9D9',
    borderRadius: tokens.radii.full,
    alignSelf: 'center',
    marginBottom: tokens.spacing.md,
  },
  scrollContent: {
    paddingBottom: tokens.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    flex: 1,
  },
  tituloComanda: {
    fontSize: tokens.typography.fontXl,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
  badgeMesa: {
    backgroundColor: '#F4F4F4',
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 3,
    borderRadius: tokens.radii.full,
  },
  textoBadgeMesa: {
    color: tokens.colors.textSecondary,
    fontSize: tokens.typography.fontXs,
    fontWeight: '500',
  },
  botaoFechar: {
    width: 44,
    height: 44,
    borderRadius: tokens.radii.full,
    backgroundColor: '#F4F4F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoFechar: {
    color: tokens.colors.textSecondary,
    fontSize: tokens.typography.fontMd,
    fontWeight: '700',
  },
  botaoConfirmar: {
    height: 54,
    borderRadius: 14,
    backgroundColor: tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.sm,
  },
  botaoConfirmarDesabilitado: {
    opacity: 0.5,
    backgroundColor: tokens.colors.textMuted,
  },
  botaoConfirmarPressionado: {
    opacity: 0.88,
    backgroundColor: tokens.colors.primaryDark,
  },
  botaoConfirmarConteudo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  iconeImpressora: {
    fontSize: tokens.typography.fontLg,
  },
  textoConfirmar: {
    fontSize: tokens.typography.fontMd,
    fontWeight: '700',
  },
  microcopiaRodape: {
    textAlign: 'center',
    color: tokens.colors.textMuted,
    fontSize: tokens.typography.fontXs,
    marginTop: tokens.spacing.xs,
  },
});
