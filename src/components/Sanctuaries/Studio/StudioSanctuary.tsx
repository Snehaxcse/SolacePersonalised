import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SanctuaryHeader from '../../shared/SanctuaryHeader';
import { getStudioSuggestion, getAIDrawShape, type AIShapeResult } from '../../../utils/claudeService';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { useAiConsent } from '../../../context/AiConsentContext';
import { isAiEnabled } from '../../../utils/aiConsent';
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion';
import { useStudioCanvas } from './useStudioCanvas';
import StudioCanvas from './StudioCanvas';
import StudioToolbar from './StudioToolbar';
import StudioGallery, { useStudioGallery } from './StudioGallery';
import StudioCompanion from './StudioCompanion';
import StudioWhisper from './StudioWhisper';
import StudioRitual from './StudioRitual';
import type { ConvoMessage } from './studioTypes';
import { useFocusTrap } from '../../../hooks/useFocusTrap';

export default function StudioSanctuary() {
  const navigate = useNavigate();
  const { requestConsent } = useAiConsent();
  const reduceMotion = usePrefersReducedMotion();
  const [isFirstVisit] = useLocalStorage<boolean>('solace_studio_first_visit', true);
  const [, setFirstVisitDone] = useLocalStorage<boolean>('solace_studio_first_visit', true);

  const canvas = useStudioCanvas({
    onFirstStroke: () => setFirstVisitDone(false),
  });

  const gallery = useStudioGallery();
  const [whisperMode, setWhisperMode] = useState(false);
  const [convoOpen, setConvoOpen] = useState(false);
  const [messages, setMessages] = useState<ConvoMessage[]>([]);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [pendingAdd, setPendingAdd] = useState<AIShapeResult | null>(null);
  const [aiActionLoading, setAiActionLoading] = useState(false);
  const [liveMessage, setLiveMessage] = useState('');
  const [ritualOpen, setRitualOpen] = useState(false);
  const [confirmRelease, setConfirmRelease] = useState(false);
  const [satWithIt, setSatWithIt] = useState(false);
  const pendingRef = useRef<HTMLDivElement>(null);
  useFocusTrap(Boolean(pendingAdd), pendingRef, () => setPendingAdd(null));

  useEffect(() => {
    if (canvas.historyLen === 0 || canvas.isDrawing || canvas.releasing || satWithIt) {
      if (canvas.isDrawing) {
        setRitualOpen(false);
        setSatWithIt(false);
      } else if (canvas.historyLen === 0) {
        setRitualOpen(false);
      }
      return;
    }
    const timer = window.setTimeout(() => setRitualOpen(true), 1400);
    return () => window.clearTimeout(timer);
  }, [canvas.historyLen, canvas.isDrawing, canvas.releasing, satWithIt]);

  useEffect(() => {
    if (canvas.historyLen === 0) {
      setSatWithIt(false);
      setConfirmRelease(false);
    }
  }, [canvas.historyLen]);

  const askSolace = async () => {
    await requestConsent({ force: true });
    if (!isAiEnabled()) {
      setLiveMessage('Reflection stays optional. Solace will wait until AI is allowed.');
      return;
    }
    setAiActionLoading(true);
    const text = await getStudioSuggestion(canvas.getDominantColors());
    setAiActionLoading(false);
    setSuggestion(text);
    setShowSuggestion(true);
    setRitualOpen(false);
    setTimeout(() => setShowSuggestion(false), 8000);
  };

  const offerAiAdd = async () => {
    await requestConsent({ force: true });
    if (!isAiEnabled()) return;
    setAiActionLoading(true);
    const result = await getAIDrawShape(
      `canvas has ${canvas.getDominantColors()}, stroke count around ${canvas.strokeCount.current}`
    );
    setAiActionLoading(false);
    if (result) setPendingAdd(result);
  };

  const keepDrawing = () => {
    const ok = gallery.saveDrawing(canvas.canvasRef.current, canvas.canvasBg);
    setLiveMessage(ok ? 'Kept in your gallery, and downloaded.' : 'Gallery is full. Remove a piece to make room.');
    setRitualOpen(false);
    setSatWithIt(true);
  };

  const toolbarOpacity = whisperMode ? 'opacity-20 hover:opacity-100 focus-within:opacity-100 transition-opacity duration-500' : '';

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#F5ECD7' }}>
      <SanctuaryHeader sanctuary="studio" textColor="text-[#6B4226]" />
      <main id="main">
        <h1 className="sr-only">the studio</h1>
        <p className="sr-only" aria-live="polite">{liveMessage}</p>

        {isFirstVisit && (
          <p className="fixed top-16 left-1/2 -translate-x-1/2 z-20 px-4 text-[#6B4226]/70 text-xs font-light text-center tracking-wide">
            you don't have to make sense of it.
          </p>
        )}

      <StudioCanvas
        canvasRef={canvas.canvasRef}
        cursorStyle={canvas.cursorStyle}
        bgTexture={canvas.bgTexture}
        canvasBg={canvas.canvasBg}
        onPointerDown={canvas.startDrawing}
        onPointerMove={canvas.draw}
        onPointerUp={canvas.stopDrawing}
      />

      <StudioToolbar
        toolbarOpacity={toolbarOpacity}
        brush={canvas.brush}
        onBrush={canvas.setBrush}
        brushSize={canvas.brushSize}
        onBrushSize={canvas.setBrushSize}
        color={canvas.color}
        onColor={canvas.setColor}
        historyLen={canvas.historyLen}
        onUndo={canvas.undo}
        canvasBg={canvas.canvasBg}
        onCanvasBg={canvas.setCanvasBg}
        bgTexture={canvas.bgTexture}
        onBgTexture={canvas.setBgTexture}
        releasing={canvas.releasing}
        onLetItGo={() => setConfirmRelease(true)}
        onFinish={() => setRitualOpen(true)}
        aiActionLoading={aiActionLoading}
        onAskSolace={askSolace}
        onAddSomething={offerAiAdd}
        onSave={keepDrawing}
        replaying={canvas.replaying}
        onReplay={canvas.replay}
        onOpenGallery={() => gallery.setShowGallery(true)}
        whisperMode={whisperMode}
        onToggleWhisper={() => setWhisperMode(w => !w)}
        convoOpen={convoOpen}
        onToggleConvo={() => setConvoOpen(o => !o)}
      />

      <StudioWhisper
        enabled={whisperMode}
        onChange={setWhisperMode}
        convoOpen={convoOpen}
        latestMessage={messages[messages.length - 1]}
      />

      <StudioRitual
        open={ritualOpen && !canvas.releasing && !pendingAdd && !showSuggestion}
        confirmRelease={confirmRelease}
        reduceMotion={reduceMotion}
        aiLoading={aiActionLoading}
        onKeep={keepDrawing}
        onSit={() => { setRitualOpen(false); setSatWithIt(true); }}
        onReflect={askSolace}
        onTalk={() => navigate('/companion')}
        onRequestRelease={() => setConfirmRelease(true)}
        onCancelRelease={() => setConfirmRelease(false)}
        onConfirmRelease={() => {
          setConfirmRelease(false);
          setRitualOpen(false);
          canvas.letItGo({ reduceMotion });
          setLiveMessage('Released.');
        }}
      />

      <AnimatePresence>
        {canvas.replaying && (
          <motion.div
            className="fixed top-20 left-1/2 -translate-x-1/2 z-40 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full"
            initial={{ opacity: 0, y: reduceMotion ? 0 : -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          >
            <p className="text-[#6B4226] text-xs tracking-widest">replaying...</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {canvas.releasing && (
          <motion.div
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.15 : 0.6 }}
          >
            <p className="text-[#6B4226] text-sm font-light tracking-widest italic" style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
              nothing needs to happen next.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuggestion && suggestion && !convoOpen && (
          <motion.div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 max-w-xs sm:max-w-sm px-5 py-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-md"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
            transition={{ duration: reduceMotion ? 0.15 : 0.5 }}
            role="status"
            aria-live="polite"
          >
            <p className="text-[#6B4226]/80 text-sm font-light leading-relaxed text-center italic" style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
              {suggestion}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pendingAdd && (
          <motion.div
            ref={pendingRef}
            tabIndex={-1}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 px-5 py-4 bg-white/90 backdrop-blur-md rounded-2xl shadow-md max-w-xs text-center outline-none"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-add-title"
          >
            <p id="ai-add-title" className="text-[#6B4226]/80 text-sm font-light leading-relaxed italic mb-3" style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
              {pendingAdd.description}
            </p>
            <div className="flex items-center justify-center gap-4">
              <button type="button" onClick={() => { canvas.confirmAiAdd(pendingAdd); setPendingAdd(null); }} className="text-[#C4622D] text-xs">
                add to drawing
              </button>
              <button type="button" onClick={() => setPendingAdd(null)} className="text-[#6B4226] text-xs">
                keep my work
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <StudioCompanion
        open={convoOpen}
        onOpenChange={setConvoOpen}
        isFirstVisit={isFirstVisit}
        getDominantColors={canvas.getDominantColors}
        getMinutesDrawing={canvas.getMinutesDrawing}
        messages={messages}
        onMessagesChange={setMessages}
      />

      <StudioGallery
        open={gallery.showGallery}
        onOpenChange={gallery.setShowGallery}
        gallery={gallery.gallery}
        onGalleryChange={gallery.setGallery}
        galleryFull={gallery.galleryFull}
        onGalleryFullChange={gallery.setGalleryFull}
      />
      </main>
    </div>
  );
}
