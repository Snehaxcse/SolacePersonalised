import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SanctuaryHeader from '../../shared/SanctuaryHeader';
import MemoryGame from './MemoryGame';
import WordAssociation from './WordAssociation';
import ColorSort from './ColorSort';
import FocusTimer from './FocusTimer';
import Curiosity from './Curiosity';
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion';
import { useRovingTabs } from '../../../hooks/useRovingTabs';

const TABS = ['memory', 'words', 'colors', 'focus', 'curiosity'] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  memory: 'match',
  words: 'words',
  colors: 'color',
  focus: 'focus',
  curiosity: 'curiosity',
};

const TAB_TITLES: Record<Tab, string> = {
  memory: 'pattern memory',
  words: 'word association',
  colors: 'color sort',
  focus: 'deep dive timer',
  curiosity: 'curiosity',
};

export default function ArcadeSanctuary() {
  const [tab, setTab] = useState<Tab>('memory');
  const reduceMotion = usePrefersReducedMotion();
  const { refs, onKeyDown } = useRovingTabs(TABS, tab, setTab);

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

      <main id="main" className="flex-1 pt-20 pb-24 px-4 sm:px-8 max-w-2xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            role="tabpanel"
            id={`arcade-panel-${tab}`}
            aria-labelledby={`arcade-tab-${tab}`}
            initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.15 : 0.4 }}
          >
            <h1 className="text-[#C084FC] font-light text-sm tracking-widest uppercase mb-8">
              {TAB_TITLES[tab]}
            </h1>
            {tab === 'memory' && <MemoryGame />}
            {tab === 'words' && <WordAssociation />}
            {tab === 'colors' && <ColorSort />}
            {tab === 'focus' && <FocusTimer />}
            {tab === 'curiosity' && <Curiosity />}
          </motion.div>
        </AnimatePresence>
      </main>

      <div
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-1 bg-[#2D2060]/90 backdrop-blur-md rounded-full px-3 py-2"
        role="tablist"
        aria-label="Arcade activities"
      >
        {TABS.map((key, index) => (
          <button
            key={key}
            ref={el => { refs.current[index] = el; }}
            type="button"
            role="tab"
            id={`arcade-tab-${key}`}
            aria-selected={tab === key}
            aria-controls={`arcade-panel-${key}`}
            tabIndex={tab === key ? 0 : -1}
            onClick={() => setTab(key)}
            onKeyDown={e => onKeyDown(e, index)}
            className={`px-4 py-1.5 rounded-full text-xs font-light tracking-wide transition-all duration-300 ${
              tab === key ? 'bg-[#C084FC] text-white' : 'text-[#F0E6FF]/80 hover:text-[#F0E6FF]'
            }`}
          >
            {TAB_LABELS[key]}
          </button>
        ))}
      </div>
    </div>
  );
}
