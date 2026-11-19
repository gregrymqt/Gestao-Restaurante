import { ItemComanda } from '../types';

export interface PilulaSugestao {
  id: string;
  label: string;
  valor: number;
}

export function calcularPilulasSugestao(subtotal: number): PilulaSugestao[] {
  if (subtotal <= 0) return [];

  const proximaDezena = Math.ceil(subtotal / 10) * 10;
  const valor1 = proximaDezena === subtotal ? proximaDezena + 10 : proximaDezena;
  const valor2 = Math.ceil((subtotal + 1) / 50) * 50;
  const valorFinal2 = valor2 <= valor1 ? valor1 + 10 : valor2;

  return [
    { id: 'p1', label: `+ R$ ${valor1.toFixed(2).replace('.', ',')}`, valor: valor1 },
    { id: 'p2', label: `+ R$ ${valorFinal2.toFixed(2).replace('.', ',')}`, valor: valorFinal2 },
    { id: 'exato', label: `Valor Exato (R$ ${subtotal.toFixed(2).replace('.', ',')})`, valor: subtotal },
  ];
}

export function mapearItensParaVenda(itens: ItemComanda[]) {
  return itens.map((i) => ({
    produtoId: i.produto.id,
    quantidade: i.quantidade,
    modificadores: i.modificadores?.map((m) => ({
      opcaoId: m.opcaoId,
      grupoId: m.grupoId,
      nome: m.nome,
      precoAdicional: Number(m.precoAdicional) || 0,
      insumoId: m.insumoId || null,
      quantidadeInsumo: Number(m.quantidadeInsumo) || 0,
      tipoAcao:
        typeof m.tipoAcao === 'number'
          ? m.tipoAcao
          : m.tipoAcao === 'Culinario'
          ? 1
          : m.tipoAcao === 'Adicional'
          ? 2
          : 3,
    })),
  }));
}
