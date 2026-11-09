import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { previsoesService } from '../services/previsoesService';
import {
  ItemCapacidadeProducao,
  FichaTecnicaIngrediente,
  DataOpcaoFiltro,
} from '../types';

export function gerarDatasFiltroDinamicas(): DataOpcaoFiltro[] {
  const opcoes: DataOpcaoFiltro[] = [];
  const hoje = new Date();
  const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  for (let i = 1; i <= 4; i++) {
    const d = new Date(hoje);
    d.setDate(d.getDate() + i);
    const diaMes = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    const diaNome = i === 1 ? 'Amanhã' : diasSemana[d.getDay()];
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    const dataAlvoStr = `${ano}-${mes}-${dia}`;

    opcoes.push({
      label: `${diaNome}, ${diaMes}`,
      sublabel: `(D+${i})`,
      dataAlvo: dataAlvoStr,
    });
  }
  return opcoes;
}

export function useCapacidadeProducao() {
  const queryClient = useQueryClient();
  const datasFiltro = useMemo(() => gerarDatasFiltroDinamicas(), []);
  const [dataAlvo, setDataAlvo] = useState<string>(() => datasFiltro[0]?.dataAlvo || '');
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
    staleTime: 5000, // 5 segundos para refletir novas previsões
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
    datasFiltro,
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
