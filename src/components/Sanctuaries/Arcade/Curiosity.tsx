import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRandomCuriosity } from '../../../utils/claudeService';
import { useAiConsent } from '../../../context/AiConsentContext';

/** Kept for compatibility. Hidden from Arcade entry in Phase 4B. */
export default function Curiosity() {
  const { requestConsent } = useAiConsent();
  const [fact, setFact] = useState('');
  const [loading, setLoading] = useState(false);

  const fetch_ = async () => {
    await requestConsent({ force: true });
    setLoading(true);
    const f = await getRandomCuriosity();
    setFact(f);
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <button
        type="button"
        onClick={fetch_}
        disabled={loading}
        className="text-xs text-[#C084FC] hover:text-[#E9D5FF] uppercase tracking-widest transition-colors duration-300 border border-[#C084FC]/40 rounded-full px-6 py-2 disabled:opacity-40"
      >
        {loading ? 'thinking...' : 'show me something interesting'}
      </button>
      <div aria-live="polite" className="w-full flex justify-center">
        <AnimatePresence mode="wait">
          {fact && (
            <motion.div key={fact} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-[#2D2060]/80 rounded-2xl px-6 py-6 max-w-sm text-center"
              style={{ boxShadow: '0 0 30px rgba(192,132,252,0.08)' }}>
              <p className="text-[#F0E6FF]/90 text-sm font-light leading-7">{fact}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
