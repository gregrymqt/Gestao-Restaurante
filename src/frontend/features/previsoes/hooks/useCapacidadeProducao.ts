import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { previsoesService } from '../services/previsoesService';
import {
  ItemCapacidadeProducao,
  FichaTecnicaIngrediente,
  DataOpcaoFiltro,
} from '../types';

export const DATAS_FILTRO_PADRAO: DataOpcaoFiltro[] = [
  { label: 'Amanhã, 28/09', sublabel: '(D+1)', dataAlvo: '2026-09-28' },
  { label: 'Terça, 29/09', sublabel: '(D+2)', dataAlvo: '2026-09-29' },
  { label: 'Quarta, 30/09', sublabel: '(D+3)', dataAlvo: '2026-09-30' },
  { label: 'Quinta, 01/10', sublabel: '(D+4)', dataAlvo: '2026-10-01' },
];

export function useCapacidadeProducao() {
  const queryClient = useQueryClient();
  const [dataAlvo, setDataAlvo] = useState<string>('2026-09-28');
  const [produtoFicha, setProdutoFicha] = useState<ItemCapacidadeProducao | null>(null);
  const [fichaIngredientes, setFichaIngredientes] = useState<FichaTecnicaIngrediente[]>([]);
  const [isFichaModalOpen, setIsFichaModalOpen] = useState<boolean>(false);
  const [isOrdemCompraOpen, setIsOrdemCompraOpen] = useState<boolean>(false);
  const [insumoFocoId, setInsumoFocoId] = useState<string | null>(null);

  const {
    data: relatorio,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['capacidade-producao', dataAlvo],
    queryFn: () => previsoesService.obterCapacidadeProducao(dataAlvo),
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
  });

  const ordemCompraMutation = useMutation({
    mutationFn: (pedido: {
      insumos: Array<{ insumoId: string; nomeInsumo: string; quantidade: number; unidadeMedida?: string }>;
      valorTotal: number;
    }) => previsoesService.enviarOrdemCompra(pedido),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capacidade-producao'] });
      setIsOrdemCompraOpen(false);
      setInsumoFocoId(null);
    },
  });

  const abrirFichaTecnica = async (produto: ItemCapacidadeProducao) => {
    setProdutoFicha(produto);
    const ingredientes = await previsoesService.obterFichaTecnica(produto.produtoId);
    setFichaIngredientes(ingredientes);
    setIsFichaModalOpen(true);
  };

  const fecharFichaTecnica = () => {
    setIsFichaModalOpen(false);
    setProdutoFicha(null);
    setFichaIngredientes([]);
  };

  const abrirOrdemCompra = (insumoId?: string) => {
    setInsumoFocoId(insumoId || null);
    setIsOrdemCompraOpen(true);
  };

  const fecharOrdemCompra = () => {
    setIsOrdemCompraOpen(false);
    setInsumoFocoId(null);
  };

  // Cálculo do insumo gargalo mais crítico e perda total de receita
  const { gargaloPrincipal, perdaTotalEstimada, totalDeficitUnidades } = useMemo(() => {
    if (!relatorio?.itensCapacidade) {
      return { gargaloPrincipal: null, perdaTotalEstimada: 0, totalDeficitUnidades: 0 };
    }

    const itemComMaiorDeficit = [...relatorio.itensCapacidade]
      .filter((i) => i.riscoRutura)
      .sort((a, b) => b.deficitUnidades - a.deficitUnidades)[0] || null;

    const perdaTotal = relatorio.itensCapacidade.reduce(
      (acc, item) => acc + (item.perdaEstimadaReceita || 0),
      0
    );

    const deficitTotal = relatorio.itensCapacidade.reduce(
      (acc, item) => acc + (item.deficitUnidades || 0),
      0
    );

    return {
      gargaloPrincipal: itemComMaiorDeficit,
      perdaTotalEstimada: perdaTotal,
      totalDeficitUnidades: deficitTotal,
    };
  }, [relatorio]);

  return {
    relatorio,
    isLoading,
    isRefetching,
    refetch,
    dataAlvo,
    setDataAlvo,
    datasFiltro: DATAS_FILTRO_PADRAO,
    // Modais & Ações
    produtoFicha,
    fichaIngredientes,
    isFichaModalOpen,
    abrirFichaTecnica,
    fecharFichaTecnica,
    isOrdemCompraOpen,
    insumoFocoId,
    abrirOrdemCompra,
    fecharOrdemCompra,
    ordemCompraMutation,
    // Métricas analíticas
    gargaloPrincipal,
    perdaTotalEstimada,
    totalDeficitUnidades,
  };
}
