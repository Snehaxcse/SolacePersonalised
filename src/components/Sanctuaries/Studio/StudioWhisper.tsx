import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ConvoMessage } from './studioTypes';

interface Props {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  convoOpen: boolean;
  latestMessage?: ConvoMessage;
}

export default function StudioWhisper({ enabled, onChange, convoOpen, latestMessage }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onChange(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onChange]);

  return (
    <>
      <AnimatePresence>
        {enabled && (
          <motion.p
            className="fixed bottom-3 right-4 z-30 text-[10px] text-[#6B4226]/20 tracking-widest pointer-events-none"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            whisper mode
          </motion.p>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {enabled && !convoOpen && latestMessage && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-30 px-6 py-2"
            style={{ backgroundColor: 'rgba(245,236,215,0.85)', backdropFilter: 'blur(8px)' }}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          >
            <p className="text-[#6B4226]/50 text-xs italic text-center truncate" style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
              {latestMessage.text}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
