import { useState } from 'react';
import { getWordAssociationStart, getWordAssociationObservation } from '../../../utils/claudeService';
import { useAiConsent } from '../../../context/AiConsentContext';

export default function WordAssociation() {
  const { requestConsent } = useAiConsent();
  const [startWord, setStartWord] = useState('');
  const [input, setInput] = useState('');
  const [words, setWords] = useState<string[]>([]);
  const [active, setActive] = useState(false);
  const [done, setDone] = useState(false);
  const [observation, setObservation] = useState('');
  const [loading, setLoading] = useState(false);

  const start = async () => {
    setLoading(true);
    const word = await getWordAssociationStart();
    setStartWord(word);
    setWords([]);
    setInput('');
    setDone(false);
    setObservation('');
    setActive(true);
    setLoading(false);
  };

  const stop = () => {
    setActive(false);
    setDone(true);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if ((e.key === ' ' || e.key === 'Enter') && input.trim()) {
      e.preventDefault();
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
        <button type="button" onClick={start} disabled={loading}
          className="self-start text-xs text-[#C084FC] hover:text-[#E9D5FF] uppercase tracking-widest transition-colors duration-300 border border-[#C084FC]/40 rounded-full px-6 py-2 disabled:opacity-40">
          {loading ? 'finding a word...' : 'begin'}
        </button>
      )}
      {active && startWord && (
        <>
          <p className="text-[#C084FC] text-2xl font-light" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            <span className="sr-only">Starting word: </span>{startWord}
          </p>
          <p className="text-[#F0E6FF]/70 text-xs">you can stop whenever you want.</p>
          <label className="flex flex-col gap-1">
            <span className="text-[#F0E6FF]/70 text-xs">Your word</span>
            <input
              autoFocus
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="type a word, press space..."
              className="bg-transparent border-b border-[#C084FC]/40 text-[#F0E6FF] text-sm font-light outline-none pb-1 placeholder-[#F0E6FF]/40"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {words.map((w, i) => (
              <span key={i} className="text-[#F0E6FF]/80 text-xs bg-[#2D2060] px-2 py-1 rounded-full">{w}</span>
            ))}
          </div>
          <button
            type="button"
            onClick={stop}
            className="self-start text-xs text-[#F0E6FF]/75 tracking-wide"
          >
            that's enough
          </button>
        </>
      )}
      {done && (
        <div className="flex flex-col gap-4" aria-live="polite">
          <p className="text-[#F0E6FF]/80 text-xs">a pause. {words.length} {words.length === 1 ? 'word' : 'words'}.</p>
          <div className="flex flex-wrap gap-2">
            {words.map((w, i) => (
              <span key={i} className="text-[#F0E6FF]/80 text-xs bg-[#2D2060] px-2 py-1 rounded-full">{w}</span>
            ))}
          </div>
          {observation && (
            <p className="text-[#C084FC] text-sm italic" style={{ fontFamily: 'Cormorant Garamond, serif' }}>{observation}</p>
          )}
          {words.length > 0 && !observation && (
            <button
              type="button"
              onClick={reflectOnWords}
              className="self-start text-xs text-[#C084FC] hover:text-[#E9D5FF] uppercase tracking-widest transition-colors duration-300 border border-[#C084FC]/40 rounded-full px-5 py-2"
            >
              sit with these words
            </button>
          )}
          <button onClick={start} type="button" className="self-start text-xs text-[#F0E6FF]/75 hover:text-[#F0E6FF] tracking-wide transition-colors duration-300">
            another round
          </button>
        </div>
      )}
    </div>
  );
}
