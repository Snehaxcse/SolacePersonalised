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
  onFinish: () => void;
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
    releasing, onLetItGo, onFinish, aiActionLoading, onAskSolace, onAddSomething,
    onSave, replaying, onReplay, onOpenGallery, whisperMode, onToggleWhisper,
    convoOpen, onToggleConvo,
  } = props;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className={`fixed left-2 sm:left-4 bottom-3 sm:bottom-auto top-auto sm:top-1/2 translate-y-0 sm:-translate-y-1/2 z-20 flex flex-row sm:flex-col gap-2 max-w-[calc(100vw-5.5rem)] sm:max-w-none overflow-x-auto sm:overflow-visible ${toolbarOpacity}`}
        aria-label="Drawing tools"
      >
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-2 flex flex-col gap-1 shadow-sm" role="group" aria-label="Brush">
          {(['pencil', 'marker', 'watercolor', 'eraser'] as BrushType[]).map(b => (
            <button
              key={b}
              type="button"
              onClick={() => onBrush(b)}
              aria-label={`${b} brush`}
              aria-pressed={brush === b}
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs transition-all duration-200 ${
                brush === b ? 'bg-[#C4622D] text-white' : 'text-[#6B4226] hover:bg-[#C4622D]/10'
              }`}
            >
              {b === 'pencil' ? '✏️' : b === 'marker' ? '🖊️' : b === 'watercolor' ? '💧' : '○'}
            </button>
          ))}
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-2 flex flex-col items-center shadow-sm">
          <label className="flex flex-col items-center gap-1">
            <span className="sr-only">Brush size {brushSize}</span>
            <input
              type="range" min={1} max={12} value={brushSize}
              onChange={e => onBrushSize(Number(e.target.value))}
              aria-valuetext={`Size ${brushSize}`}
              className="h-16 appearance-none cursor-pointer"
              style={{ writingMode: 'vertical-lr', direction: 'rtl', accentColor: '#C4622D' }}
            />
          </label>
        </div>

        <ArtistPalette color={color} onChange={onColor} />

        <button
          type="button"
          onClick={onUndo}
          disabled={historyLen === 0}
          aria-label="Undo last stroke"
          className="bg-white/70 backdrop-blur-sm rounded-2xl p-2 shadow-sm flex items-center justify-center text-[#6B4226] hover:text-[#C4622D] disabled:opacity-40 transition-colors duration-200"
        >
          <RotateCcw size={14} aria-hidden="true" />
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className={`fixed right-2 sm:right-4 top-20 sm:top-1/2 translate-y-0 sm:-translate-y-1/2 z-20 flex flex-col gap-2 max-h-[55vh] sm:max-h-none overflow-y-auto ${toolbarOpacity}`}
        aria-label="Studio actions"
      >
        <MoodPalette canvasBg={canvasBg} onChange={onCanvasBg} />
        <TexturePalette bgTexture={bgTexture} onChange={onBgTexture} />

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-2 flex flex-col gap-1.5 shadow-sm">
          <button
            type="button"
            onClick={onFinish}
            disabled={historyLen === 0 || releasing}
            aria-label="Finish this drawing"
            className="text-[10px] text-[#6B4226] hover:text-[#C4622D] transition-colors duration-300 tracking-wide py-1 disabled:opacity-40"
          >
            I'm done
          </button>
          <button
            type="button"
            onClick={onLetItGo}
            disabled={releasing || historyLen === 0}
            aria-label="Let the drawing go"
            className="text-[10px] text-[#6B4226] hover:text-[#C4622D] transition-colors duration-300 tracking-wide py-1 disabled:opacity-40"
          >
            let it go
          </button>
          <button
            type="button"
            onClick={onAskSolace}
            disabled={aiActionLoading}
            className="text-[10px] text-[#6B4226] hover:text-[#C4622D] transition-colors duration-300 tracking-wide py-1 disabled:opacity-40"
          >
            reflect
          </button>
          <button
            type="button"
            onClick={onAddSomething}
            disabled={aiActionLoading}
            className="text-[10px] text-[#6B4226] hover:text-[#C4622D] transition-colors duration-300 tracking-wide py-1 disabled:opacity-40"
          >
            add something
          </button>
          <button
            type="button"
            onClick={onSave}
            aria-label="Save drawing to gallery and download"
            className="flex items-center justify-center text-[#6B4226] hover:text-[#C4622D] transition-colors duration-200 py-1"
          >
            <Save size={13} aria-hidden="true" />
          </button>
          {historyLen >= 5 && (
            <button
              type="button"
              onClick={onReplay}
              disabled={replaying}
              aria-label="Replay drawing"
              className="flex items-center justify-center text-[#6B4226] hover:text-[#C4622D] transition-colors duration-200 py-1 disabled:opacity-40"
            >
              <Play size={13} aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={onOpenGallery}
            aria-label="Open gallery"
            className="flex items-center justify-center text-[#6B4226] hover:text-[#C4622D] transition-colors duration-200 py-1"
          >
            <Image size={13} aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleWhisper}
          aria-pressed={whisperMode}
          aria-label={whisperMode ? 'Turn whisper mode off' : 'Turn whisper mode on'}
          className={`bg-white/70 backdrop-blur-sm rounded-2xl p-2 shadow-sm flex items-center justify-center transition-colors duration-300 ${
            whisperMode ? 'text-[#C4622D]' : 'text-[#6B4226] hover:text-[#C4622D]'
          }`}
        >
          <Feather size={13} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={onToggleConvo}
          aria-label={convoOpen ? 'close companion' : 'open companion'}
          aria-expanded={convoOpen}
          className="bg-white/70 backdrop-blur-sm rounded-2xl p-2 shadow-sm flex items-center justify-center text-[#6B4226] hover:text-[#C4622D] transition-colors duration-300"
        >
          {convoOpen ? <ChevronRight size={13} aria-hidden="true" /> : <ChevronLeft size={13} aria-hidden="true" />}
        </button>
      </motion.div>
    </>
  );
}
