import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Pressable,
  ScrollView,
  Platform,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { tokens } from '@/components/primitives/tokens';
import { ThemedText } from '@/components/primitives/ThemedText';
import { FormaPagamento } from '../types';
import { useCarrinho } from '../hooks/useCarrinho';
import { useRegistrarVenda } from '../hooks/useRegistrarVenda';
import { useConnectionStore } from '@/shared/hooks/useConnectionStore';
import { ResumoComandaBox } from './ResumoComandaBox';
import { GradeFormasPagamento } from './GradeFormasPagamento';
import { PainelDinheiroTroco } from './PainelDinheiroTroco';
import { CheckoutFooter } from './CheckoutFooter';
import { checkoutStyles as styles } from './CheckoutBottomSheet.styles';
import {
  calcularPilulasSugestao,
  mapearItensParaVenda,
} from '../utils/checkoutHelpers';

interface CheckoutBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onRedirecionarKds?: () => void;
}

export function CheckoutBottomSheet({
  visible,
  onClose,
  onRedirecionarKds,
}: CheckoutBottomSheetProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const paddingInferior = Math.max(insets.bottom, 16) + (Platform.OS === 'web' ? 16 : 0);
  const isApiOnline = useConnectionStore((state) => state.isApiOnline);
  const itens = useCarrinho((state) => state.itens);
  const removerItem = useCarrinho((state) => state.removerItem);
  const totalItens = useCarrinho((state) => state.obterTotalItens());
  const subtotal = useCarrinho((state) => state.obterSubtotal());
  const comandaAtiva = useCarrinho((state) => state.comandaAtiva);

  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('Dinheiro');
  const [valorRecebidoInput, setValorRecebidoInput] = useState<string>('');
  const [pilulaSelecionada, setPilulaSelecionada] = useState<string>('');
  const [isSucesso, setIsSucesso] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!visible) {
      setIsSucesso(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  }, [visible]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Sugestões dinâmicas de cédulas com base no subtotal da comanda
  const pilulasCalculadas = useMemo(
    () => calcularPilulasSugestao(subtotal),
    [subtotal]
  );

  // Ao abrir o modal, define a sugestão padrão de dinheiro formatada com vírgula pt-BR
  useEffect(() => {
    if (visible && subtotal > 0 && pilulasCalculadas.length > 1) {
      const sugestaoInicial = pilulasCalculadas[1] || pilulasCalculadas[0];
      setValorRecebidoInput(sugestaoInicial.valor.toFixed(2).replace('.', ','));
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
    skipDialog: true,
    onSuccessCallback: () => {
      setIsSucesso(true);

      // Pulso sutil de feedback visual (escala 1 -> 1.03 -> 1)
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.03,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();

      // Transição fluida: aguarda o pulso de confirmação, fecha o modal e redireciona direto ao KDS
      timeoutRef.current = setTimeout(() => {
        onClose();
        if (onRedirecionarKds) {
          onRedirecionarKds();
        } else {
          router.push('/kds');
        }
      }, 450);
    },
  });

  const handleConfirmar = () => {
    if (totalItens === 0 || isValorInsuficiente || isPending || isSucesso) return;

    dispararVenda({
      formaPagamento,
      itens: mapearItensParaVenda(itens),
    });
  };

  const handleSelecionarPilula = (id: string, valor: number) => {
    setPilulaSelecionada(id);
    setValorRecebidoInput(valor.toFixed(2).replace('.', ','));
  };

  const handleLimparValorRecebido = () => {
    setPilulaSelecionada('');
    setValorRecebidoInput('');
  };

  const handleRemoverItem = (itemId: string) => {
    removerItem(itemId);
    if (totalItens - 1 <= 0) {
      onClose();
    }
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

        <View style={[styles.bottomSheet, { paddingBottom: paddingInferior }]}>
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
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.botaoFechar}
                onPress={onClose}
              >
                <X size={18} color={tokens.colors.textSecondary} />
              </Pressable>
            </View>

            {/* Subcomponente 1: Resumo da Comanda e Total com exclusão por linha */}
            <ResumoComandaBox
              totalItens={totalItens}
              subtotal={subtotal}
              nomesResumo={nomesResumo}
              itens={itens}
              onRemoverItem={handleRemoverItem}
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
                aoLimpar={handleLimparValorRecebido}
                pilulasCalculadas={pilulasCalculadas}
                pilulaSelecionada={pilulaSelecionada}
                aoSelecionarPilula={handleSelecionarPilula}
                troco={troco}
                isValorInsuficiente={isValorInsuficiente}
                valorRecebidoNumerico={valorRecebidoNumerico}
              />
            )}
          </ScrollView>

          {/* Rodapé Fixo Fora do ScrollView */}
          <CheckoutFooter
            isPending={isPending}
            isSucesso={isSucesso}
            isApiOnline={isApiOnline}
            isDesabilitado={isValorInsuficiente || totalItens === 0 || !isApiOnline}
            isValorInsuficiente={isValorInsuficiente}
            scaleAnim={scaleAnim}
            onConfirmar={handleConfirmar}
          />
        </View>
      </View>
    </Modal>
  );
}
