import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SOFT_COLORS = ['#C084FC', '#818CF8', '#38BDF8', '#34D399', '#FCA5A5', '#FCD34D', '#F9A8D4', '#6EE7B7'];

interface Card { id: number; color: string; matched: boolean; flipped: boolean; }

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
    // Size is derived from a completed board, not a live input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
