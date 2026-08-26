import { useId, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  SANCTUARY_LABELS,
  SANCTUARY_NEEDS,
  SANCTUARY_TYPES,
  type SanctuaryType,
} from '../../utils/sanctuaries';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface Props {
  open: boolean;
  current?: SanctuaryType | null;
  suggested?: SanctuaryType | null;
  onSelect: (type: SanctuaryType) => void;
  onClose: () => void;
}

export default function SanctuarySwitcher({ open, current, suggested, onSelect, onClose }: Props) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useFocusTrap(open, panelRef, onClose);

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
              className="text-[#3d3229] text-2xl font-light mb-2"
              style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
            >
              what do you need right now?
            </h2>
            <p id={descId} className="text-[#3d3229]/70 text-xs font-light mb-5 leading-5">
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
                    className="text-left rounded-2xl px-4 py-3 border border-[#3d3229]/15 hover:border-[#3d3229]/40 hover:bg-[#3d3229]/5 transition-colors duration-300"
                  >
                    <span className="block text-[#3d3229] text-sm font-light">{SANCTUARY_NEEDS[type]}</span>
                    <span className="block text-[#3d3229]/65 text-[10px] tracking-wide mt-1">
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
              className="mt-5 w-full px-4 py-2.5 rounded-full border border-[#3d3229]/20 text-[#3d3229] text-xs font-light tracking-wide hover:border-[#3d3229]/40"
            >
              Stay here
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
