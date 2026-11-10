import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth';
import { registerUnauthorizedHandler } from '../services/api';
import { sseClient } from '../services/sseClient';
import { useConnectionStore } from './useConnectionStore';
import { useSseStatus } from './useSseStatus';
import {
  TenantStreamEvent,
  SseEventTypes,
  EstoqueCriticoPayload,
  NovoPedidoCozinhaPayload,
} from '../types/sse.types';

export function useRealtimeEvents() {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const tenant = useAuthStore((state) => state.tenant);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);

  const isApiOnline = useConnectionStore((state) => state.isApiOnline);
  const wasOfflineRef = useRef(false);

  const setStatus = useSseStatus((state) => state.setStatus);
  const setLastEventTimestamp = useSseStatus((state) => state.setLastEventTimestamp);
  const showToast = useSseStatus((state) => state.showToast);

  useEffect(() => {
    if (!isApiOnline) {
      wasOfflineRef.current = true;
      return;
    }
    if (wasOfflineRef.current) {
      wasOfflineRef.current = false;
      queryClient.invalidateQueries();
    }
  }, [isApiOnline, queryClient]);

  useEffect(() => {
    registerUnauthorizedHandler(() => logout());

    // Registro dos ouvintes de ciclo de vida do SSE
    const unsubscribeStatus = sseClient.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    const unsubscribeUnauthorized = sseClient.onUnauthorized(() => {
      logout();
    });

    const unsubscribeEvent = sseClient.onEvent((event: TenantStreamEvent) => {
      setLastEventTimestamp(event.timestamp);

      // Invalidação cirúrgica de cache do TanStack Query e emissão de alertas
      switch (event.eventType) {
        case SseEventTypes.ESTOQUE_CRITICO: {
          queryClient.invalidateQueries({ queryKey: ['insumos-estoque'] });
          queryClient.invalidateQueries({ queryKey: ['capacidade-producao'] });

          try {
            const payload: EstoqueCriticoPayload = JSON.parse(event.payloadJson);
            showToast({
              tipo: 'critico',
              titulo: 'Alerta de Estoque Crítico',
              mensagem: `${payload.nomeInsumo} atingiu ${payload.saldoAtual} ${payload.unidadeMedida} (mínimo: ${payload.saldoMinimo}).`,
              icone: '⚠️',
            });
          } catch {
            showToast({
              tipo: 'critico',
              titulo: 'Alerta de Ruptura',
              mensagem: 'Um insumo crítico atingiu nível de reposição urgente.',
              icone: '⚠️',
            });
          }
          break;
        }

        case SseEventTypes.ESTOQUE_ATUALIZADO: {
          queryClient.invalidateQueries({ queryKey: ['insumos-estoque'] });
          queryClient.invalidateQueries({ queryKey: ['capacidade-producao'] });
          break;
        }

        case SseEventTypes.PREVISAO_CONCLUIDA: {
          queryClient.invalidateQueries({ queryKey: ['capacidade-producao'] });
          queryClient.invalidateQueries({ queryKey: ['previsoes-demanda'] });

          showToast({
            tipo: 'info',
            titulo: 'Inteligência Artificial Sincronizada',
            mensagem: 'Nova projeção de demanda e capacidade calculada pelo HistGradientBoosting.',
            icone: '🤖',
          });
          break;
        }

        case SseEventTypes.VENDA_REGISTRADA: {
          queryClient.invalidateQueries({ queryKey: ['caixa-consolidado'] });
          queryClient.invalidateQueries({ queryKey: ['insumos-estoque'] });
          break;
        }

        case SseEventTypes.CAIXA_TURNO_FECHADO: {
          queryClient.invalidateQueries({ queryKey: ['caixa-consolidado'] });

          showToast({
            tipo: 'sucesso',
            titulo: 'Turno de Caixa Fechado',
            mensagem: 'Conferência física gravada com sucesso no Ledger imutável.',
            icone: '🔒',
          });
          break;
        }

        case SseEventTypes.NOVO_PEDIDO_COZINHA: {
          queryClient.invalidateQueries({ queryKey: ['kds-pedidos'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
          queryClient.invalidateQueries({ queryKey: ['vendas-historico'] });

          try {
            const payload: NovoPedidoCozinhaPayload = JSON.parse(event.payloadJson);
            showToast({
              tipo: 'info',
              titulo: `Novo Pedido ${payload.codigoCurto} na Cozinha`,
              mensagem: `${payload.quantidadeItens} ${payload.quantidadeItens === 1 ? 'item enviado' : 'itens enviados'} para a chapa em tempo real.`,
              icone: '👨‍🍳',
            });
          } catch {
            // Ignora parse caso venha payload mínimo
          }
          break;
        }

        case SseEventTypes.PEDIDO_STATUS_ATUALIZADO: {
          queryClient.invalidateQueries({ queryKey: ['kds-pedidos'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
          queryClient.invalidateQueries({ queryKey: ['vendas-historico'] });
          break;
        }

        default: {
          // Eventos genéricos disparam atualização preventiva das entidades operacionais
          queryClient.invalidateQueries({ queryKey: ['capacidade-producao'] });
          queryClient.invalidateQueries({ queryKey: ['insumos-estoque'] });
          break;
        }
      }
    });

    // Início ou encerramento da conexão baseado na autenticação
    if (isAuthenticated && token && tenant?.id) {
      sseClient.connect({
        token,
        tenantId: tenant.id,
      });
    } else {
      sseClient.disconnect();
    }

    return () => {
      registerUnauthorizedHandler(null);
      unsubscribeStatus();
      unsubscribeUnauthorized();
      unsubscribeEvent();
    };
  }, [
    isAuthenticated,
    token,
    tenant?.id,
    queryClient,
    logout,
    setStatus,
    setLastEventTimestamp,
    showToast,
  ]);
}
