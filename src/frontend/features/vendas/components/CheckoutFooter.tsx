import React from 'react';
import { View, Pressable, ActivityIndicator, Animated } from 'react-native';
import { Printer, WifiOff, CheckCircle2 } from 'lucide-react-native';
import { tokens } from '@/components/primitives/tokens';
import { ThemedText } from '@/components/primitives/ThemedText';
import { checkoutStyles as styles } from './CheckoutBottomSheet.styles';

interface CheckoutFooterProps {
  isPending: boolean;
  isSucesso: boolean;
  isApiOnline: boolean;
  isDesabilitado: boolean;
  isValorInsuficiente: boolean;
  scaleAnim: Animated.Value;
  onConfirmar: () => void;
}

export function CheckoutFooter({
  isPending,
  isSucesso,
  isApiOnline,
  isDesabilitado,
  isValorInsuficiente,
  scaleAnim,
  onConfirmar,
}: CheckoutFooterProps) {
  const disabled = isDesabilitado || isPending || isSucesso;

  return (
    <View style={styles.footerFixo}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            isSucesso
              ? 'Pagamento aprovado, redirecionando para a cozinha'
              : !isApiOnline
              ? 'Servidor offline - emissão bloqueada'
              : 'Confirmar pagamento e emitir venda'
          }
          accessibilityState={{ disabled }}
          disabled={disabled}
          hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
          style={({ pressed }) => [
            styles.botaoConfirmar,
            isSucesso && styles.botaoConfirmarSucesso,
            isDesabilitado && !isSucesso && styles.botaoConfirmarDesabilitado,
            pressed && !isValorInsuficiente && isApiOnline && !isSucesso && styles.botaoConfirmarPressionado,
          ]}
          onPress={onConfirmar}
        >
          {isPending ? (
            <View style={styles.botaoConfirmarConteudo}>
              <ActivityIndicator color={tokens.colors.white} />
              <ThemedText
                variant="subtitle"
                weight="bold"
                color={tokens.colors.white}
                style={styles.textoConfirmar}
              >
                Processando Pagamento...
              </ThemedText>
            </View>
          ) : isSucesso ? (
            <View style={styles.botaoConfirmarConteudo}>
              <CheckCircle2 size={20} color={tokens.colors.white} />
              <ThemedText
                variant="subtitle"
                weight="bold"
                color={tokens.colors.white}
                style={styles.textoConfirmar}
              >
                Pagamento Aprovado! Abrindo KDS...
              </ThemedText>
            </View>
          ) : (
            <View style={styles.botaoConfirmarConteudo}>
              {!isApiOnline ? (
                <WifiOff size={20} color={tokens.colors.white} />
              ) : (
                <Printer size={20} color={tokens.colors.white} />
              )}
              <ThemedText
                variant="subtitle"
                weight="bold"
                color={tokens.colors.white}
                style={styles.textoConfirmar}
              >
                {!isApiOnline
                  ? 'Servidor Offline - Venda Suspensa'
                  : 'Confirmar Pagamento e Emitir Venda'}
              </ThemedText>
            </View>
          )}
        </Pressable>
      </Animated.View>

      {/* Microcópia de Transparência Operacional */}
      <ThemedText variant="caption" style={styles.microcopiaRodape}>
        {isSucesso
          ? '✅ Pedido enviado instantaneamente para a fila de produção da cozinha.'
          : !isApiOnline
          ? 'Conectividade interrompida: aguarde a reconexão para emitir a venda e atualizar o estoque.'
          : 'A confirmação deduz imediatamente os insumos do estoque no servidor.'}
      </ThemedText>
    </View>
  );
}
