import { useState, useEffect, useCallback, useRef } from 'react';
import { isCancel, extractErrorMessage } from '@/services/api';
import { vendasService } from '../services/vendasService';
import { VendaHistorico } from '../types';

export function useHistoricoVendas() {
  const [vendas, setVendas] = useState<VendaHistorico[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const carregarHistorico = useCallback(async (isRefresh = false, signal?: AbortSignal) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErro(null);

    try {
      const dados = await vendasService.obterHistorico(undefined, signal);
      setVendas(dados || []);
    } catch (err: unknown) {
      if (isCancel(err)) return;
      setErro(extractErrorMessage(err, 'Erro ao carregar histórico de vendas.'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    carregarHistorico(false, controller.signal);

    return () => {
      controller.abort();
    };
  }, [carregarHistorico]);

  const refetch = useCallback(() => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    return carregarHistorico(true, controller.signal);
  }, [carregarHistorico]);

  return {
    vendas,
    totalVendas: vendas.length,
    faturamentoTotal: vendas.reduce((acc, v) => acc + (v.valorTotal || 0), 0),
    isLoading,
    isRefreshing,
    erro,
    refetch,
  };
}
