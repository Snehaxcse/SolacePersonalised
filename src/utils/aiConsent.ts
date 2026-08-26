export const AI_CONSENT_STORAGE_KEY = 'solace_ai_consent';
export const AI_CONSENT_CHANGE_EVENT = 'solace-ai-consent-change';

export type AiConsentPreference = 'enabled' | 'declined';

export function readAiConsent(): AiConsentPreference | null {
  try {
    const value = window.localStorage.getItem(AI_CONSENT_STORAGE_KEY);
    if (value === 'enabled' || value === 'declined') return value;
    return null;
  } catch {
    return null;
  }
}

export function writeAiConsent(value: AiConsentPreference): void {
  try {
    window.localStorage.setItem(AI_CONSENT_STORAGE_KEY, value);
    window.dispatchEvent(new Event(AI_CONSENT_CHANGE_EVENT));
  } catch {
    // ignore quota / private-mode failures
  }
}

export function isAiEnabled(): boolean {
  return readAiConsent() === 'enabled';
}
