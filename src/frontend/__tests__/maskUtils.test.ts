import assert from 'node:assert';
import { mascararCnpj, desmascararCnpj, isCnpjFormatoValido } from '../features/auth/utils/maskUtils';

console.log('[TEST] Iniciando validação de máscara e sanitização de CNPJ...');

// 1. Teste de máscara progressiva e completa
assert.strictEqual(mascararCnpj('12'), '12');
assert.strictEqual(mascararCnpj('123'), '12.3');
assert.strictEqual(mascararCnpj('12345'), '12.345');
assert.strictEqual(mascararCnpj('12345678'), '12.345.678');
assert.strictEqual(mascararCnpj('123456780001'), '12.345.678/0001');
assert.strictEqual(mascararCnpj('12345678000190'), '12.345.678/0001-90');
assert.strictEqual(mascararCnpj('12.345.678/0001-90999'), '12.345.678/0001-90', 'Deve truncar em 14 dígitos');

// 2. Teste de desmascarar
assert.strictEqual(desmascararCnpj('12.345.678/0001-90'), '12345678000190');
assert.strictEqual(desmascararCnpj('abc-123.def'), '123');

// 3. Validação de formato
assert.strictEqual(isCnpjFormatoValido('12.345.678/0001-90'), true);
assert.strictEqual(isCnpjFormatoValido('12345678000190'), true);
assert.strictEqual(isCnpjFormatoValido('12.345.678/0001-9'), false);
assert.strictEqual(isCnpjFormatoValido(''), false);

console.log('[TEST] Todos os testes de maskUtils passaram com sucesso!');
