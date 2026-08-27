import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SanctuaryHeader from '../../shared/SanctuaryHeader';
import { getLibraryReadingNook, getJournalReflection, getWordOfDay } from '../../../utils/claudeService';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { useAiConsent } from '../../../context/AiConsentContext';
import { readQuizWeather } from '../../../utils/solaceMemory';
import { useBreathingPattern, type BreathPhaseConfig } from '../../../hooks/useBreathingPattern';
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion';
import { useRovingTabs } from '../../../hooks/useRovingTabs';
import {
  createJournalEntry,
  exportJournalText,
  formatJournalStamp,
  loadJournalEntries,
  saveJournalEntries,
  type JournalEntry,
} from '../../../utils/journalStore';

const TABS = ['journal', 'nook', 'breathe', 'word'] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  journal: 'journal',
  nook: 'reading',
  breathe: 'breathe',
  word: 'word',
};

const LIBRARY_BREATH: readonly BreathPhaseConfig[] = [
  { label: 'breathe in', duration: 4000, action: 'in' },
  { label: 'hold', duration: 7000, action: 'hold' },
  { label: 'let go', duration: 8000, action: 'out' },
];

export default function LibrarySanctuary() {
  const navigate = useNavigate();
  const { requestConsent } = useAiConsent();
  const reduceMotion = usePrefersReducedMotion();
  const [tab, setTab] = useState<Tab>('journal');
  const { refs, onKeyDown } = useRovingTabs(TABS, tab, setTab);
  const weather = readQuizWeather();

  const [nook, setNook] = useState<{ poem: string; prose: string; sentence: string } | null>(null);
  const [nookLoading, setNookLoading] = useState(false);

  const [entries, setEntries] = useState<JournalEntry[]>(() => loadJournalEntries());
  const [activeId, setActiveId] = useState<string | null>(() => {
    const loaded = loadJournalEntries();
    return loaded[loaded.length - 1]?.id ?? null;
  });
  const [draft, setDraft] = useState(() => {
    const loaded = loadJournalEntries();
    return loaded[loaded.length - 1]?.text ?? '';
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [reflection, setReflection] = useState('');
  const [reflectLoading, setReflectLoading] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;

  const [wordData, setWordData] = useLocalStorage<{ word: string; explanation: string; date: string } | null>('solace_word_of_day', null);

  const {
    active: breathActive,
    phase: currentBreath,
    cycles: breathCycles,
    start: startBreathe,
    stop: stopBreathe,
  } = useBreathingPattern({ phases: LIBRARY_BREATH });

  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  const persist = useCallback((next: JournalEntry[]) => {
    saveJournalEntries(next);
    setEntries(next);
    entriesRef.current = next;
  }, []);

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const text = draftRef.current;
    const id = activeIdRef.current;
    const list = entriesRef.current;
    if (!id) {
      if (text.trim()) saveJournalEntries([...list, createJournalEntry(text)]);
      return;
    }
    saveJournalEntries(list.map(entry => (
      entry.id === id ? { ...entry, text, updatedAt: new Date().toISOString() } : entry
    )));
  }, []);

  const activeEntry = entries.find(entry => entry.id === activeId) ?? null;

  const commitDraft = useCallback((text: string, id: string | null) => {
    const list = entriesRef.current;
    if (!id) {
      if (!text.trim()) return null;
      const created = createJournalEntry(text);
      persist([...list, created]);
      setActiveId(created.id);
      return created.id;
    }
    persist(list.map(entry => (
      entry.id === id
        ? { ...entry, text, updatedAt: new Date().toISOString() }
        : entry
    )));
    return id;
  }, [persist]);

  const handleJournalChange = (val: string) => {
    setDraft(val);
    setReflection('');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => commitDraft(val, activeId), 400);
  };

  const openEntry = (id: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    commitDraft(draft, activeId);
    const next = entriesRef.current.find(entry => entry.id === id);
    setActiveId(id);
    setDraft(next?.text ?? '');
    setReflection('');
    setDeleteId(null);
  };

  const startNewPage = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (activeId && !draft.trim()) return;
    commitDraft(draft, activeId);
    const created = createJournalEntry('');
    persist([...entriesRef.current, created]);
    setActiveId(created.id);
    setDraft('');
    setReflection('');
    setDeleteId(null);
  };

  const deleteEntry = (id: string) => {
    const next = entriesRef.current.filter(entry => entry.id !== id);
    persist(next);
    const fallback = next[next.length - 1] ?? null;
    setActiveId(fallback?.id ?? null);
    setDraft(fallback?.text ?? '');
    setDeleteId(null);
    setReflection('');
  };

  const exportJournal = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    commitDraft(draft, activeId);
    const blob = new Blob([exportJournalText(entriesRef.current)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'solace-journal.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

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
    if (tab !== 'word') return;
    const today = new Date().toDateString();
    if (!wordData || wordData.date !== today) {
      getWordOfDay().then(data => setWordData({ ...data, date: today }));
    }
  }, [tab, wordData, setWordData]);

  const handleReflect = async () => {
    const text = draft.trim();
    if (!text) return;
    await requestConsent({ force: true });
    setReflectLoading(true);
    const r = await getJournalReflection(text);
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

  const entryList = entries.slice().reverse();

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col" style={{ backgroundColor: '#1A1F3A' }}>
      <SanctuaryHeader sanctuary="library" textColor="text-[#F5F0E8]" />

      <nav
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2 bg-[#2D3561]/80 backdrop-blur-md rounded-full px-3 py-2 max-w-[calc(100vw-1.5rem)] overflow-x-auto"
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
            className={`px-4 py-1.5 rounded-full text-xs font-light tracking-wide transition-all duration-300 whitespace-nowrap ${
              tab === t ? 'bg-[#C9A84C] text-[#1A1F3A]' : 'text-[#F5F0E8]/80 hover:text-[#F5F0E8]'
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </nav>

      <main id="main" className="flex-1 pt-20 pb-24 px-4 sm:px-8 max-w-3xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {tab === 'nook' && (
            <motion.div
              key="nook"
              id="library-panel-nook"
              role="tabpanel"
              aria-labelledby="library-tab-nook"
              {...panelMotion}
            >
              <h1 className="text-[#C9A84C] font-light text-sm tracking-widest uppercase mb-2">a quiet page</h1>
              {weather && (
                <p className="text-[#F5F0E8]/75 text-xs font-light italic mb-8">for a {weather} day</p>
              )}
              {!weather && <div className="mb-8" />}
              {nookLoading && <p className="text-[#F5F0E8]/75 text-sm italic">finding a page...</p>}
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
                    another page
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
              className="flex flex-col"
            >
              <h1 className="text-[#C9A84C] font-light text-sm tracking-widest uppercase mb-2">private journal</h1>
              <p className="text-[#F5F0E8]/70 text-xs font-light mb-5">kept on this device.</p>

              <div className="flex flex-col sm:flex-row gap-5">
                <div className="sm:w-44 shrink-0 sm:sticky sm:top-20">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h2 className="text-[#F5F0E8]/70 text-[10px] tracking-widest uppercase">pages</h2>
                    <button type="button" onClick={startNewPage} className="text-[#C9A84C] text-[10px] tracking-wide">
                      new page
                    </button>
                  </div>
                  {entryList.length === 0 ? (
                    <p className="text-[#F5F0E8]/50 text-xs font-light">no pages yet.</p>
                  ) : (
                    <ul className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-visible pb-1 sm:max-h-[60vh] sm:overflow-y-auto">
                      {entryList.map(entry => (
                        <li key={entry.id} className="shrink-0">
                          <button
                            type="button"
                            onClick={() => openEntry(entry.id)}
                            aria-current={entry.id === activeId ? 'true' : undefined}
                            className={`block w-40 sm:w-full text-left rounded-xl px-3 py-2 text-xs font-light ${
                              entry.id === activeId ? 'bg-[#C9A84C]/20 text-[#C9A84C]' : 'bg-[#2D3561]/50 text-[#F5F0E8]/80'
                            }`}
                          >
                            <span className="block">{formatJournalStamp(entry.createdAt)}</span>
                            <span className="block truncate text-[10px] opacity-70 mt-0.5">
                              {entry.text.trim() || 'empty page'}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                  <label htmlFor="library-journal" className="sr-only">
                    Journal page
                  </label>
                  <textarea
                    id="library-journal"
                    value={draft}
                    onChange={e => handleJournalChange(e.target.value)}
                    placeholder="begin wherever you are..."
                    aria-describedby="journal-privacy-note"
                    className="min-h-56 w-full bg-transparent text-[#F5F0E8]/90 text-base leading-8 font-light resize-none outline-none placeholder-[#F5F0E8]/45 border-b border-[#C9A84C]/20 pb-4 mb-4"
                    style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', caretColor: '#C9A84C' }}
                  />
                  <p id="journal-privacy-note" className="text-[#F5F0E8]/60 text-[11px] font-light leading-5 mb-4">
                    Writing stays here unless you choose to reflect or export. Reflection is optional and not medical advice.
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <button
                      type="button"
                      onClick={handleReflect}
                      disabled={reflectLoading || !draft.trim()}
                      className="text-xs text-[#C9A84C] tracking-widest uppercase disabled:opacity-40"
                    >
                      {reflectLoading ? 'listening...' : 'reflect'}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/companion')}
                      className="text-xs text-[#F5F0E8]/75 tracking-wide"
                    >
                      sit with this
                    </button>
                    <button
                      type="button"
                      onClick={exportJournal}
                      disabled={entries.length === 0 && !draft.trim()}
                      className="text-xs text-[#F5F0E8]/75 tracking-wide disabled:opacity-40"
                    >
                      export
                    </button>
                    {activeEntry && (
                      deleteId === activeEntry.id ? (
                        <span className="flex items-center gap-3 text-xs">
                          <button type="button" onClick={() => deleteEntry(activeEntry.id)} className="text-[#E8B4B8]">
                            delete this page
                          </button>
                          <button type="button" onClick={() => setDeleteId(null)} className="text-[#F5F0E8]/70">
                            keep
                          </button>
                        </span>
                      ) : (
                        <button type="button" onClick={() => setDeleteId(activeEntry.id)} className="text-xs text-[#F5F0E8]/60 tracking-wide">
                          delete page
                        </button>
                      )
                    )}
                  </div>
                  <p className="mt-2 text-[#F5F0E8]/50 text-[10px] font-light">
                    sitting with this does not take your writing with it.
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
                </div>
              </div>
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
              <h1 className="text-[#C9A84C] font-light text-sm tracking-widest uppercase mb-12">4 · 7 · 8 breathing</h1>

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
                {breathActive ? currentBreath.label : 'if you want to breathe'}
              </p>

              {breathCycles >= 3 && (
                <p className="text-[#F5F0E8]/75 text-xs italic mb-6 tracking-wide">
                  you can stop whenever you want.
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
              <h1 className="text-[#C9A84C] font-light text-sm tracking-widest uppercase mb-4">a word</h1>
              <p className="text-[#F5F0E8]/60 text-xs font-light mb-10">only if you want one.</p>
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
                <p className="text-[#F5F0E8]/75 text-sm italic">looking for a word...</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
