import React from 'react';
import { EsqueciSenhaScreen } from '@/features/auth';

/**
 * Rota de Recuperação de Senha do Operador/Gestor.
 * Atua estritamente como Thin Route Wrapper delegando para o bounded context features/auth.
 */
export default function EsqueciSenhaRoute() {
  return <EsqueciSenhaScreen />;
}
