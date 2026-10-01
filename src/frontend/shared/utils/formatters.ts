/**
 * Utilitários canônicos de formatação numérica e monetária para o frontend móvel.
 * Segue estritamente as diretrizes de código minimalista do Ponytail e convenções pt-BR.
 */

/**
 * Formata quantidades de insumos de forma inteligente:
 * - Unidades inteiras (un, cx, pct, etc.): exibe sem decimais (ex: "56 un").
 * - Unidades fracionadas (kg, l, g, etc.): exibe com decimais significativos e vírgula pt-BR (ex: "3,2 kg").
 */
export function formatarQuantidade(valor: number, unidade: string): string {
  if (isNaN(valor)) return `0 ${unidade || ''}`.trim();

  const u = (unidade || '').trim().toLowerCase();
  const unidadesInteiras = ['un', 'unid', 'unidade', 'unidades', 'pct', 'cx', 'caixa', 'caixas', 'lata', 'latas', 'garrafa', 'garrafas'];

  if (unidadesInteiras.includes(u)) {
    return `${Math.round(valor)} ${unidade}`;
  }

  // Fracionados (kg, l, etc.) com até 3 casas decimais sem zeros à direita inúteis
  const formatado = Number(valor.toFixed(3)).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });

  return `${formatado} ${unidade}`;
}

/**
 * Formata valores numéricos para moeda corrente brasileira (ex: "R$ 2,50").
 */
export function formatarMoeda(valor: number): string {
  if (isNaN(valor)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

/**
 * Converte e formata string de digitação contínua para formato monetário pt-BR (ex: "250" -> "2,50").
 */
export function formatarMoedaInput(texto: string): string {
  const apenasNumeros = texto.replace(/\D/g, '');
  if (!apenasNumeros) return '';
  const centavos = parseInt(apenasNumeros, 10) / 100;
  return centavos.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formata porções de receitas culinárias para medidas gastronômicas comuns:
 * - Frações de quilo (< 1 kg) são convertidas para gramas (ex: 0.18 kg -> "180 g", 0.04 kg -> "40 g").
 * - Frações de litro (< 1 L) são convertidas para mililitros (ex: 0.2 L -> "200 ml").
 * - Unidades inteiras permanecem como unidades (ex: 1 un -> "1 un").
 */
export function formatarPorcaoGastronomica(quantidade: number, unidade: string): string {
  if (isNaN(quantidade)) return `0 ${unidade || ''}`.trim();

  const u = (unidade || '').trim().toLowerCase();

  if ((u === 'kg' || u === 'quilo') && quantidade > 0 && quantidade < 1) {
    const gramas = Math.round(quantidade * 1000);
    return `${gramas} g`;
  }

  if ((u === 'l' || u === 'litro') && quantidade > 0 && quantidade < 1) {
    const ml = Math.round(quantidade * 1000);
    return `${ml} ml`;
  }

  return formatarQuantidade(quantidade, unidade);
}

export interface MensagemOrdemCompraInput {
  protocolo: string;
  fornecedor?: string;
  insumos: Array<{ nomeInsumo: string; quantidade: number; unidadeMedida?: string }>;
  valorTotal: number;
}

/**
 * Gera mensagem formatada pronta para envio direto via WhatsApp para o fornecedor homologado.
 */
export function gerarMensagemOrdemCompraWhatsApp(input: MensagemOrdemCompraInput): string {
  const fornecedor = input.fornecedor || 'Distribuidora Prime Carnes & Panificação';
  const listaItens = input.insumos
    .map(
      (item) =>
        `• *${item.nomeInsumo}*: ${formatarQuantidade(item.quantidade, item.unidadeMedida || 'un')}`
    )
    .join('\n');

  return (
    `📦 *PEDIDO DE COMPRA - ${input.protocolo}*\n\n` +
    `Olá, *${fornecedor}*!\n` +
    `Favor confirmar o fornecimento dos seguintes insumos:\n\n` +
    `${listaItens}\n\n` +
    `💰 *Total Estimado*: ${formatarMoeda(input.valorTotal)}\n` +
    `⏰ *Prazo Desejado*: D+0 até às 18:00\n\n` +
    `_Pedido gerado via Gestão Inteligente._`
  );
}

