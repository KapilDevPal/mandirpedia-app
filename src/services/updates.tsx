import * as Updates from 'expo-updates';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

/**
 * Automatic over-the-air updates (EAS Update) for iOS and Android.
 *
 * - On launch, expo-updates checks automatically (app.json: checkAutomatically ON_LOAD)
 *   without delaying start-up (fallbackToCacheTimeout 0).
 * - When the app returns to the foreground (at most every 30 minutes) we check again
 *   and download in the background.
 * - A downloaded update applies on the next launch, or immediately if the user taps
 *   "Restart" in the banner. Nothing ever reloads mid-prayer without consent.
 *
 * Only JavaScript and bundled content (prayers, translations, images) can update this
 * way. Changes to native code need a new store build; runtimeVersion (fingerprint
 * policy) prevents an incompatible update from ever reaching an older binary.
 * Disabled in development and Expo Go.
 */
export type UpdateStatus = 'disabled' | 'idle' | 'checking' | 'downloading' | 'ready' | 'up-to-date' | 'error';

interface UpdatesContextValue {
  status: UpdateStatus;
  check: () => Promise<void>;
  restart: () => Promise<void>;
  dismissed: boolean;
  dismiss: () => void;
}

const UpdatesContext = createContext<UpdatesContextValue>({
  status: 'disabled',
  check: async () => {},
  restart: async () => {},
  dismissed: false,
  dismiss: () => {},
});

const RECHECK_MS = 30 * 60 * 1000;

export function UpdatesProvider({ children }: { children: ReactNode }) {
  const enabled = Updates.isEnabled && !__DEV__;
  const [status, setStatus] = useState<UpdateStatus>(enabled ? 'idle' : 'disabled');
  const [dismissed, setDismissed] = useState(false);
  const lastCheck = useRef(0);
  const busy = useRef(false);

  const check = useCallback(async () => {
    if (!enabled || busy.current) return;
    busy.current = true;
    lastCheck.current = Date.now();
    try {
      setStatus('checking');
      const result = await Updates.checkForUpdateAsync();
      if (!result.isAvailable) {
        setStatus((s) => (s === 'ready' ? s : 'up-to-date'));
        return;
      }
      setStatus('downloading');
      const fetched = await Updates.fetchUpdateAsync();
      setStatus(fetched.isNew ? 'ready' : 'up-to-date');
      if (fetched.isNew) setDismissed(false);
    } catch {
      // Offline or server unavailable: the app keeps working from its bundled content.
      setStatus('error');
    } finally {
      busy.current = false;
    }
  }, [enabled]);

  const restart = useCallback(async () => {
    try {
      await Updates.reloadAsync();
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    check();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && Date.now() - lastCheck.current > RECHECK_MS) check();
    });
    return () => sub.remove();
  }, [enabled, check]);

  return (
    <UpdatesContext.Provider value={{ status, check, restart, dismissed, dismiss: () => setDismissed(true) }}>{children}</UpdatesContext.Provider>
  );
}

export const useAppUpdates = () => useContext(UpdatesContext);

export const updateInfo = () => ({
  channel: Updates.channel,
  updateId: Updates.updateId,
  isEmbedded: Updates.isEmbeddedLaunch,
  runtimeVersion: Updates.runtimeVersion,
});
