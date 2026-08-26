import { useEffect, useId, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  SANCTUARY_LABELS,
  SANCTUARY_NEEDS,
  SANCTUARY_TYPES,
  type SanctuaryType,
} from '../../utils/solaceMemory';

interface Props {
  open: boolean;
  current?: SanctuaryType | null;
  suggested?: SanctuaryType | null;
  onSelect: (type: SanctuaryType) => void;
  onClose: () => void;
}

export default function SanctuarySwitcher({ open, current, suggested, onSelect, onClose }: Props) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    panelRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusables = () => {
      const panel = panelRef.current;
      if (!panel) return [];
      return Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
        )
      ).filter(el => el.getAttribute('aria-hidden') !== 'true');
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
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
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[75] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-[#1a1612]/50" aria-hidden="true" onClick={onClose} />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className="relative w-full max-w-md rounded-3xl px-6 py-7 outline-none"
            style={{ backgroundColor: '#F5ECD7' }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            <h2
              id={titleId}
              className="text-[#3d3229] text-2xl font-light mb-2"
              style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
            >
              what do you need right now?
            </h2>
            <p className="text-[#3d3229]/55 text-xs font-light mb-5 leading-5">
              A suggestion is only a starting place. You can visit any space.
            </p>
            <div className="flex flex-col gap-2">
              {SANCTUARY_TYPES.map(type => {
                const isCurrent = type === current;
                const isSuggested = type === suggested;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => onSelect(type)}
                    aria-current={isCurrent ? 'page' : undefined}
                    className="text-left rounded-2xl px-4 py-3 border border-[#3d3229]/15 hover:border-[#3d3229]/40 hover:bg-[#3d3229]/5 transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3d3229] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F5ECD7]"
                  >
                    <span className="block text-[#3d3229] text-sm font-light">{SANCTUARY_NEEDS[type]}</span>
                    <span className="block text-[#3d3229]/45 text-[10px] tracking-wide mt-1">
                      {SANCTUARY_LABELS[type]}
                      {isCurrent ? ' · here now' : ''}
                      {isSuggested && !isCurrent ? ' · your suggested space' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full px-4 py-2.5 rounded-full border border-[#3d3229]/20 text-[#3d3229]/70 text-xs font-light tracking-wide hover:border-[#3d3229]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3d3229]"
            >
              Stay here
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
