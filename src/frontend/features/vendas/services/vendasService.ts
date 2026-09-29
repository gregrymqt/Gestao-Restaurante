import { apiClient } from '@/services/api';
import {
  CategoriaProduto,
  Produto,
  RegistrarVendaRequestDto,
  VendaResponseDto,
  CriarProdutoInput,
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
  async obterProdutos(): Promise<Produto[]> {
    const response = await apiClient.get<ProdutoApiResponse[]>('/produtos');
    return response.data.map((p) => ({
      id: p.id,
      nome: p.nome,
      descricao: p.descricao,
      preco: Number(p.preco),
      categoria: categorizarProduto(p.nome, p.descricao),
      ativo: p.ativo,
    }));
  },

  async registrarVenda(dto: RegistrarVendaRequestDto): Promise<VendaResponseDto> {
    const response = await apiClient.post<VendaResponseDto>('/vendas', dto);
    return response.data;
  },

  async criarProduto(dto: CriarProdutoInput): Promise<Produto> {
    const response = await apiClient.post<ProdutoApiResponse>('/produtos', {
      nome: dto.nome,
      descricao: dto.descricao,
      preco: dto.preco,
      fichaTecnica: dto.fichaTecnica,
    });
    return {
      id: response.data.id,
      nome: response.data.nome,
      descricao: response.data.descricao,
      preco: Number(response.data.preco),
      categoria: dto.categoria,
      ativo: response.data.ativo,
    };
  },
};
