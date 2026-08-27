import { useState, type KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion';

function generateColorTiles(baseHue: number) {
  const tiles = Array.from({ length: 8 }, (_, i) => ({
    hsl: `hsl(${baseHue}, 40%, ${20 + i * 8}%)`,
    order: i,
    id: `${baseHue}-${i}`,
  }));
  return tiles.sort(() => Math.random() - 0.5);
}

function shadeLabel(order: number) {
  if (order === 0) return 'darkest';
  if (order === 7) return 'lightest';
  return `shade ${order + 1}`;
}

export default function ColorSort() {
  const reduceMotion = usePrefersReducedMotion();
  const [hue] = useState(() => Math.floor(Math.random() * 360));
  const [tiles, setTiles] = useState(() => generateColorTiles(hue));
  const [solved, setSolved] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  const checkSolved = (t: typeof tiles) => {
    for (let i = 0; i < t.length - 1; i++) {
      if (t[i].order > t[i + 1].order) return false;
    }
    return true;
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= tiles.length || from === to || solved) return;
    const next = [...tiles];
    const [removed] = next.splice(from, 1);
    next.splice(to, 0, removed);
    setTiles(next);
    setSelected(to);
    if (checkSolved(next)) setSolved(true);
  };

  const onTileKey = (event: KeyboardEvent, index: number) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      move(index, index - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      move(index, index + 1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setSelected(index);
    }
  };

  const newGame = () => {
    const newHue = Math.floor(Math.random() * 360);
    setTiles(generateColorTiles(newHue));
    setSolved(false);
    setSelected(null);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-[#F0E6FF]/75 text-xs tracking-wide text-center max-w-sm">
        Arrange from darkest to lightest. Select a tile, then move it, or use the arrow keys.
      </p>
      <ul className="flex gap-2 flex-wrap justify-center list-none p-0 m-0" aria-label="Color tiles">
        {tiles.map((tile, idx) => (
          <li key={tile.id}>
            <motion.button
              type="button"
              aria-pressed={selected === idx}
              aria-label={`${shadeLabel(tile.order)}, position ${idx + 1} of ${tiles.length}`}
              className={`w-14 h-16 sm:w-12 sm:h-16 rounded-xl ${selected === idx ? 'ring-2 ring-[#F0E6FF] ring-offset-2 ring-offset-[#1E1535]' : ''}`}
              style={{ backgroundColor: tile.hsl }}
              onClick={() => setSelected(idx)}
              onKeyDown={e => onTileKey(e, idx)}
              animate={solved && !reduceMotion ? { scale: [1, 1.05, 1] } : {}}
              transition={solved && !reduceMotion ? { duration: 0.4, delay: idx * 0.05 } : { duration: 0 }}
            />
          </li>
        ))}
      </ul>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => selected !== null && move(selected, selected - 1)}
          disabled={selected === null || selected === 0 || solved}
          className="text-xs text-[#C084FC] border border-[#C084FC]/30 rounded-full px-4 py-2 disabled:opacity-40"
        >
          Move left
        </button>
        <button
          type="button"
          onClick={() => selected !== null && move(selected, selected + 1)}
          disabled={selected === null || selected === tiles.length - 1 || solved}
          className="text-xs text-[#C084FC] border border-[#C084FC]/30 rounded-full px-4 py-2 disabled:opacity-40"
        >
          Move right
        </button>
      </div>
      <div aria-live="polite" className="min-h-[3rem] text-center">
        {solved && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-[#F0E6FF]/80 text-xs italic mb-3">there.</p>
            <button type="button" onClick={newGame} className="text-xs text-[#C084FC] tracking-wide">
              another color
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
