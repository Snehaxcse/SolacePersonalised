import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SanctuaryHeader from '../../shared/SanctuaryHeader';
import { getLibraryReadingNook, getJournalReflection, getWordOfDay } from '../../../utils/claudeService';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { useAiConsent } from '../../../context/AiConsentContext';
import { readQuizWeather } from '../../../utils/solaceMemory';
import { useBreathingPattern, type BreathPhaseConfig } from '../../../hooks/useBreathingPattern';
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion';
import { useRovingTabs } from '../../../hooks/useRovingTabs';

const TABS = ['nook', 'journal', 'breathe', 'word'] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  nook: 'reading',
  journal: 'journal',
  breathe: 'breathe',
  word: 'word',
};

const TAB_TITLES: Record<Tab, string> = {
  nook: 'curated for you',
  journal: 'private journal',
  breathe: '4 · 7 · 8 breathing',
  word: 'word of today',
};

const LIBRARY_BREATH: readonly BreathPhaseConfig[] = [
  { label: 'breathe in', duration: 4000, action: 'in' },
  { label: 'hold', duration: 7000, action: 'hold' },
  { label: 'let go', duration: 8000, action: 'out' },
];

export default function LibrarySanctuary() {
  const { requestConsent } = useAiConsent();
  const reduceMotion = usePrefersReducedMotion();
  const [tab, setTab] = useState<Tab>('nook');
  const { refs, onKeyDown } = useRovingTabs(TABS, tab, setTab);
  const weather = readQuizWeather();

  const [nook, setNook] = useState<{ poem: string; prose: string; sentence: string } | null>(null);
  const [nookLoading, setNookLoading] = useState(false);

  const [journalText, setJournalText] = useLocalStorage<string>('solace_journal_entries', '');
  const [reflection, setReflection] = useState('');
  const [reflectLoading, setReflectLoading] = useState(false);
  const journalTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [wordData, setWordData] = useLocalStorage<{ word: string; explanation: string; date: string } | null>('solace_word_of_day', null);

  const {
    active: breathActive,
    phase: currentBreath,
    cycles: breathCycles,
    start: startBreathe,
    stop: stopBreathe,
  } = useBreathingPattern({ phases: LIBRARY_BREATH });

  const loadNook = useCallback(async () => {
    setNookLoading(true);
    const data = await getLibraryReadingNook();
    setNook(data);
    setNookLoading(false);
  }, []);

  useEffect(() => {
    if (tab === 'nook' && !nook) loadNook();
  }, [tab, nook, loadNook]);

  useEffect(() => {
    const today = new Date().toDateString();
    if (!wordData || wordData.date !== today) {
      getWordOfDay().then(data => setWordData({ ...data, date: today }));
    }
    // Word of day is fetched once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleJournalChange = (val: string) => {
    setJournalText(val);
    if (journalTimer.current) clearTimeout(journalTimer.current);
  };

  const handleReflect = async () => {
    if (!journalText.trim()) return;
    await requestConsent({ force: true });
    setReflectLoading(true);
    const r = await getJournalReflection(journalText);
    setReflection(r);
    setReflectLoading(false);
  };

  const handleGather = async () => {
    await requestConsent({ force: true });
    await loadNook();
  };

  const panelMotion = {
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0 },
    transition: { duration: reduceMotion ? 0.15 : 0.5 },
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col" style={{ backgroundColor: '#1A1F3A' }}>
      <SanctuaryHeader sanctuary="library" textColor="text-[#F5F0E8]" />

      <nav
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2 bg-[#2D3561]/80 backdrop-blur-md rounded-full px-3 py-2"
        role="tablist"
        aria-label="Library"
      >
        {TABS.map((t, index) => (
          <button
            key={t}
            ref={el => { refs.current[index] = el; }}
            type="button"
            role="tab"
            id={`library-tab-${t}`}
            aria-selected={tab === t}
            aria-controls={`library-panel-${t}`}
            tabIndex={tab === t ? 0 : -1}
            onClick={() => setTab(t)}
            onKeyDown={e => onKeyDown(e, index)}
            className={`px-4 py-1.5 rounded-full text-xs font-light tracking-wide transition-all duration-300 ${
              tab === t ? 'bg-[#C9A84C] text-[#1A1F3A]' : 'text-[#F5F0E8]/80 hover:text-[#F5F0E8]'
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </nav>

      <main id="main" className="flex-1 pt-20 pb-24 px-4 sm:px-8 max-w-2xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {tab === 'nook' && (
            <motion.div
              key="nook"
              id="library-panel-nook"
              role="tabpanel"
              aria-labelledby="library-tab-nook"
              {...panelMotion}
            >
              <h1 className="text-[#C9A84C] font-light text-sm tracking-widest uppercase mb-2">{TAB_TITLES.nook}</h1>
              {weather && (
                <p className="text-[#F5F0E8]/75 text-xs font-light italic mb-8">for a {weather} day</p>
              )}
              {!weather && <div className="mb-8" />}
              {nookLoading && <p className="text-[#F5F0E8]/75 text-sm italic">gathering words...</p>}
              {nook && (
                <div className="flex flex-col gap-6">
                  <div className="border-l-2 border-[#C9A84C]/40 pl-6 py-2">
                    <p className="text-[10px] text-[#C9A84C] uppercase tracking-widest mb-3">poem</p>
                    <p
                      className="text-[#F5F0E8]/90 text-base leading-8 font-light whitespace-pre-line"
                      style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic' }}
                    >
                      {nook.poem}
                    </p>
                  </div>
                  <div className="border-l-2 border-[#C9A84C]/20 pl-6 py-2">
                    <p className="text-[10px] text-[#C9A84C] uppercase tracking-widest mb-3">prose</p>
                    <p className="text-[#F5F0E8]/85 text-sm leading-7 font-light">{nook.prose}</p>
                  </div>
                  <div className="bg-[#2D3561]/60 rounded-2xl px-6 py-5 text-center">
                    <p
                      className="text-[#C9A84C] text-lg leading-relaxed font-light"
                      style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic' }}
                    >
                      {nook.sentence}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGather}
                    className="text-[#C9A84C] text-xs tracking-wide transition-colors duration-300 text-center"
                  >
                    gather something else
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {tab === 'journal' && (
            <motion.div
              key="journal"
              id="library-panel-journal"
              role="tabpanel"
              aria-labelledby="library-tab-journal"
              {...panelMotion}
              className="flex flex-col h-full"
            >
              <h1 className="text-[#C9A84C] font-light text-sm tracking-widest uppercase mb-6">{TAB_TITLES.journal}</h1>
              <label htmlFor="library-journal" className="sr-only">
                Private journal
              </label>
              <textarea
                id="library-journal"
                value={journalText}
                onChange={e => handleJournalChange(e.target.value)}
                placeholder="begin wherever you are..."
                aria-describedby="journal-advice-note"
                className="flex-1 min-h-64 w-full bg-transparent text-[#F5F0E8]/90 text-base leading-8 font-light resize-none outline-none placeholder-[#F5F0E8]/45 border-b border-[#C9A84C]/20 pb-4 mb-6"
                style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', caretColor: '#C9A84C' }}
              />
              <button
                type="button"
                onClick={handleReflect}
                disabled={reflectLoading || !journalText.trim()}
                aria-describedby="journal-advice-note"
                className="self-start text-xs text-[#C9A84C] transition-colors duration-300 tracking-widest uppercase disabled:opacity-40"
              >
                {reflectLoading ? 'listening...' : 'reflect'}
              </button>
              <p id="journal-advice-note" className="mt-3 text-[#F5F0E8]/70 text-[11px] font-light leading-5 max-w-md">
                Optional AI reflection on what you wrote. This is not medical or therapeutic advice.
              </p>
              <AnimatePresence>
                {reflection && (
                  <motion.p
                    initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    aria-live="polite"
                    className="mt-5 text-[#C9A84C] text-base leading-7 font-light"
                    style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic' }}
                  >
                    {reflection}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {tab === 'breathe' && (
            <motion.div
              key="breathe"
              id="library-panel-breathe"
              role="tabpanel"
              aria-labelledby="library-tab-breathe"
              {...panelMotion}
              className="flex flex-col items-center pt-8"
            >
              <h1 className="text-[#C9A84C] font-light text-sm tracking-widest uppercase mb-12">{TAB_TITLES.breathe}</h1>

              <div className="relative w-48 h-36 mb-6" aria-hidden="true">
                <div className="absolute inset-0 rounded-r-lg rounded-l-sm" style={{ backgroundColor: '#2D3561', boxShadow: '2px 2px 12px rgba(0,0,0,0.4)' }} />
                <AnimatePresence>
                  {breathActive && !reduceMotion && (
                    <motion.div
                      className="absolute right-0 top-0 bottom-0 rounded-r-lg origin-left"
                      style={{ backgroundColor: '#3d4a7a', width: '50%' }}
                      animate={
                        currentBreath.action === 'in'
                          ? { scaleX: [0, 1], skewY: ['-5deg', '0deg'] }
                          : currentBreath.action === 'out'
                          ? { scaleX: [1, 0], skewY: ['0deg', '-5deg'] }
                          : { scaleX: 1 }
                      }
                      transition={{ duration: currentBreath.duration / 1000, ease: 'easeInOut' }}
                    />
                  )}
                </AnimatePresence>
              </div>

              <p
                aria-live={breathActive ? 'polite' : 'off'}
                aria-atomic="true"
                className="text-[#C9A84C] text-sm font-light tracking-widest text-center mb-8 min-h-[1.25rem]"
              >
                {breathActive ? currentBreath.label : 'breathing ready'}
              </p>

              {breathCycles >= 3 && (
                <p className="text-[#F5F0E8]/75 text-xs italic mb-6 tracking-wide">
                  you can rest now.
                </p>
              )}

              {!breathActive ? (
                <button
                  type="button"
                  onClick={startBreathe}
                  className="text-[#C9A84C] text-xs tracking-widest uppercase transition-colors duration-300 border border-[#C9A84C]/40 rounded-full px-6 py-2"
                >
                  begin
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopBreathe}
                  className="text-[#F5F0E8]/80 text-xs tracking-widest uppercase transition-colors duration-300"
                >
                  pause
                </button>
              )}
            </motion.div>
          )}

          {tab === 'word' && (
            <motion.div
              key="word"
              id="library-panel-word"
              role="tabpanel"
              aria-labelledby="library-tab-word"
              {...panelMotion}
              className="flex flex-col items-center pt-12"
            >
              <h1 className="text-[#C9A84C] font-light text-sm tracking-widest uppercase mb-12">{TAB_TITLES.word}</h1>
              {wordData ? (
                <div className="text-center bg-[#2D3561]/60 rounded-3xl px-10 py-10 max-w-sm">
                  <p
                    className="text-[#C9A84C] font-light mb-5 tracking-widest"
                    style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '3.5rem', lineHeight: 1 }}
                  >
                    {wordData.word}
                  </p>
                  <p
                    className="text-[#F5F0E8]/80 text-sm font-light leading-7 italic"
                    style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
                  >
                    {wordData.explanation}
                  </p>
                </div>
              ) : (
                <p className="text-[#F5F0E8]/75 text-sm italic">finding a word for you...</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
