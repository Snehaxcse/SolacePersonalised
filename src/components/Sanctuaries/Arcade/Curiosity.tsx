import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRandomCuriosity } from '../../../utils/claudeService';
import { useAiConsent } from '../../../context/AiConsentContext';

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
      <button onClick={fetch_} disabled={loading}
        className="text-xs text-[#C084FC]/60 hover:text-[#C084FC] uppercase tracking-widest transition-colors duration-300 border border-[#C084FC]/20 rounded-full px-6 py-2 disabled:opacity-40">
        {loading ? 'thinking...' : 'show me something interesting'}
      </button>
      <AnimatePresence mode="wait">
        {fact && (
          <motion.div key={fact} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-[#2D2060]/60 rounded-2xl px-6 py-6 max-w-sm text-center"
            style={{ boxShadow: '0 0 30px rgba(192,132,252,0.08)' }}>
            <p className="text-[#F0E6FF]/75 text-sm font-light leading-7">{fact}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
