import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SanctuaryHeader from '../../shared/SanctuaryHeader';
import MemoryGame from './MemoryGame';
import WordAssociation from './WordAssociation';
import ColorSort from './ColorSort';
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion';

type Need = 'patterned' | 'words' | 'simple';

const NEEDS: { id: Need; label: string; hint: string }[] = [
  { id: 'patterned', label: 'something patterned', hint: 'pairs to turn over' },
  { id: 'words', label: 'something with words', hint: 'one word, then another' },
  { id: 'simple', label: 'something simple', hint: 'dark to light' },
];

export default function ArcadeSanctuary() {
  const [need, setNeed] = useState<Need | null>(null);
  const reduceMotion = usePrefersReducedMotion();

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col" style={{ backgroundColor: '#1E1535' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 2 + (i % 3),
              height: 2 + (i % 3),
              left: `${5 + (i * 4.7) % 90}%`,
              top: `${5 + (i * 7.3) % 85}%`,
              backgroundColor: i % 3 === 0 ? '#C084FC' : i % 3 === 1 ? '#FFD700' : '#F0E6FF',
            }}
            animate={reduceMotion ? { opacity: 0.35 } : { opacity: [0.2, 0.8, 0.2] }}
            transition={reduceMotion ? { duration: 0 } : { duration: 2 + (i % 3), repeat: Infinity, delay: i * 0.3 }}
          />
        ))}
      </div>

      <SanctuaryHeader sanctuary="arcade" textColor="text-[#F0E6FF]" />

      <main id="main" className="flex-1 pt-20 pb-12 px-4 sm:px-8 max-w-2xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {!need && (
            <motion.div
              key="chooser"
              initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0.15 : 0.4 }}
              className="flex flex-col gap-6 pt-4"
            >
              <h1
                className="text-[#F0E6FF] text-2xl sm:text-3xl font-light leading-snug"
                style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
              >
                give me something else to think about
              </h1>
              <p className="text-[#F0E6FF]/70 text-sm font-light max-w-md">
                three quiet things in this room. you can stop whenever you want. nothing needs to happen next.
              </p>
              <div className="flex flex-col gap-3 mt-2 rounded-3xl border border-[#C084FC]/15 p-3 sm:p-4">
                {NEEDS.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setNeed(item.id)}
                    className="text-left rounded-2xl px-5 py-4 border border-[#C084FC]/25 hover:border-[#C084FC]/60 hover:bg-[#C084FC]/10 transition-colors duration-300 min-h-[4.5rem]"
                  >
                    <span className="block text-[#F0E6FF] text-sm font-light">{item.label}</span>
                    <span className="block text-[#F0E6FF]/55 text-xs mt-1">{item.hint}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {need && (
            <motion.div
              key={need}
              initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0.15 : 0.4 }}
            >
              <h1 className="sr-only">
                {need === 'patterned' ? 'something patterned' : need === 'words' ? 'something with words' : 'something simple'}
              </h1>
              {need === 'patterned' && <MemoryGame />}
              {need === 'words' && <WordAssociation />}
              {need === 'simple' && <ColorSort />}
              <button
                type="button"
                onClick={() => setNeed(null)}
                className="mt-10 min-h-9 px-4 py-2 rounded-full border border-[#C084FC]/25 text-[#F0E6FF]/75 text-xs tracking-wide"
              >
                something else
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
