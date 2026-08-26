import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SanctuaryHeader from '../../shared/SanctuaryHeader';
import { getWordAssociationStart, getWordAssociationObservation, getRandomCuriosity } from '../../../utils/claudeService';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { useAiConsent } from '../../../context/AiConsentContext';

type Tab = 'memory' | 'words' | 'colors' | 'focus' | 'curiosity';

// ─── Pattern Memory ───────────────────────────────────────────────────────────
const SOFT_COLORS = ['#C084FC', '#818CF8', '#38BDF8', '#34D399', '#FCA5A5', '#FCD34D', '#F9A8D4', '#6EE7B7'];

interface Card { id: number; color: string; matched: boolean; flipped: boolean; }

function PatternMemory() {
  const [size, setSize] = useState<[number, number]>([4, 4]);
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [completed, setCompleted] = useState(false);
  const [message, setMessage] = useState('');

  const initCards = useCallback(() => {
    const [cols, rows] = size;
    const total = cols * rows;
    const pairCount = total / 2;
    const colors = Array.from({ length: pairCount }, (_, i) => SOFT_COLORS[i % SOFT_COLORS.length]);
    const allColors = [...colors, ...colors].sort(() => Math.random() - 0.5);
    setCards(allColors.map((color, id) => ({ id, color, matched: false, flipped: false })));
    setFlipped([]);
    setCompleted(false);
    setMessage('');
  }, [size]);

  useEffect(() => { initCards(); }, [initCards]);

  const handleFlip = (id: number) => {
    if (flipped.length >= 2) return;
    const card = cards[id];
    if (card.matched || card.flipped) return;

    const newCards = cards.map(c => c.id === id ? { ...c, flipped: true } : c);
    const newFlipped = [...flipped, id];
    setCards(newCards);
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      const [a, b] = newFlipped;
      if (newCards[a].color === newCards[b].color) {
        setTimeout(() => {
          setCards(c => c.map(card => newFlipped.includes(card.id) ? { ...card, matched: true } : card));
          setFlipped([]);
        }, 500);
      } else {
        setTimeout(() => {
          setCards(c => c.map(card => newFlipped.includes(card.id) ? { ...card, flipped: false } : card));
          setFlipped([]);
        }, 900);
      }
    }
  };

  useEffect(() => {
    if (cards.length > 0 && cards.every(c => c.matched)) {
      setCompleted(true);
      setMessage('well done. your mind is sharper than you think.');
      const nextSize: [number, number] = size[0] === 4 && size[1] === 4 ? [4, 5] : size[0] === 4 && size[1] === 5 ? [5, 5] : [4, 4];
      setTimeout(() => { setSize(nextSize); }, 2500);
    }
  }, [cards]);

  const [cols] = size;
  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, maxWidth: '360px', width: '100%' }}
      >
        {cards.map(card => (
          <motion.button
            key={card.id}
            onClick={() => handleFlip(card.id)}
            className="aspect-square rounded-xl cursor-pointer"
            style={{ minWidth: 0 }}
            animate={{
              rotateY: card.flipped || card.matched ? 180 : 0,
              backgroundColor: card.flipped || card.matched ? card.color : '#2D2060',
            }}
            transition={{ duration: 0.3 }}
            whileHover={!card.matched && !card.flipped ? { scale: 1.04 } : {}}
          >
            <span className="opacity-0">.</span>
          </motion.button>
        ))}
      </div>
      <AnimatePresence>
        {completed && message && (
          <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-[#F0E6FF]/60 text-xs italic text-center tracking-wide">
            {message}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Word Association ──────────────────────────────────────────────────────────
function WordAssociation() {
  const { requestConsent } = useAiConsent();
  const [startWord, setStartWord] = useState('');
  const [input, setInput] = useState('');
  const [words, setWords] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [active, setActive] = useState(false);
  const [done, setDone] = useState(false);
  const [observation, setObservation] = useState('');
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = async () => {
    setLoading(true);
    const word = await getWordAssociationStart();
    setStartWord(word);
    setWords([]);
    setInput('');
    setTimeLeft(60);
    setDone(false);
    setObservation('');
    setActive(true);
    setLoading(false);
  };

  useEffect(() => {
    if (!active) return;
    timer.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer.current!);
          setActive(false);
          setDone(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [active]);

  const handleKey = (e: React.KeyboardEvent) => {
    if ((e.key === ' ' || e.key === 'Enter') && input.trim()) {
      setWords(w => [...w, input.trim()]);
      setInput('');
    }
  };

  const reflectOnWords = async () => {
    if (words.length === 0) return;
    await requestConsent({ force: true });
    const obs = await getWordAssociationObservation(startWord || words[0], words.join(', '));
    setObservation(obs);
  };

  return (
    <div className="flex flex-col gap-5">
      {!active && !done && (
        <button onClick={start} disabled={loading}
          className="self-start text-xs text-[#C084FC]/60 hover:text-[#C084FC] uppercase tracking-widest transition-colors duration-300 border border-[#C084FC]/20 rounded-full px-6 py-2 disabled:opacity-40">
          {loading ? 'finding a word...' : 'begin'}
        </button>
      )}
      {active && startWord && (
        <>
          <div className="flex items-center gap-4">
            <p className="text-[#C084FC] text-2xl font-light" style={{ fontFamily: 'Cormorant Garamond, serif' }}>{startWord}</p>
            <span className="text-[#F0E6FF]/30 text-sm">{timeLeft}s</span>
          </div>
          <input
            autoFocus
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="type a word, press space..."
            className="bg-transparent border-b border-[#C084FC]/20 text-[#F0E6FF] text-sm font-light outline-none pb-1 placeholder-[#F0E6FF]/20"
          />
          <div className="flex flex-wrap gap-2">
            {words.map((w, i) => (
              <span key={i} className="text-[#F0E6FF]/50 text-xs bg-[#2D2060] px-2 py-1 rounded-full">{w}</span>
            ))}
          </div>
        </>
      )}
      {done && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {words.map((w, i) => (
              <span key={i} className="text-[#F0E6FF]/50 text-xs bg-[#2D2060] px-2 py-1 rounded-full">{w}</span>
            ))}
          </div>
          {observation && (
            <p className="text-[#C084FC]/70 text-sm italic" style={{ fontFamily: 'Cormorant Garamond, serif' }}>{observation}</p>
          )}
          {words.length > 0 && !observation && (
            <button
              type="button"
              onClick={reflectOnWords}
              className="self-start text-xs text-[#C084FC]/60 hover:text-[#C084FC] uppercase tracking-widest transition-colors duration-300 border border-[#C084FC]/20 rounded-full px-5 py-2"
            >
              reflect on my words
            </button>
          )}
          <button onClick={start} className="self-start text-xs text-[#F0E6FF]/30 hover:text-[#F0E6FF]/60 tracking-wide transition-colors duration-300">
            play again
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Color Sort ───────────────────────────────────────────────────────────────
function generateColorTiles(baseHue: number): { hsl: string; order: number }[] {
  const tiles = Array.from({ length: 8 }, (_, i) => ({
    hsl: `hsl(${baseHue}, 40%, ${20 + i * 8}%)`,
    order: i,
  }));
  return tiles.sort(() => Math.random() - 0.5).map((t, idx) => ({ ...t, idx }));
}

function ColorSort() {
  const [hue] = useState(() => Math.floor(Math.random() * 360));
  const [tiles, setTiles] = useState(() => generateColorTiles(hue));
  const [solved, setSolved] = useState(false);
  const [dragging, setDragging] = useState<number | null>(null);

  const checkSolved = (t: typeof tiles) => {
    for (let i = 0; i < t.length - 1; i++) {
      if (t[i].order > t[i + 1].order) return false;
    }
    return true;
  };

  const handleDragStart = (idx: number) => setDragging(idx);
  const handleDrop = (targetIdx: number) => {
    if (dragging === null || dragging === targetIdx) return;
    const newTiles = [...tiles];
    const [removed] = newTiles.splice(dragging, 1);
    newTiles.splice(targetIdx, 0, removed);
    setTiles(newTiles);
    setDragging(null);
    if (checkSolved(newTiles)) setSolved(true);
  };

  const newGame = () => {
    const newHue = Math.floor(Math.random() * 360);
    setTiles(generateColorTiles(newHue));
    setSolved(false);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-[#F0E6FF]/40 text-xs tracking-wide text-center">drag tiles from lightest to darkest</p>
      <div className="flex gap-2 flex-wrap justify-center">
        {tiles.map((tile, idx) => (
          <motion.div
            key={tile.hsl}
            className="w-12 h-16 rounded-xl cursor-grab active:cursor-grabbing"
            style={{ backgroundColor: tile.hsl, opacity: dragging === idx ? 0.5 : 1 }}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={e => e.preventDefault()}
            onDrop={() => handleDrop(idx)}
            animate={solved ? { scale: [1, 1.05, 1] } : {}}
            transition={solved ? { duration: 0.4, delay: idx * 0.05 } : {}}
          />
        ))}
      </div>
      {solved && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <p className="text-[#F0E6FF]/60 text-xs italic mb-3">just right.</p>
          <button onClick={newGame} className="text-xs text-[#C084FC]/50 hover:text-[#C084FC] tracking-wide transition-colors duration-300">
            new color
          </button>
        </motion.div>
      )}
    </div>
  );
}

// ─── Focus Timer ──────────────────────────────────────────────────────────────
function FocusTimer() {
  const [mode, setMode] = useState<'focus' | 'rest'>('focus');
  const [seconds, setSeconds] = useState(25 * 60);
  const [active, setActive] = useState(false);
  const [message, setMessage] = useState('');
  const [streak, setStreak] = useLocalStorage<number>('solace_arcade_streak', 0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!active) return;
    timer.current = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          clearInterval(timer.current!);
          setActive(false);
          if (mode === 'focus') {
            setStreak(n => n + 1);
            setMode('rest');
            setSeconds(5 * 60);
            setMessage('Something worth noticing was built in that quiet.');
          } else {
            setMode('focus');
            setSeconds(25 * 60);
            setMessage('');
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [active, mode]);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <p className="text-[#F0E6FF]/30 text-xs tracking-widest uppercase mb-2">{mode === 'focus' ? 'deep dive' : 'surface'}</p>
        <p className="text-[#C084FC] font-light" style={{ fontSize: '4rem', fontFamily: 'Cormorant Garamond, serif', lineHeight: 1 }}>
          {fmt(seconds)}
        </p>
      </div>

      {!active ? (
        <button onClick={() => setActive(true)}
          className="text-xs text-[#C084FC]/60 hover:text-[#C084FC] uppercase tracking-widest transition-colors duration-300 border border-[#C084FC]/20 rounded-full px-6 py-2">
          {seconds === (mode === 'focus' ? 25 * 60 : 5 * 60) ? 'begin' : 'continue'}
        </button>
      ) : (
        <button onClick={() => setActive(false)} className="text-xs text-[#F0E6FF]/30 hover:text-[#F0E6FF]/50 transition-colors duration-300">
          pause
        </button>
      )}

      {message && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[#F0E6FF]/50 text-sm italic text-center max-w-xs"
          style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          {message}
        </motion.p>
      )}

      <p className="text-[#F0E6FF]/20 text-xs">focus sessions today: {streak}</p>
    </div>
  );
}

// ─── Curiosity ────────────────────────────────────────────────────────────────
function Curiosity() {
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

// ─── Main Arcade ──────────────────────────────────────────────────────────────
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

      <SanctuaryHeader sanctuaryName="the arcade" textColor="text-[#F0E6FF]" />

      {/* Tab content */}
      <div className="flex-1 pt-20 pb-24 px-4 sm:px-8 max-w-2xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <h2 className="text-[#C084FC]/60 font-light text-sm tracking-widest uppercase mb-8">
              {tab === 'memory' ? 'pattern memory' : tab === 'words' ? 'word association' : tab === 'colors' ? 'color sort' : tab === 'focus' ? 'deep dive timer' : 'curiosity'}
            </h2>
            {tab === 'memory' && <PatternMemory />}
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
