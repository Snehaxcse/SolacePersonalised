import { motion } from 'framer-motion';
import { RotateCcw, Save, Play, Image, Feather, ChevronRight, ChevronLeft } from 'lucide-react';
import { ArtistPalette, MoodPalette, TexturePalette } from './StudioPalette';
import type { BgTexture, BrushType } from './studioTypes';

interface Props {
  toolbarOpacity: string;
  brush: BrushType;
  onBrush: (b: BrushType) => void;
  brushSize: number;
  onBrushSize: (n: number) => void;
  color: string;
  onColor: (c: string) => void;
  historyLen: number;
  onUndo: () => void;
  canvasBg: string | null;
  onCanvasBg: (bg: string) => void;
  bgTexture: BgTexture;
  onBgTexture: (t: BgTexture) => void;
  releasing: boolean;
  onLetItGo: () => void;
  aiActionLoading: boolean;
  onAskSolace: () => void;
  onAddSomething: () => void;
  onSave: () => void;
  replaying: boolean;
  onReplay: () => void;
  onOpenGallery: () => void;
  whisperMode: boolean;
  onToggleWhisper: () => void;
  convoOpen: boolean;
  onToggleConvo: () => void;
}

export default function StudioToolbar(props: Props) {
  const {
    toolbarOpacity, brush, onBrush, brushSize, onBrushSize, color, onColor,
    historyLen, onUndo, canvasBg, onCanvasBg, bgTexture, onBgTexture,
    releasing, onLetItGo, aiActionLoading, onAskSolace, onAddSomething,
    onSave, replaying, onReplay, onOpenGallery, whisperMode, onToggleWhisper,
    convoOpen, onToggleConvo,
  } = props;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className={`fixed left-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2 ${toolbarOpacity}`}
      >
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-2 flex flex-col gap-1 shadow-sm">
          {(['pencil', 'marker', 'watercolor', 'eraser'] as BrushType[]).map(b => (
            <button
              key={b}
              onClick={() => onBrush(b)}
              title={b}
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs transition-all duration-200 ${
                brush === b ? 'bg-[#C4622D] text-white' : 'text-[#8B6914] hover:bg-[#C4622D]/10'
              }`}
            >
              {b === 'pencil' ? '✏️' : b === 'marker' ? '🖊️' : b === 'watercolor' ? '💧' : '○'}
            </button>
          ))}
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-2 flex flex-col items-center shadow-sm">
          <input
            type="range" min={1} max={12} value={brushSize}
            onChange={e => onBrushSize(Number(e.target.value))}
            className="h-16 appearance-none cursor-pointer"
            style={{ writingMode: 'vertical-lr', direction: 'rtl', accentColor: '#C4622D' }}
          />
        </div>

        <ArtistPalette color={color} onChange={onColor} />

        <button
          onClick={onUndo}
          disabled={historyLen === 0}
          title="undo (Ctrl+Z)"
          className="bg-white/70 backdrop-blur-sm rounded-2xl p-2 shadow-sm flex items-center justify-center text-[#8B6914]/60 hover:text-[#C4622D] disabled:opacity-25 transition-colors duration-200"
        >
          <RotateCcw size={14} />
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className={`fixed right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2 ${toolbarOpacity}`}
      >
        <MoodPalette canvasBg={canvasBg} onChange={onCanvasBg} />
        <TexturePalette bgTexture={bgTexture} onChange={onBgTexture} />

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-2 flex flex-col gap-1.5 shadow-sm">
          <button
            onClick={onLetItGo}
            disabled={releasing}
            className="text-[10px] text-[#8B6914]/70 hover:text-[#C4622D] transition-colors duration-300 tracking-wide py-1"
          >
            let it go
          </button>
          <button
            type="button"
            onClick={onAskSolace}
            disabled={aiActionLoading}
            className="text-[10px] text-[#8B6914]/70 hover:text-[#C4622D] transition-colors duration-300 tracking-wide py-1 disabled:opacity-40"
          >
            ask Solace
          </button>
          <button
            type="button"
            onClick={onAddSomething}
            disabled={aiActionLoading}
            className="text-[10px] text-[#8B6914]/70 hover:text-[#C4622D] transition-colors duration-300 tracking-wide py-1 disabled:opacity-40"
          >
            add something
          </button>
          <button
            onClick={onSave}
            title="save"
            className="flex items-center justify-center text-[#8B6914]/60 hover:text-[#C4622D] transition-colors duration-200 py-1"
          >
            <Save size={13} />
          </button>
          {historyLen >= 5 && (
            <button
              onClick={onReplay}
              disabled={replaying}
              title="replay"
              className="flex items-center justify-center text-[#8B6914]/60 hover:text-[#C4622D] transition-colors duration-200 py-1 disabled:opacity-30"
            >
              <Play size={13} />
            </button>
          )}
          <button
            onClick={onOpenGallery}
            title="gallery"
            className="flex items-center justify-center text-[#8B6914]/60 hover:text-[#C4622D] transition-colors duration-200 py-1"
          >
            <Image size={13} />
          </button>
        </div>

        <button
          onClick={onToggleWhisper}
          title="whisper mode"
          className={`bg-white/70 backdrop-blur-sm rounded-2xl p-2 shadow-sm flex items-center justify-center transition-colors duration-300 ${
            whisperMode ? 'text-[#C4622D]' : 'text-[#8B6914]/40 hover:text-[#8B6914]/80'
          }`}
        >
          <Feather size={13} />
        </button>

        <button
          onClick={onToggleConvo}
          title="companion"
          aria-label={convoOpen ? 'close companion' : 'open companion'}
          aria-expanded={convoOpen}
          className="bg-white/70 backdrop-blur-sm rounded-2xl p-2 shadow-sm flex items-center justify-center text-[#8B6914]/40 hover:text-[#8B6914]/80 transition-colors duration-300"
        >
          {convoOpen ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </motion.div>
    </>
  );
}
