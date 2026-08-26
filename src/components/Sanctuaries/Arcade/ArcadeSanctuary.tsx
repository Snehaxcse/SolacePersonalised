import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SanctuaryHeader from '../../shared/SanctuaryHeader';
import MemoryGame from './MemoryGame';
import WordAssociation from './WordAssociation';
import ColorSort from './ColorSort';
import FocusTimer from './FocusTimer';
import Curiosity from './Curiosity';

type Tab = 'memory' | 'words' | 'colors' | 'focus' | 'curiosity';

export default function ArcadeSanctuary() {
  const [tab, setTab] = useState<Tab>('memory');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'memory', label: 'match' },
    { key: 'words', label: 'words' },
    { key: 'colors', label: 'color' },
    { key: 'focus', label: 'focus' },
    { key: 'curiosity', label: '?' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col" style={{ backgroundColor: '#1E1535' }}>
      {/* Fairy light ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
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
            animate={{ opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: 2 + (i % 3), repeat: Infinity, delay: i * 0.3 }}
          />
        ))}
      </div>

      <SanctuaryHeader sanctuary="arcade" textColor="text-[#F0E6FF]" />

      {/* Tab content */}
      <div className="flex-1 pt-20 pb-24 px-4 sm:px-8 max-w-2xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <h2 className="text-[#C084FC]/60 font-light text-sm tracking-widest uppercase mb-8">
              {tab === 'memory' ? 'pattern memory' : tab === 'words' ? 'word association' : tab === 'colors' ? 'color sort' : tab === 'focus' ? 'deep dive timer' : 'curiosity'}
            </h2>
            {tab === 'memory' && <MemoryGame />}
            {tab === 'words' && <WordAssociation />}
            {tab === 'colors' && <ColorSort />}
            {tab === 'focus' && <FocusTimer />}
            {tab === 'curiosity' && <Curiosity />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Nav */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-1 bg-[#2D2060]/80 backdrop-blur-md rounded-full px-3 py-2">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-light tracking-wide transition-all duration-300 ${
              tab === t.key ? 'bg-[#C084FC] text-white' : 'text-[#F0E6FF]/40 hover:text-[#F0E6FF]/70'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
