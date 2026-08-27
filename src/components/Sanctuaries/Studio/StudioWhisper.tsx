import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface Props {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export default function StudioWhisper({ enabled, onChange }: Props) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onChange(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled, onChange]);

  return (
    <AnimatePresence>
      {enabled && (
        <motion.p
          className="fixed bottom-3 right-4 z-30 text-[10px] text-[#6B4226]/70 tracking-widest pointer-events-none"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          whisper mode
        </motion.p>
      )}
    </AnimatePresence>
  );
}
