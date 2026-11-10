import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import {
  BeforeInstallPromptEvent,
  PwaInstallOutcome,
  PwaWindow,
  executePwaInstall,
} from '../utils/pwaInstall';

export function isRunningStandalone(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia?.('(display-mode: standalone)')?.matches === true ||
    nav?.standalone === true
  );
}

/**
 * Hook reativo para captura e disparo do prompt de instalação PWA em 1 clique.
 */
export function usePwaInstall() {
  const isWeb = Platform.OS === 'web' && typeof window !== 'undefined';
  const supportsWebInstall =
    isWeb &&
    typeof (Navigator?.prototype as { install?: unknown } | undefined)?.install === 'function';

  const [isInstalled, setIsInstalled] = useState<boolean>(() => isRunningStandalone());
  const [hasDeferredPrompt, setHasDeferredPrompt] = useState<boolean>(() =>
    isWeb ? Boolean((window as PwaWindow).__riDeferredInstallPrompt) : false
  );
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    if (!isWeb) return;

    const pwaWindow = window as PwaWindow;
    setIsInstalled(isRunningStandalone());
    setHasDeferredPrompt(Boolean(pwaWindow.__riDeferredInstallPrompt));

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      pwaWindow.__riDeferredInstallPrompt = event as BeforeInstallPromptEvent;
      setHasDeferredPrompt(true);
    };

    const handleCapturedEarly = () => {
      setHasDeferredPrompt(Boolean(pwaWindow.__riDeferredInstallPrompt));
    };

    const handleAppInstalled = () => {
      pwaWindow.__riDeferredInstallPrompt = null;
      setHasDeferredPrompt(false);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('ri:beforeinstallprompt', handleCapturedEarly);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('ri:appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('ri:beforeinstallprompt', handleCapturedEarly);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('ri:appinstalled', handleAppInstalled);
    };
  }, [isWeb]);

  const canInstall = isWeb && !isInstalled && (supportsWebInstall || hasDeferredPrompt);

  const triggerInstall = useCallback(async (): Promise<PwaInstallOutcome> => {
    if (!isWeb || isInstalling) return 'unavailable';
    setIsInstalling(true);
    const pwaWindow = window as PwaWindow;
    const nav = window.navigator as Navigator & { install?: () => Promise<void> };

    try {
      const outcome = await executePwaInstall({
        supportsWebInstall,
        installFn: typeof nav.install === 'function' ? () => nav.install!() : undefined,
        getDeferredPrompt: () => pwaWindow.__riDeferredInstallPrompt,
        clearDeferredPrompt: () => {
          pwaWindow.__riDeferredInstallPrompt = null;
          setHasDeferredPrompt(false);
        },
      });

      if (outcome === 'installed') {
        setIsInstalled(true);
      } else {
        setHasDeferredPrompt(Boolean(pwaWindow.__riDeferredInstallPrompt));
      }
      return outcome;
    } finally {
      setIsInstalling(false);
    }
  }, [isWeb, isInstalling, supportsWebInstall]);

  return { canInstall, isInstalling, isInstalled, triggerInstall };
}
