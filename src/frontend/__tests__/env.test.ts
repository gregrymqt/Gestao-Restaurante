import assert from 'node:assert';

console.log('[TEST] Iniciando validação de carregamento e fail-fast de variáveis de ambiente no Frontend...');

// 1. Valida que ao importar sem a variável EXPO_PUBLIC_API_URL definida, o módulo quebra imediatamente (Fail-Fast)
delete process.env.EXPO_PUBLIC_API_URL;

assert.throws(
  () => {
    // Carrega a função de validação sem definir a variável
    const { loadEnvConfig } = require('../shared/config/env');
    loadEnvConfig();
  },
  (err: any) => {
    assert.ok(err instanceof Error);
    assert.ok(err.message.includes('[ENV_FAIL_FAST]'));
    return true;
  },
  'Deve lançar exceção fatal [ENV_FAIL_FAST] quando a URL for ausente'
);

// 2. Agora define a variável e valida a exportação e parsing
process.env.EXPO_PUBLIC_API_URL = 'http://192.168.1.100:5000/api/v1///';
const { loadEnvConfig, env } = require('../shared/config/env');

const config = loadEnvConfig('http://192.168.1.100:5000/api/v1///');
assert.strictEqual(config.apiUrl, 'http://192.168.1.100:5000/api/v1', 'Deve remover barras extras no final da URL');
assert.strictEqual(typeof config.isDevelopment, 'boolean', 'isDevelopment deve ser booleano');
assert.strictEqual(typeof config.isProduction, 'boolean', 'isProduction deve ser booleano');

// 3. Valida imutabilidade (Object.freeze)
assert.ok(Object.isFrozen(config), 'O objeto de configuração deve ser estritamente congelado (Object.freeze)');

console.log('[TEST] Todos os testes de carregamento e Fail-Fast do frontend foram aprovados com sucesso!');
