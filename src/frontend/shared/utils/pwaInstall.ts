export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PwaWindow extends Window {
  __riDeferredInstallPrompt?: BeforeInstallPromptEvent | null;
}

export type PwaInstallOutcome = 'installed' | 'dismissed' | 'unavailable' | 'error';

export interface ExecutePwaInstallDeps {
  supportsWebInstall: boolean;
  installFn?: () => Promise<void>;
  getDeferredPrompt: () => BeforeInstallPromptEvent | null | undefined;
  clearDeferredPrompt: () => void;
}

/**
 * Executa a instalação PWA priorizando `navigator.install()` com fallback seguro para
 * `beforeinstallprompt` (descartando o evento single-use antes de aguardar `userChoice`).
 */
export async function executePwaInstall(
  deps: ExecutePwaInstallDeps
): Promise<PwaInstallOutcome> {
  try {
    if (deps.supportsWebInstall && deps.installFn) {
      await deps.installFn();
      return 'installed';
    }

    const promptEvent = deps.getDeferredPrompt();
    if (!promptEvent) {
      return 'unavailable';
    }

    deps.clearDeferredPrompt();
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    return outcome === 'accepted' ? 'installed' : 'dismissed';
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      return 'dismissed';
    }
    return 'error';
  }
}
