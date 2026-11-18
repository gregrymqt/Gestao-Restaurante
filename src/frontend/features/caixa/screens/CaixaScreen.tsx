import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { tokens } from '@/components/primitives/tokens';
import { ThemedText } from '@/components/primitives/ThemedText';
import { useSseStatus } from '@/shared';
import { useAbrirCaixa, useCaixaAtual } from '../hooks/useCaixaAtual';
import { useFecharCaixa } from '../hooks/useFecharCaixa';
import { useMovimentacaoCaixa } from '../hooks/useMovimentacaoCaixa';
import { ContextoOperacionalHeader } from '../components/ContextoOperacionalHeader';
import { CardFaturamentoTotal } from '../components/CardFaturamentoTotal';
import { BotoesMovimentacaoTurno } from '../components/BotoesMovimentacaoTurno';
import { DistribuicaoPagamentos } from '../components/DistribuicaoPagamentos';
import { ModalConfirmarFechamento } from '../components/ModalConfirmarFechamento';
import { ModalMovimentacaoCaixa } from '@/features/perfil/components/ModalMovimentacaoCaixa';
import { TipoMovimentacaoCaixa } from '@/features/perfil/types';

export function CaixaScreen() {
  const router = useRouter();
  const [isModalFechamentoVisivel, setIsModalFechamentoVisivel] = useState(false);
  const [isModalMovimentacaoVisivel, setIsModalMovimentacaoVisivel] = useState(false);
  const [tipoMovimentacao, setTipoMovimentacao] = useState<TipoMovimentacaoCaixa>('SUPRIMENTO');

  const sseStatus = useSseStatus((state) => state.status);
  const isOffline = sseStatus !== 'CONNECTED';

  const { sessao, isLoading, refetch } = useCaixaAtual();
  const { mutate: dispararAbertura, isPending: isAbrindo } = useAbrirCaixa();

  const { mutate: dispararFechamento, isPending: isFechando } = useFecharCaixa({
    onSuccessCallback: () => {
      setIsModalFechamentoVisivel(false);
    },
  });

  const saldoDinheiro =
    sessao.pagamentos.find((p) => p.tipo === 'Dinheiro')?.valor ?? 0;

  const { mutateAsync: dispararMovimentacao, isPending: isMovimentando } =
    useMovimentacaoCaixa(saldoDinheiro);

  const handleConfirmarFechamento = () => {
    dispararFechamento();
  };

  const handleAbrirSuprimento = () => {
    setTipoMovimentacao('SUPRIMENTO');
    setIsModalMovimentacaoVisivel(true);
  };

  const handleAbrirSangria = () => {
    setTipoMovimentacao('SANGRIA');
    setIsModalMovimentacaoVisivel(true);
  };

  const handleSubmitMovimentacao = async (dados: { valor: number; motivo: string }) => {
    try {
      await dispararMovimentacao({
        tipo: tipoMovimentacao,
        valor: dados.valor,
        motivo: dados.motivo,
      });
      setIsModalMovimentacaoVisivel(false);
    } catch {
      // O hook gerencia a notificação de erro via AppDialog
    }
  };

  const isCaixaAberto = sessao.status === 'Aberta';
  const acaoDesabilitada =
    isLoading || isAbrindo || isFechando || (isCaixaAberto && isOffline);

  const textoAcao =
    isCaixaAberto && isOffline
      ? 'Conexão necessária para encerrar'
      : isAbrindo
      ? 'Abrindo caixa…'
      : isCaixaAberto
      ? 'Encerrar Sessão e Fechar Caixa'
      : 'Abrir Caixa';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header Compacto Fixo de Contexto Operacional (52px) */}
        <ContextoOperacionalHeader
          status={sessao.status}
          terminal={sessao.terminal}
          dataHora={sessao.dataHoraFormatada}
          turno={sessao.turno}
          operador={sessao.operador}
          isOffline={isOffline}
          onPressVoltar={() => router.push('/(tabs)')}
        />

        {/* Conteúdo com Rolagem Vertical */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => { void refetch(); }}
              colors={[tokens.colors.primary]}
              tintColor={tokens.colors.primary}
            />
          }
        >
          {/* Metadados Operacionais Scrolláveis */}
          <View style={styles.metaRow}>
            <ThemedText variant="caption" style={styles.metaTexto}>
              {sessao.terminal} • Abertura {sessao.dataHoraFormatada} • {sessao.operador}
            </ThemedText>
          </View>

          {/* Card 1: Faturamento Consolidado */}
          <CardFaturamentoTotal
            totalApurado={sessao.totalApurado}
            percentualMeta={sessao.percentualMeta}
            totalVendas={sessao.totalVendas}
            ticketMedio={sessao.ticketMedio}
          />

          {/* Ações Operacionais de Turno: Suprimento e Sangria */}
          <BotoesMovimentacaoTurno
            onSuprimento={handleAbrirSuprimento}
            onSangria={handleAbrirSangria}
            disabled={!isCaixaAberto}
          />

          {/* Card 2: Distribuição dos 4 Métodos de Pagamento */}
          <DistribuicaoPagamentos pagamentos={sessao.pagamentos} />

          {/* Ação de Encerramento / Abertura de Caixa */}
          <View style={styles.acaoRodapeContainer}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={textoAcao}
              accessibilityState={{
                disabled: acaoDesabilitada,
                busy: isAbrindo || isFechando,
              }}
              disabled={acaoDesabilitada}
              style={({ pressed }) => [
                styles.botaoEncerrar,
                acaoDesabilitada && styles.botaoEncerrarDesabilitado,
                pressed && !acaoDesabilitada && styles.botaoEncerrarPressionado,
              ]}
              onPress={() => {
                if (isCaixaAberto) setIsModalFechamentoVisivel(true);
                else dispararAbertura();
              }}
            >
              <ThemedText
                variant="subtitle"
                weight="bold"
                color={tokens.colors.white}
                style={styles.textoBotao}
              >
                {textoAcao}
              </ThemedText>
            </Pressable>

            {isCaixaAberto && (
              <ThemedText variant="caption" style={styles.microcopiaRodape}>
                O encerramento consolida o histórico de vendas e dispara o
                processamento preditivo de inteligência artificial.
              </ThemedText>
            )}
          </View>
        </ScrollView>

        {/* Modal Seguro de Confirmação com Dupla Etapa */}
        <ModalConfirmarFechamento
          visible={isModalFechamentoVisivel}
          sessao={sessao}
          isPending={isFechando}
          onConfirmar={handleConfirmarFechamento}
          onClose={() => setIsModalFechamentoVisivel(false)}
        />

        {/* Modal de Movimentação de Caixa (Suprimento / Sangria) */}
        <ModalMovimentacaoCaixa
          visible={isModalMovimentacaoVisivel}
          tipo={tipoMovimentacao}
          saldoDisponivel={saldoDinheiro}
          isSubmitting={isMovimentando}
          onClose={() => setIsModalMovimentacaoVisivel(false)}
          onSubmit={handleSubmitMovimentacao}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.card,
  },
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  scrollContent: {
    paddingBottom: tokens.spacing.xxl,
  },
  metaRow: {
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.md,
    paddingBottom: tokens.spacing.xs,
  },
  metaTexto: {
    fontSize: tokens.typography.fontXs,
    color: tokens.colors.textMuted,
  },
  acaoRodapeContainer: {
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xl,
  },
  botaoEncerrar: {
    height: 54,
    borderRadius: 14,
    backgroundColor: tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.sm,
  },
  botaoEncerrarDesabilitado: {
    backgroundColor: tokens.colors.textMuted,
    opacity: 0.6,
  },
  botaoEncerrarPressionado: {
    backgroundColor: tokens.colors.primaryDark,
    opacity: 0.88,
  },
  textoBotao: {
    fontSize: tokens.typography.fontMd,
  },
  microcopiaRodape: {
    textAlign: 'center',
    color: tokens.colors.textMuted,
    fontSize: tokens.typography.fontXs,
    lineHeight: 16,
    paddingHorizontal: tokens.spacing.md,
  },
});
