import { useEffect, useState } from 'react';

const InstallAndStatusBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine
  );

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setShowInstall(true);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try {
      await deferredPrompt.userChoice;
    } finally {
      setDeferredPrompt(null);
      setShowInstall(false);
    }
  };

  const showOfflineBanner = !isOnline;

  if (!showInstall && !showOfflineBanner) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 top-0 z-40 flex flex-col gap-2 px-3 pt-3 pointer-events-none">
      {showOfflineBanner && (
        <div
          className="pointer-events-auto mx-auto max-w-xl w-full rounded-xl border border-amber-500/40 bg-amber-50/90 dark:bg-amber-500/10 backdrop-blur px-3 py-2 shadow-sm flex items-center justify-between gap-3"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-amber-500 shadow-[0_0_0_4px_rgba(251,191,36,0.25)]" />
            <div className="text-xs">
              <p className="font-semibold text-amber-800 dark:text-amber-200">
                You’re offline
              </p>
              <p className="text-amber-700/80 dark:text-amber-200/80">
                Recent data is still available. Changes will sync when you’re back online.
              </p>
            </div>
          </div>
        </div>
      )}

      {showInstall && (
        <div
          className="pointer-events-auto mx-auto max-w-xl w-full rounded-xl border border-emerald-500/40 bg-emerald-50/90 dark:bg-emerald-500/10 backdrop-blur px-3 py-2 shadow-sm flex items-center justify-between gap-3"
          role="dialog"
          aria-label="Install MediTrack"
        >
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.25)]" />
            <div className="text-xs">
              <p className="font-semibold text-emerald-900 dark:text-emerald-100">
                Install MediTrack
              </p>
              <p className="text-emerald-800/80 dark:text-emerald-100/80">
                Add MediTrack to your home screen for a faster, full-screen experience.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowInstall(false)}
              className="px-2 py-1 text-xs rounded-lg text-emerald-900/70 dark:text-emerald-100/80 hover:bg-emerald-100/60 dark:hover:bg-emerald-500/20"
            >
              Not now
            </button>
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
            >
              Install
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstallAndStatusBanner;


