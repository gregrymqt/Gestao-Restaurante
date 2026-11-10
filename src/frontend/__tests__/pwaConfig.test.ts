import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { executePwaInstall } from '../shared/utils/pwaInstall';

const frontendRoot = path.resolve(__dirname, '..');
const publicDir = path.join(frontendRoot, 'public');

console.log('[TEST] Validando manifesto PWA, Service Worker, metadados +html.tsx e app.json...');

// 1. Manifesto W3C
const manifestPath = path.join(publicDir, 'manifest.webmanifest');
assert.ok(fs.existsSync(manifestPath), 'manifest.webmanifest deve existir em public/');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

assert.strictEqual(manifest.id, '/', 'Manifesto deve declarar id estável "/"');
assert.strictEqual(manifest.start_url, '/');
assert.strictEqual(manifest.scope, '/');
assert.strictEqual(manifest.display, 'standalone');
assert.strictEqual(manifest.theme_color, '#D9381E');
assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 4);

const has192Any = manifest.icons.some((i: any) => i.sizes === '192x192' && i.purpose === 'any');
const has512Mask = manifest.icons.some((i: any) => i.sizes === '512x512' && i.purpose === 'maskable');
assert.ok(has192Any, 'Deve possuir ícone 192x192 purpose=any');
assert.ok(has512Mask, 'Deve possuir ícone 512x512 purpose=maskable');

for (const icon of manifest.icons) {
  const iconFile = path.join(publicDir, icon.src.replace(/^\//, ''));
  assert.ok(fs.existsSync(iconFile), `Ícone referenciado no manifesto não encontrado: ${icon.src}`);
}

// 2. app.json web config
const appJson = JSON.parse(fs.readFileSync(path.join(frontendRoot, 'app.json'), 'utf8'));
assert.strictEqual(appJson.expo.web.display, 'standalone');
assert.strictEqual(appJson.expo.web.themeColor, '#D9381E');
assert.strictEqual(appJson.expo.web.bundler, 'metro');

// 3. Metadados em public/index.html e ícone iOS
const htmlTemplate = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8');
assert.ok(htmlTemplate.includes('/manifest.webmanifest'), 'public/index.html deve referenciar /manifest.webmanifest');
assert.ok(htmlTemplate.includes('apple-mobile-web-app-capable'), 'public/index.html deve conter meta tag iOS standalone');
assert.ok(htmlTemplate.includes("'serviceWorker' in navigator"), 'public/index.html deve proteger registro de SW por feature detection');
assert.ok(fs.existsSync(path.join(publicDir, 'icons', 'apple-touch-icon.png')));

// 4. Comportamento real do Service Worker (bypass obrigatório de /api/, /ml/ e SSE)
const swCode = fs.readFileSync(path.join(publicDir, 'sw.js'), 'utf8');
const context: any = {
  URL,
  self: {
    location: { origin: 'http://localhost:8080' },
    addEventListener: () => {},
  },
};
vm.runInNewContext(swCode, context);

const makeReq = (method: string, urlStr: string, accept = '*/*') => ({
  method,
  url: urlStr,
  headers: { get: (h: string) => (h.toLowerCase() === 'accept' ? accept : null) },
});

assert.strictEqual(
  context.shouldBypassRequest(makeReq('POST', 'http://localhost:8080/api/v1/vendas'), new URL('http://localhost:8080/api/v1/vendas')),
  true,
  'POST não pode ser interceptado pelo SW'
);
assert.strictEqual(
  context.shouldBypassRequest(
    makeReq('GET', 'http://localhost:8080/api/v1/events/sse', 'text/event-stream'),
    new URL('http://localhost:8080/api/v1/events/sse')
  ),
  true,
  'Stream SSE deve sempre ignorar o SW'
);
assert.strictEqual(
  context.shouldBypassRequest(makeReq('GET', 'http://localhost:8080/ml/previsao'), new URL('http://localhost:8080/ml/previsao')),
  true,
  'Worker ML deve ignorar cache do SW'
);
assert.strictEqual(
  context.shouldBypassRequest(makeReq('GET', 'http://localhost:8080/sw.js'), new URL('http://localhost:8080/sw.js')),
  true,
  'Próprio sw.js não pode ser interceptado'
);
assert.strictEqual(
  context.shouldBypassRequest(makeReq('GET', 'https://externo.com/script.js'), new URL('https://externo.com/script.js')),
  true,
  'Origens externas devem ser ignoradas'
);
assert.strictEqual(
  context.shouldBypassRequest(
    makeReq('GET', 'http://localhost:8080/_expo/static/js/web/entry.js'),
    new URL('http://localhost:8080/_expo/static/js/web/entry.js')
  ),
  false
);
assert.strictEqual(context.isStaticAsset('/_expo/static/js/web/entry.js'), true);
assert.ok(
  htmlTemplate.includes('__riDeferredInstallPrompt'),
  'public/index.html deve capturar beforeinstallprompt antes da hidratação React'
);

// 5. Lógica do botão Instalar App (navigator.install() + fallback beforeinstallprompt)
(async () => {
  let clearedCount = 0;
  let storedPrompt: any = {
    prompt: async () => {
      assert.strictEqual(storedPrompt, null, 'Evento single-use deve ser descartado antes de prompt()');
    },
    userChoice: Promise.resolve({ outcome: 'accepted' as const }),
  };

  const fallbackAccepted = await executePwaInstall({
    supportsWebInstall: false,
    getDeferredPrompt: () => storedPrompt,
    clearDeferredPrompt: () => {
      clearedCount += 1;
      storedPrompt = null;
    },
  });
  assert.strictEqual(fallbackAccepted, 'installed');
  assert.strictEqual(clearedCount, 1);

  let usedWebInstall = false;
  const webInstallRes = await executePwaInstall({
    supportsWebInstall: true,
    installFn: async () => {
      usedWebInstall = true;
    },
    getDeferredPrompt: () => storedPrompt,
    clearDeferredPrompt: () => {},
  });
  assert.strictEqual(usedWebInstall, true);
  assert.strictEqual(webInstallRes, 'installed');

  const abortErr = new Error('Canceled by user');
  abortErr.name = 'AbortError';
  const abortedRes = await executePwaInstall({
    supportsWebInstall: true,
    installFn: async () => {
      throw abortErr;
    },
    getDeferredPrompt: () => null,
    clearDeferredPrompt: () => {},
  });
  assert.strictEqual(abortedRes, 'dismissed');

  const unavailableRes = await executePwaInstall({
    supportsWebInstall: false,
    getDeferredPrompt: () => null,
    clearDeferredPrompt: () => {},
  });
  assert.strictEqual(unavailableRes, 'unavailable');

  console.log('[TEST] PWA config, SW bypass & 1-click Install: ALL CHECKS PASSED!');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
