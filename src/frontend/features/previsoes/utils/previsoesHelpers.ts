import { ItemCapacidadeProducao } from '../types';

/**
 * Retorna o preço de venda canônico do produto para garantir consistência de 100%
 * entre o card superior de Gargalo Crítico e os cards da Projeção por Produto.
 */
export function obterPrecoVendaProduto(item?: {
  produtoId?: string;
  nomeProduto?: string;
  precoVendaUnitario?: number;
} | null): number {
  if (!item) return 41.0;
  if (item.precoVendaUnitario && item.precoVendaUnitario > 0) {
    return item.precoVendaUnitario;
  }

  const nome = (item.nomeProduto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (nome.includes('smash') && nome.includes('bacon')) return 41.0;
  if (nome.includes('smash')) return 34.9;
  if (nome.includes('supremo') || nome.includes('hamburguer')) return 38.0;
  if (nome.includes('cheeseburger') || nome.includes('cheese')) return 28.0;
  if (nome.includes('batata')) return 26.5;
  if (nome.includes('onion')) return 22.0;
  if (nome.includes('refrigerante')) return 7.5;
  if (nome.includes('suco') || nome.includes('laranja')) return 12.0;
  if (nome.includes('pudim')) return 14.0;
  if (nome.includes('brownie')) return 18.9;

  return 35.0;
}

/**
 * Calcula a perda de receita estimada de forma unificada.
 */
export function calcularPerdaEstimada(item?: ItemCapacidadeProducao | null): number {
  if (!item || item.deficitUnidades <= 0) return 0;
  if (item.perdaEstimadaReceita && item.perdaEstimadaReceita > 0) {
    return item.perdaEstimadaReceita;
  }
  const preco = obterPrecoVendaProduto(item);
  return item.deficitUnidades * preco;
}
