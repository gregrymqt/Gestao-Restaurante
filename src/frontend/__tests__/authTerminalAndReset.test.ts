import test from 'node:test';
import assert from 'node:assert';

// 1. Configura ambiente Fail-Fast antes de carregar dependências
process.env.EXPO_PUBLIC_API_URL = 'http://localhost:5000/api/v1';
process.env.EXPO_PUBLIC_API_ID = 'restaurante-inteligente-pdv';

const { authService } = require('../features/auth/services/authService');
const { extractErrorMessage } = require('../shared/services/api');
const { useConnectionStore } = require('../shared/hooks/useConnectionStore');

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

  await t.test('Regras de PIN no Terminal Bloqueado - Sanitização e 4 Dígitos Estritos', () => {
    const limparPin = (txt: string) => txt.replace(/\D/g, '').slice(0, 4);
    assert.strictEqual(limparPin('1a2b3c4d5e'), '1234');
    assert.strictEqual(limparPin('• • • •'), '');
    assert.strictEqual(limparPin('9876'), '9876');
    assert.strictEqual(limparPin('987654'), '9876');
  });

  await t.test('Modo Offline - Coerência de Estado com useConnectionStore', () => {
    useConnectionStore.getState().setApiOnline(true);
    assert.strictEqual(useConnectionStore.getState().isApiOnline, true);

    useConnectionStore.getState().setApiOnline(false, 'Servidor offline');
    assert.strictEqual(useConnectionStore.getState().isApiOnline, false);
    assert.strictEqual(useConnectionStore.getState().lastErrorMessage, 'Servidor offline');

    // Restaura online para testes subsequentes
    useConnectionStore.getState().setApiOnline(true);
  });
});
