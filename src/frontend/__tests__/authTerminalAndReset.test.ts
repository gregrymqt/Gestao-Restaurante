import test from 'node:test';
import assert from 'node:assert';

process.env.EXPO_PUBLIC_API_URL = 'http://localhost:5000/api/v1';

import { authService } from '../features/auth/services/authService';
import { extractErrorMessage } from '../shared/services/api';

test('authService - Métodos de Terminal e Recuperação de Senha', async (t) => {
  await t.test('authService deve expor as funções de ciclo de vida de produção', () => {
    assert.strictEqual(typeof authService.validarPin, 'function', 'validarPin deve ser uma função');
    assert.strictEqual(typeof authService.definirPin, 'function', 'definirPin deve ser uma função');
    assert.strictEqual(typeof authService.solicitarRecuperacaoSenha, 'function', 'solicitarRecuperacaoSenha deve ser uma função');
    assert.strictEqual(typeof authService.redefinirSenha, 'function', 'redefinirSenha deve ser uma função');
    assert.strictEqual(typeof authService.logout, 'function', 'logout deve ser uma função');
  });

  await t.test('extractErrorMessage deve extrair mensagens da API ou fornecer fallback', () => {
    const errApi = { response: { data: { error: 'E-mail não encontrado.' } } };
    assert.strictEqual(extractErrorMessage(errApi, 'Fallback'), 'E-mail não encontrado.');

    const errDetail = { response: { data: { detail: 'Token expirado.' } } };
    assert.strictEqual(extractErrorMessage(errDetail, 'Fallback'), 'Token expirado.');

    const errNative = new Error('Falha de conexão.');
    assert.strictEqual(extractErrorMessage(errNative, 'Fallback'), 'Falha de conexão.');

    const errUnknown = 'erro em texto';
    assert.strictEqual(extractErrorMessage(errUnknown, 'Fallback padrão'), 'Fallback padrão');
  });
});
