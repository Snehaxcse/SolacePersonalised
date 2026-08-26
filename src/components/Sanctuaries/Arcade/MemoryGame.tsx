import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PAIRS = [
  { color: '#C084FC', name: 'violet' },
  { color: '#818CF8', name: 'indigo' },
  { color: '#38BDF8', name: 'sky' },
  { color: '#34D399', name: 'mint' },
  { color: '#FCA5A5', name: 'rose' },
  { color: '#FCD34D', name: 'gold' },
  { color: '#F9A8D4', name: 'blush' },
  { color: '#6EE7B7', name: 'seafoam' },
];

interface Card { id: number; color: string; name: string; matched: boolean; flipped: boolean; }

export default function MemoryGame() {
  const [size, setSize] = useState<[number, number]>([4, 4]);
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [completed, setCompleted] = useState(false);
  const [message, setMessage] = useState('');

  const initCards = useCallback(() => {
    const [cols, rows] = size;
    const total = cols * rows;
    const pairCount = total / 2;
    const traits = Array.from({ length: pairCount }, (_, i) => PAIRS[i % PAIRS.length]);
    const shuffled = [...traits, ...traits].sort(() => Math.random() - 0.5);
    setCards(shuffled.map((trait, id) => ({ id, color: trait.color, name: trait.name, matched: false, flipped: false })));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards]);

  const [cols] = size;
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-[#F0E6FF]/75 text-xs text-center max-w-xs">
        Find matching pairs. Each card has a name as well as a color.
      </p>
      <div
        className="grid gap-2"
        role="group"
        aria-label="Memory cards"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, maxWidth: '360px', width: '100%' }}
      >
        {cards.map((card, index) => {
          const faceUp = card.flipped || card.matched;
          const state = card.matched ? 'matched' : card.flipped ? 'face up' : 'face down';
          return (
            <motion.button
              key={card.id}
              type="button"
              onClick={() => handleFlip(card.id)}
              disabled={card.matched}
              aria-label={`Card ${index + 1}, ${faceUp ? card.name : 'hidden'}, ${state}`}
              className="aspect-square rounded-xl"
              style={{ minWidth: 0 }}
              animate={{
                backgroundColor: faceUp ? card.color : '#2D2060',
              }}
              transition={{ duration: 0.3 }}
            >
              <span className="sr-only">{faceUp ? card.name : 'hidden card'}</span>
              {faceUp && (
                <span aria-hidden="true" className="block text-[10px] text-[#1E1535] font-medium">
                  {card.name.slice(0, 1).toUpperCase()}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
      <div aria-live="polite" className="min-h-[1.25rem]">
        <AnimatePresence>
          {completed && message && (
            <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-[#F0E6FF]/80 text-xs italic text-center tracking-wide">
              {message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
