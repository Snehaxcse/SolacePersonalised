import { useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useFocusTrap } from '../../../hooks/useFocusTrap';

interface Props {
  open: boolean;
  confirmRelease: boolean;
  reduceMotion: boolean;
  aiLoading: boolean;
  onKeep: () => void;
  onSit: () => void;
  onReflect: () => void;
  onTalk: () => void;
  onRequestRelease: () => void;
  onCancelRelease: () => void;
  onConfirmRelease: () => void;
}

export default function StudioRitual({
  open,
  confirmRelease,
  reduceMotion,
  aiLoading,
  onKeep,
  onSit,
  onReflect,
  onTalk,
  onRequestRelease,
  onCancelRelease,
  onConfirmRelease,
}: Props) {
  const confirmRef = useRef<HTMLDivElement>(null);
  useFocusTrap(confirmRelease, confirmRef, onCancelRelease);

  const rise = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.15 } }
    : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 8 }, transition: { duration: 0.4 } };

  return (
    <>
      <AnimatePresence>
        {open && !confirmRelease && (
          <motion.div
            role="region"
            aria-label="What to do with this drawing"
          className="fixed bottom-24 sm:bottom-4 left-1/2 -translate-x-1/2 z-40 w-[min(28rem,calc(100vw-1.5rem))] px-5 py-4 bg-white/90 backdrop-blur-md rounded-2xl shadow-md"
            {...rise}
          >
            <p className="text-[#6B4226] text-sm font-light text-center mb-1" style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
              sit with it, if you want
            </p>
            <p className="text-[#6B4226]/70 text-xs font-light text-center mb-4">
              you don't have to make sense of it.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              <button type="button" onClick={onKeep} className="text-[#6B4226] text-xs tracking-wide hover:text-[#C4622D]">
                keep this
              </button>
              <button type="button" onClick={onRequestRelease} className="text-[#6B4226] text-xs tracking-wide hover:text-[#C4622D]">
                let it go
              </button>
              <button type="button" onClick={onSit} className="text-[#6B4226] text-xs tracking-wide hover:text-[#C4622D]">
                sit with it
              </button>
              <button
                type="button"
                onClick={onReflect}
                disabled={aiLoading}
                className="text-[#6B4226] text-xs tracking-wide hover:text-[#C4622D] disabled:opacity-40"
              >
                reflect with Solace
              </button>
            </div>
            <button
              type="button"
              onClick={onTalk}
              className="mt-3 block mx-auto text-[#6B4226]/70 text-[11px] tracking-wide hover:text-[#C4622D]"
            >
              talk about this
            </button>
            <p className="mt-1 text-[#6B4226]/55 text-[10px] text-center font-light">
              talking does not take your drawing with it.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmRelease && (
          <motion.div
            ref={confirmRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="studio-release-title"
            className="fixed bottom-24 sm:bottom-4 left-1/2 -translate-x-1/2 z-50 w-[min(26rem,calc(100vw-1.5rem))] px-5 py-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-md outline-none"
            {...rise}
          >
            <h2 id="studio-release-title" className="text-[#6B4226] text-sm font-light text-center mb-2" style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
              let this go?
            </h2>
            <p className="text-[#6B4226]/75 text-xs font-light text-center leading-5 mb-4">
              it will fade from the canvas. you can cancel. pieces already in your gallery stay.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button type="button" onClick={onConfirmRelease} className="text-[#C4622D] text-xs tracking-wide">
                release
              </button>
              <button type="button" onClick={onCancelRelease} className="text-[#6B4226] text-xs tracking-wide">
                keep it here
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
