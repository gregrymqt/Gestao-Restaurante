import React from 'react';
import { EstoqueScreen } from '@/features/estoque';

/**
 * Rota Tab: Gestão de Inventário e Fichas Técnicas (BOM).
 * Atua estritamente como Thin Route Wrapper delegando para o bounded context features/estoque.
 */
export default function EstoqueRoute() {
  return <EstoqueScreen />;
}
