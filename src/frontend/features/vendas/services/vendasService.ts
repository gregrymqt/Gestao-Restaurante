import { apiClient, extractErrorMessage, isCancel } from '@/services/api';
import {
  CategoriaProduto,
  Produto,
  RegistrarVendaRequestDto,
  VendaResponseDto,
  CriarProdutoInput,
  VendaHistorico,
  GrupoModificador,
} from '../types';

interface ProdutoApiResponse {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  ativo: boolean;
}

function categorizarProduto(nome: string, descricao?: string): CategoriaProduto {
  const texto = `${nome} ${descricao || ''}`.toLowerCase();
  if (texto.includes('burger') || texto.includes('hambúrguer') || texto.includes('smash') || texto.includes('blend')) {
    return 'Hambúrgueres';
  }
  if (texto.includes('batata') || texto.includes('onion') || texto.includes('porção') || texto.includes('anéis') || texto.includes('frita')) {
    return 'Porções';
  }
  if (texto.includes('refrigerante') || texto.includes('suco') || texto.includes('coca') || texto.includes('lata') || texto.includes('água') || texto.includes('bebida')) {
    return 'Bebidas';
  }
  if (texto.includes('pudim') || texto.includes('brownie') || texto.includes('sorvete') || texto.includes('torta') || texto.includes('sobremesa')) {
    return 'Sobremesas';
  }
  return 'Hambúrgueres';
}

export const vendasService = {
  async obterProdutos(signal?: AbortSignal): Promise<Produto[]> {
    const response = await apiClient.get<ProdutoApiResponse[]>('/produtos', { signal });
    return response.data.map((p) => ({
      id: p.id,
      nome: p.nome,
      descricao: p.descricao,
      preco: Number(p.preco),
      categoria: categorizarProduto(p.nome, p.descricao),
      ativo: p.ativo,
    }));
  },

  async registrarVenda(
    dto: RegistrarVendaRequestDto,
    signal?: AbortSignal
  ): Promise<VendaResponseDto> {
    try {
      const response = await apiClient.post<VendaResponseDto>('/vendas', dto, { signal });
      return response.data;
    } catch (err: unknown) {
      if (isCancel(err)) throw err;
      throw new Error(extractErrorMessage(err, 'Não foi possível registrar a venda.'));
    }
  },

  async obterHistorico(dataInicio?: string, signal?: AbortSignal): Promise<VendaHistorico[]> {
    const response = await apiClient.get<VendaHistorico[]>('/vendas', {
      params: dataInicio ? { dataInicio } : undefined,
      signal,
    });
    return response.data;
  },

  async obterModificadoresProduto(
    produtoId: string,
    signal?: AbortSignal
  ): Promise<GrupoModificador[]> {
    const response = await apiClient.get<GrupoModificador[]>(
      `/produtos/${produtoId}/modificadores`,
      { signal }
    );
    return response.data;
  },

  async criarProduto(dto: CriarProdutoInput, signal?: AbortSignal): Promise<Produto> {
    try {
      const response = await apiClient.post<ProdutoApiResponse>(
        '/produtos',
        {
          nome: dto.nome,
          descricao: dto.descricao,
          preco: dto.preco,
          fichaTecnica: dto.fichaTecnica,
        },
        { signal }
      );
      return {
        id: response.data.id,
        nome: response.data.nome,
        descricao: response.data.descricao,
        preco: Number(response.data.preco),
        categoria: dto.categoria,
        ativo: response.data.ativo,
      };
    } catch (err: unknown) {
      if (isCancel(err)) throw err;
      throw new Error(extractErrorMessage(err, 'Não foi possível cadastrar o produto.'));
    }
  },
};
