import { useState, useEffect, useRef } from 'react';
import { getWordAssociationStart, getWordAssociationObservation } from '../../../utils/claudeService';
import { useAiConsent } from '../../../context/AiConsentContext';

export default function WordAssociation() {
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
