import React from 'react';
import { LoginScreen } from '@/features/auth';

/**
 * Rota de Autenticação Operacional & Gestão de Turno.
 * Atua estritamente como Thin Route Wrapper delegando para o bounded context features/auth.
 */
export default function LoginRoute() {
  return <LoginScreen />;
}
