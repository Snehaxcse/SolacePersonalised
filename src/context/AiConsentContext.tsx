/* eslint-disable react-refresh/only-export-components -- context module also exports the hook */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import AiConsentModal from '../components/shared/AiConsentModal';
import {
  AI_CONSENT_CHANGE_EVENT,
  readAiConsent,
  writeAiConsent,
  type AiConsentPreference,
} from '../utils/aiConsent';

interface AiConsentContextValue {
  preference: AiConsentPreference | null;
  isEnabled: boolean;
  requestConsent: (options?: { force?: boolean }) => Promise<boolean>;
  openSettings: () => void;
}

const AiConsentContext = createContext<AiConsentContextValue | null>(null);

export function AiConsentProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<AiConsentPreference | null>(() => readAiConsent());
  const [open, setOpen] = useState(false);
  const resolverRef = useRef<((allowed: boolean) => void) | null>(null);
  const skippedAskRef = useRef(false);

  useEffect(() => {
    const sync = () => setPreference(readAiConsent());
    window.addEventListener(AI_CONSENT_CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(AI_CONSENT_CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const settle = useCallback((allowed: boolean) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setOpen(false);
    resolve?.(allowed);
  }, []);

  const requestConsent = useCallback((options?: { force?: boolean }): Promise<boolean> => {
    const current = readAiConsent();
    if (current === 'enabled') return Promise.resolve(true);
    if (current === 'declined') return Promise.resolve(false);
    if (skippedAskRef.current && !options?.force) return Promise.resolve(false);
    skippedAskRef.current = false;
    if (resolverRef.current) {
      return new Promise(resolve => {
        const previous = resolverRef.current;
        resolverRef.current = allowed => {
          previous?.(allowed);
          resolve(allowed);
        };
      });
    }
    setOpen(true);
    return new Promise(resolve => {
      resolverRef.current = resolve;
    });
  }, []);

  const openSettings = useCallback(() => {
    skippedAskRef.current = false;
    setOpen(true);
  }, []);

  const onChoose = useCallback((value: AiConsentPreference) => {
    skippedAskRef.current = false;
    writeAiConsent(value);
    setPreference(value);
    settle(value === 'enabled');
  }, [settle]);

  const onDismiss = useCallback(() => {
    skippedAskRef.current = true;
    settle(false);
  }, [settle]);

  const value = useMemo<AiConsentContextValue>(
    () => ({
      preference,
      isEnabled: preference === 'enabled',
      requestConsent,
      openSettings,
    }),
    [preference, requestConsent, openSettings]
  );

  return (
    <AiConsentContext.Provider value={value}>
      {children}
      <AiConsentModal
        open={open}
        current={preference}
        onChoose={onChoose}
        onDismiss={onDismiss}
      />
    </AiConsentContext.Provider>
  );
}

export function useAiConsent(): AiConsentContextValue {
  const ctx = useContext(AiConsentContext);
  if (!ctx) {
    throw new Error('useAiConsent must be used within AiConsentProvider');
  }
  return ctx;
}
