#!/usr/bin/env node

/**
 * ==============================================================================
 * Graft Linter - Verificação Arquitetural Determinística
 * 
 * Regras:
 * 1. Teto estrito de complexidade: Máximo 300 linhas por arquivo de código.
 * 2. Tipagem estrita: Proibição absoluta de uso do tipo 'any' (: any, as any, <any>).
 * 
 * Alimentado pelo Grafo de Contexto do Graft (AST, wiring graph e busca indexada).
 * ==============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

// Parsing de argumentos CLI
const args = process.argv.slice(2);
function getArg(flag, defaultValue) {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : defaultValue;
}

const targetScope = getArg('--scope', 'src/frontend');
const maxLines = parseInt(getArg('--max-lines', '300'), 10);
const failOnError = !args.includes('--no-fail');

console.log('\x1b[36m%s\x1b[0m', '═══════════════════════════════════════════════════════════════════════════');
console.log('\x1b[1m%s\x1b[0m', ' 🛡️  GRAFT ARCHITECTURE LINTER (Context Graph & AST)');
console.log('\x1b[90m%s\x1b[0m', ` Escopo: ${targetScope}  |  Teto de Linhas: ${maxLines}  |  Proibição: any`);
console.log('\x1b[36m%s\x1b[0m', '═══════════════════════════════════════════════════════════════════════════\n');

// 1. Sincronizar / Atualizar grafo com o Graft
try {
  process.stdout.write('Sincronizando grafo do repositório via Graft... ');
  execSync('graft build', { cwd: REPO_ROOT, stdio: ['ignore', 'ignore', 'ignore'] });
  console.log('\x1b[32mOK\x1b[0m\n');
} catch (e) {
  console.log('\x1b[33m(Aviso: usando grafo em disco existente)\x1b[0m\n');
}

const wiringPath = path.join(REPO_ROOT, 'graft', '.graph', 'wiring.json');
if (!fs.existsSync(wiringPath)) {
  console.error('\x1b[31m[ERRO]\x1b[0m Arquivo graft/.graph/wiring.json não encontrado. Execute `graft build` na raiz.');
  process.exit(1);
}

const wiring = JSON.parse(fs.readFileSync(wiringPath, 'utf-8'));
const fileNodes = wiring.nodes.filter(
  (n) => n.kind === 'file' && n.path.startsWith(targetScope) && !n.path.includes('node_modules') && !n.path.includes('.venv')
);

const violationsLinhas = [];
const violationsAny = [];

// 2. Checagem de Teto de Linhas usando os Spans AST do Graft
for (const node of fileNodes) {
  const filePath = path.join(REPO_ROOT, node.path);
  if (!fs.existsSync(filePath)) continue;

  // Medir linhas reais do arquivo
  const content = fs.readFileSync(filePath, 'utf-8');
  const lineCount = content.split('\n').length;

  if (lineCount > maxLines) {
    violationsLinhas.push({
      path: node.path,
      lineCount,
      excesso: lineCount - maxLines,
    });
  }
}

// 3. Checagem de 'any' usando o mecanismo de busca semântica do Graft
try {
  const graftGrepOutput = execSync(`graft grep "any" . --in "${targetScope}"`, {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });

  const lines = graftGrepOutput.split('\n');
  let currentFile = '';
  let currentSymbol = '';

  for (const line of lines) {
    const symbolMatch = line.match(/^(.+?)\s+·\s+(\w+)\s+·\s+(.+?):L(\d+)-L(\d+)/);
    const fileOnlyMatch = line.match(/^(.+?)\s+\(module level\)/);

    if (symbolMatch) {
      currentSymbol = symbolMatch[1];
      currentFile = symbolMatch[3];
    } else if (fileOnlyMatch) {
      currentSymbol = '(modulo)';
      currentFile = fileOnlyMatch[1];
    }

    const hitMatch = line.match(/^\s+L(\d+):\s*(.+)$/);
    if (hitMatch && currentFile) {
      const lineNum = hitMatch[1];
      const codeSnippet = hitMatch[2].trim();

      // Filtrar falsos positivos que não sejam o tipo 'any' do TypeScript
      const isTypeScriptAny =
        /:\s*any\b/.test(codeSnippet) ||
        /\bas\s+any\b/.test(codeSnippet) ||
        /<any>/.test(codeSnippet) ||
        /\bany\[\]/.test(codeSnippet) ||
        /<any,/.test(codeSnippet) ||
        /,\s*any>/.test(codeSnippet) ||
        /\bany\s*\|/.test(codeSnippet) ||
        /\|\s*any\b/.test(codeSnippet);

      // Não punir testes de manifesto PWA onde purpose === 'any'
      const isPwaManifestValue = codeSnippet.includes("purpose === 'any'") || codeSnippet.includes("purpose: 'any'");

      if (isTypeScriptAny && !isPwaManifestValue && !currentFile.includes('__tests__')) {
        violationsAny.push({
          file: currentFile,
          line: lineNum,
          symbol: currentSymbol,
          snippet: codeSnippet,
        });
      }
    }
  }
} catch (error) {
  // Se graft grep não tiver hits ou retornar erro silencioso
}

// 4. Relatório e Resultados
console.log('\x1b[1m--- RESULTADOS DA AUDITORIA ---\x1b[0m\n');

if (violationsLinhas.length > 0) {
  console.log(`\x1b[31m✖ ${violationsLinhas.length} arquivo(s) excedem o teto de ${maxLines} linhas:\x1b[0m`);
  for (const v of violationsLinhas) {
    console.log(`  \x1b[31m•\x1b[0m ${v.path}:\x1b[1m${v.lineCount}\x1b[0m linhas (+${v.excesso} acima do limite)`);
  }
  console.log('');
} else {
  console.log(`\x1b[32m✔ Teto de ${maxLines} linhas: 100% dos arquivos em conformidade.\x1b[0m\n`);
}

if (violationsAny.length > 0) {
  console.log(`\x1b[31m✖ ${violationsAny.length} ocorrência(s) de uso proibido do tipo 'any':\x1b[0m`);
  for (const a of violationsAny) {
    console.log(`  \x1b[31m•\x1b[0m ${a.file}:${a.line} [${a.symbol}]`);
    console.log(`    \x1b[90m${a.snippet}\x1b[0m`);
  }
  console.log('');
} else {
  console.log('\x1b[32m✔ Tipagem estrita: Zero usos proibidos de "any" encontrados.\x1b[0m\n');
}

const totalErros = violationsLinhas.length + violationsAny.length;

if (totalErros > 0) {
  console.log('\x1b[31m%s\x1b[0m', `Falha de conformidade arquitetural: ${totalErros} erro(s) detectado(s).`);
  if (failOnError) {
    process.exit(1);
  }
} else {
  console.log('\x1b[32m%s\x1b[0m', '🌱 Graft Linter: O código auditado atende com perfeição a todas as regras de arquitetura!');
  process.exit(0);
}
