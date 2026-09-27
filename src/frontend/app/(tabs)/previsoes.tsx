import React from 'react';
import { PrevisoesScreen } from '@/features/previsoes';

/**
 * Rota Tab: Previsões de Demanda & Capacidade de Estoque.
 * Atua estritamente como Thin Route Wrapper delegando para o bounded context features/previsoes.
 */
export default function PrevisoesRoute() {
  return <PrevisoesScreen />;
}
