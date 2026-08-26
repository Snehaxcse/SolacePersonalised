import { useState } from 'react';
import { motion } from 'framer-motion';

function generateColorTiles(baseHue: number): { hsl: string; order: number }[] {
  const tiles = Array.from({ length: 8 }, (_, i) => ({
    hsl: `hsl(${baseHue}, 40%, ${20 + i * 8}%)`,
    order: i,
  }));
  return tiles.sort(() => Math.random() - 0.5).map((t, idx) => ({ ...t, idx }));
}

export default function ColorSort() {
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
