import { useEffect, useId, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { AiConsentPreference } from '../../utils/aiConsent';

interface Props {
  open: boolean;
  current: AiConsentPreference | null;
  onChoose: (value: AiConsentPreference) => void;
  onDismiss: () => void;
}

const BUTTON_CLASS =
  'flex-1 px-4 py-3 rounded-full border border-[#3d3229]/25 text-[#3d3229] text-sm font-light tracking-wide hover:border-[#3d3229]/50 hover:bg-[#3d3229]/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3d3229] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F5ECD7]';

export default function AiConsentModal({ open, current, onChoose, onDismiss }: Props) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    const panel = panelRef.current;
    panel?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusables = () => {
      if (!panel) return [];
      return Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter(el => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true');
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onDismiss();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open, onDismiss]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-[#1a1612]/50" aria-hidden="true" />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            tabIndex={-1}
            className="relative w-full max-w-md rounded-3xl px-6 py-7 outline-none"
            style={{ backgroundColor: '#F5ECD7' }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            <h2
              id={titleId}
              className="text-[#3d3229] text-2xl font-light mb-4"
              style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
            >
              AI features are optional
            </h2>
            <div id={descId} className="text-[#3d3229]/75 text-sm font-light leading-6 space-y-3 mb-7">
              <p>Solace stores your writing, drawings, and notes on this device.</p>
              <p>
                If you enable AI features, the relevant input for that feature is sent to an external
                AI service through Solace’s server. Solace is not therapy, and these exchanges are not
                confidential medical care.
              </p>
              <p>
                You can use every sanctuary without AI. You can change this preference later from the
                header. Press Escape if you want to choose later; AI stays off until you decide.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                className={BUTTON_CLASS}
                onClick={() => onChoose('enabled')}
                aria-pressed={current === 'enabled'}
              >
                Enable AI features
              </button>
              <button
                type="button"
                className={BUTTON_CLASS}
                onClick={() => onChoose('declined')}
                aria-pressed={current === 'declined'}
              >
                Keep Solace local
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
