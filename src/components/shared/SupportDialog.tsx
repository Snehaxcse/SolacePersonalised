import { useId, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface Props {
  open: boolean;
  onClose: () => void;
}

const LINK_CLASS =
  'text-[#3d3229] underline decoration-[#3d3229]/40 underline-offset-4 hover:decoration-[#3d3229]/80 rounded-sm';

export default function SupportDialog({ open, onClose }: Props) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useFocusTrap(open, panelRef, onClose, closeRef);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-[#1a1612]/50"
            aria-hidden="true"
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            tabIndex={-1}
            className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl px-5 sm:px-6 py-6 sm:py-7 outline-none"
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
              A note about care
            </h2>
            <div id={descId} className="text-[#3d3229]/80 text-sm font-light leading-6 space-y-3 mb-6">
              <p>
                Solace can offer a quiet space, but it isn’t emergency or professional
                mental-health care. It is not therapy, and it is not a diagnosis.
              </p>
              <p>
                If you may be in immediate danger, or if you may harm yourself or someone
                else, contact local emergency services now. If you can, also reach someone
                nearby you trust.
              </p>
              <p>
                Crisis support depends on where you are. These directories can help you
                find resources for your location:
              </p>
              <ul className="space-y-2 pl-1">
                <li>
                  <a
                    className={LINK_CLASS}
                    href="https://www.iasp.info/suicidalthoughts/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    IASP local resources
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
                <li>
                  <a
                    className={LINK_CLASS}
                    href="https://findahelpline.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Find A Helpline
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              </ul>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="w-full px-4 py-3 rounded-full border border-[#3d3229]/25 text-[#3d3229] text-sm font-light tracking-wide hover:border-[#3d3229]/50 hover:bg-[#3d3229]/5"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
