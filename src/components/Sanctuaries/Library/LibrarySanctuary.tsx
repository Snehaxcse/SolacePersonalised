import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SanctuaryHeader from '../../shared/SanctuaryHeader';
import { getLibraryReadingNook, getJournalReflection, getWordOfDay } from '../../../utils/claudeService';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { useAiConsent } from '../../../context/AiConsentContext';
import { readQuizWeather } from '../../../utils/solaceMemory';

type Tab = 'nook' | 'journal' | 'breathe' | 'word';

const BREATHING_PHASES = [
  { label: 'breathe in', duration: 4000, action: 'in' },
  { label: 'hold', duration: 7000, action: 'hold' },
  { label: 'let go', duration: 8000, action: 'out' },
];

export default function LibrarySanctuary() {
  const { requestConsent } = useAiConsent();
  const [tab, setTab] = useState<Tab>('nook');
  const weather = readQuizWeather();

  // Reading nook
  const [nook, setNook] = useState<{ poem: string; prose: string; sentence: string } | null>(null);
  const [nookLoading, setNookLoading] = useState(false);

  // Journal
  const [journalText, setJournalText] = useLocalStorage<string>('solace_journal_entries', '');
  const [reflection, setReflection] = useState('');
  const [reflectLoading, setReflectLoading] = useState(false);
  const journalTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Word of day
  const [wordData, setWordData] = useLocalStorage<{ word: string; explanation: string; date: string } | null>('solace_word_of_day', null);

  // Breathing
  const [breathPhase, setBreathPhase] = useState(0);
  const [breathActive, setBreathActive] = useState(false);
  const [breathCycles, setBreathCycles] = useState(0);
  const breathTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Breathing timer
  useEffect(() => {
    if (!breathActive) return;
    const phase = BREATHING_PHASES[breathPhase];
    breathTimer.current = setTimeout(() => {
      const next = (breathPhase + 1) % BREATHING_PHASES.length;
      setBreathPhase(next);
      if (next === 0) setBreathCycles(c => c + 1);
    }, phase.duration);
    return () => { if (breathTimer.current) clearTimeout(breathTimer.current); };
  }, [breathActive, breathPhase]);

  const startBreathe = () => {
    setBreathActive(true);
    setBreathPhase(0);
    setBreathCycles(0);
  };
  const stopBreathe = () => {
    setBreathActive(false);
    if (breathTimer.current) clearTimeout(breathTimer.current);
  };

  const currentBreath = BREATHING_PHASES[breathPhase];
  const breathProgress = breathActive ? 1 : 0;

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col" style={{ backgroundColor: '#1A1F3A' }}>
      <SanctuaryHeader sanctuaryName="the library" textColor="text-[#F5F0E8]" />

      {/* Nav tabs */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2 bg-[#2D3561]/80 backdrop-blur-md rounded-full px-3 py-2">
        {(['nook', 'journal', 'breathe', 'word'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-xs font-light tracking-wide transition-all duration-300 ${
              tab === t ? 'bg-[#C9A84C] text-[#1A1F3A]' : 'text-[#F5F0E8]/50 hover:text-[#F5F0E8]/80'
            }`}
          >
            {t === 'nook' ? 'reading' : t === 'word' ? 'word' : t}
          </button>
        ))}
      </div>

      <div className="flex-1 pt-20 pb-24 px-4 sm:px-8 max-w-2xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {tab === 'nook' && (
            <motion.div key="nook" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
              <h2 className="text-[#C9A84C] font-light text-sm tracking-widest uppercase mb-2">curated for you</h2>
              {weather && (
                <p className="text-[#F5F0E8]/35 text-xs font-light italic mb-8">for a {weather} day</p>
              )}
              {!weather && <div className="mb-8" />}
              {nookLoading && <p className="text-[#F5F0E8]/40 text-sm italic">gathering words...</p>}
              {nook && (
                <div className="flex flex-col gap-6">
                  {/* Poem */}
                  <div className="border-l-2 border-[#C9A84C]/40 pl-6 py-2">
                    <p className="text-[10px] text-[#C9A84C]/60 uppercase tracking-widest mb-3">poem</p>
                    <p className="text-[#F5F0E8]/85 text-base leading-8 font-light whitespace-pre-line"
                      style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic' }}>
                      {nook.poem}
                    </p>
                  </div>
                  {/* Prose */}
                  <div className="border-l-2 border-[#C9A84C]/20 pl-6 py-2">
                    <p className="text-[10px] text-[#C9A84C]/60 uppercase tracking-widest mb-3">prose</p>
                    <p className="text-[#F5F0E8]/75 text-sm leading-7 font-light">{nook.prose}</p>
                  </div>
                  {/* Sentence */}
                  <div className="bg-[#2D3561]/60 rounded-2xl px-6 py-5 text-center">
                    <p className="text-[#C9A84C] text-lg leading-relaxed font-light"
                      style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic' }}>
                      {nook.sentence}
                    </p>
                  </div>
                  <button type="button" onClick={handleGather} className="text-[#C9A84C]/40 hover:text-[#C9A84C]/70 text-xs tracking-wide transition-colors duration-300 text-center">
                    gather something else
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {tab === 'journal' && (
            <motion.div key="journal" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="flex flex-col h-full">
              <h2 className="text-[#C9A84C] font-light text-sm tracking-widest uppercase mb-6">private journal</h2>
              <textarea
                value={journalText}
                onChange={e => handleJournalChange(e.target.value)}
                placeholder="begin wherever you are..."
                className="flex-1 min-h-64 w-full bg-transparent text-[#F5F0E8]/85 text-base leading-8 font-light resize-none outline-none placeholder-[#F5F0E8]/20 border-b border-[#C9A84C]/10 pb-4 mb-6"
                style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', caretColor: '#C9A84C' }}
              />
              <button
                type="button"
                onClick={handleReflect}
                disabled={reflectLoading || !journalText.trim()}
                aria-label="Ask for an AI reflection on this journal entry"
                className="self-start text-xs text-[#C9A84C]/60 hover:text-[#C9A84C] transition-colors duration-300 tracking-widest uppercase disabled:opacity-30"
              >
                {reflectLoading ? 'listening...' : 'reflect'}
              </button>
              <AnimatePresence>
                {reflection && (
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-5 text-[#C9A84C]/75 text-base leading-7 font-light"
                    style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic' }}
                  >
                    {reflection}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {tab === 'breathe' && (
            <motion.div key="breathe" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="flex flex-col items-center pt-8">
              <h2 className="text-[#C9A84C] font-light text-sm tracking-widest uppercase mb-12">4 · 7 · 8 breathing</h2>

              {/* Book animation */}
              <div className="relative w-48 h-36 mb-10">
                {/* Book spine */}
                <div className="absolute inset-0 rounded-r-lg rounded-l-sm" style={{ backgroundColor: '#2D3561', boxShadow: '2px 2px 12px rgba(0,0,0,0.4)' }} />
                {/* Page effect */}
                <AnimatePresence>
                  {breathActive && (
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
                <div className="absolute inset-0 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={breathPhase}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-[#C9A84C]/80 text-sm font-light tracking-widest text-center"
                    >
                      {breathActive ? currentBreath.label : ''}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>

              {breathCycles >= 3 && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[#F5F0E8]/30 text-xs italic mb-6 tracking-wide">
                  you can rest now.
                </motion.p>
              )}

              {!breathActive ? (
                <button onClick={startBreathe} className="text-[#C9A84C]/60 hover:text-[#C9A84C] text-xs tracking-widest uppercase transition-colors duration-300 border border-[#C9A84C]/20 hover:border-[#C9A84C]/50 rounded-full px-6 py-2">
                  begin
                </button>
              ) : (
                <button onClick={stopBreathe} className="text-[#F5F0E8]/30 hover:text-[#F5F0E8]/60 text-xs tracking-widest uppercase transition-colors duration-300">
                  pause
                </button>
              )}
            </motion.div>
          )}

          {tab === 'word' && (
            <motion.div key="word" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="flex flex-col items-center pt-12">
              <h2 className="text-[#C9A84C] font-light text-sm tracking-widest uppercase mb-12">word of today</h2>
              {wordData ? (
                <div className="text-center bg-[#2D3561]/60 rounded-3xl px-10 py-10 max-w-sm">
                  <p className="text-[#C9A84C] font-light mb-5 tracking-widest"
                    style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '3.5rem', lineHeight: 1 }}>
                    {wordData.word}
                  </p>
                  <p className="text-[#F5F0E8]/60 text-sm font-light leading-7 italic" style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
                    {wordData.explanation}
                  </p>
                </div>
              ) : (
                <p className="text-[#F5F0E8]/30 text-sm italic">finding a word for you...</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
