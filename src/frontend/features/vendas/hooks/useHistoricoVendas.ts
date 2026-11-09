import { useState, useEffect, useCallback } from 'react';
import { vendasService } from '../services/vendasService';
import { VendaHistorico } from '../types';

export function useHistoricoVendas() {
  const [vendas, setVendas] = useState<VendaHistorico[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregarHistorico = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErro(null);

    try {
      const dados = await vendasService.obterHistorico();
      setVendas(dados || []);
    } catch (err: any) {
      setErro(err?.message || 'Erro ao carregar histórico de vendas.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    carregarHistorico();
  }, [carregarHistorico]);

  const refetch = useCallback(() => carregarHistorico(true), [carregarHistorico]);

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
