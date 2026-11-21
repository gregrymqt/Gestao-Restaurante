import test from 'node:test';
import assert from 'node:assert';

process.env.EXPO_PUBLIC_API_URL = 'http://localhost:5000/api/v1';
process.env.EXPO_PUBLIC_API_ID = 'restaurante-inteligente-pdv';

import { apiClient, extractErrorMessage } from '../shared/services/api';
import { equipeService } from '../features/perfil/services/equipeService';
import { authService } from '../features/auth/services/authService';

test('Gestão de Equipe e Login de Balcão por PIN no Frontend', async (t) => {
  await t.test('equipeService deve expor métodos de listagem, cadastro e ativação', () => {
    assert.strictEqual(typeof equipeService.listarEquipe, 'function');
    assert.strictEqual(typeof equipeService.cadastrarOperador, 'function');
    assert.strictEqual(typeof equipeService.desativarOperador, 'function');
    assert.strictEqual(typeof equipeService.ativarOperador, 'function');
  });

  await t.test('authService deve expor loginComPin e obterOperadoresRecentes', () => {
    assert.strictEqual(typeof authService.loginComPin, 'function');
    assert.strictEqual(typeof authService.obterOperadoresRecentes, 'function');
  });

  await t.test('equipeService.cadastrarOperador deve propagar mensagem amigável via extractErrorMessage', async () => {
    const originalPost = apiClient.post;
    apiClient.post = async () => {
      const err = new Error('Erro de teste');
      (err as any).response = { data: { error: 'O PIN deve conter exatamente 4 dígitos.' } };
      throw err;
    };

    try {
      await assert.rejects(
        async () => {
          await equipeService.cadastrarOperador({
            nome: 'Teste',
            role: 'Operator',
            pin: '12',
          });
        },
        (err: Error) => {
          assert.strictEqual(err.message, 'O PIN deve conter exatamente 4 dígitos.');
          return true;
        }
      );
    } finally {
      apiClient.post = originalPost;
    }
  });

  await t.test('authService.loginComPin deve rejeitar PIN incorreto com mensagem tratada', async () => {
    const originalPost = apiClient.post;
    apiClient.post = async () => {
      const err = new Error('Erro de teste');
      (err as any).response = { data: { error: 'PIN inválido.' } };
      throw err;
    };

    try {
      await assert.rejects(
        async () => {
          await authService.loginComPin('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '0000');
        },
        (err: Error) => {
          assert.strictEqual(err.message, 'PIN inválido.');
          return true;
        }
      );
    } finally {
      apiClient.post = originalPost;
    }
  });
});
